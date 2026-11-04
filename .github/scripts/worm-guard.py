#!/usr/bin/env python3
"""worm-guard: detect the JS config-file supply-chain worm (Oct 2026 incident).

Pure python3 stdlib. Reads files only, never runs repo code or installs deps.

Usage:
  worm-guard.py scan [--root DIR] [--event push|pull_request] [--base SHA]
                     [--default-branch NAME] [--no-git]
  worm-guard.py direct-push --before SHA --after SHA --repo OWNER/NAME
                     --actor LOGIN [--ref REF] [--forced true|false]

Exit codes: 0 = clean, 1 = findings that fail the job, 2 = usage/internal error.
"""
import argparse, fnmatch, json, os, re, subprocess, sys, time, urllib.request, urllib.error

# ---------------------------------------------------------------- signatures
# Built from pieces so this file never matches its own signatures.
def _j(*p): return "".join(p)
SIG_STRONG = [
    (re.compile(re.escape(_j("global", ".o")) + r"\s*=\s*['\"]8-"), _j("global", ".o='8-..' marker")),
    (re.compile(re.escape(_j("global", ".o")) + r"\s*=\s*['\"]"), _j("global", ".o= marker")),
    (re.compile(re.escape(_j("_$_", "fe20"))), _j("_$_", "fe20 marker")),
    (re.compile(re.escape(_j("_$", "jsoPow"))), _j("_$", "jsoPow marker")),
]
SIG_DAF = re.compile(_j(r"\bda", r"F\("))  # only counts next to obfuscation
WS_RUN = re.compile(r"[ \t]{200,}(?=\S)")
CFG_IMPORT = re.compile(r"""import\s*\{\s*createRequire\s*\}\s*from\s*['"](node:)?module['"]""")
CFG_REQDEF = re.compile(r"""(?:const|let|var)\s+require\s*=\s*createRequire\(\s*import\.meta\.url\s*\)""")
REQ_USE = re.compile(r"""\brequire\s*(\(|\.resolve\b)""")
SUSPICIOUS_ADDED = [
    (re.compile(r"\beval\s*\("), "eval("),
    (re.compile(r"\bnew\s+Function\s*\("), "new Function("),
    (re.compile(r"\batob\s*\("), "atob("),
    (re.compile(r"String\.fromCharCode\s*\("), "String.fromCharCode"),
    (re.compile(r"""Buffer\.from\([^)]*['"]base64['"]"""), "Buffer.from(..base64)"),
    (re.compile(r"""\bchild_process\b"""), "child_process"),
    (re.compile(r"(\\x[0-9a-fA-F]{2}){8,}"), "hex escape run"),
]
LIFECYCLE = ["preinstall", "install", "postinstall", "prepublish", "preprepare", "prepare", "postprepare"]

CONFIG_RE = re.compile(
    r"^(postcss|eslint|tailwind|vite|vitest|next|nuxt|metro|babel|app|svelte|astro|webpack|rollup|"
    r"jest|prettier|stylelint|commitlint|lint-staged|drizzle|playwright|tsup|expo|react-native|"
    r"remix|electron|capacitor|turbo|rsbuild|rspack|esbuild|unocss|uno|panda|vue)\.config(\.[\w-]+)*\.(c|m)?(j|t)sx?$"
    r"|^\.(eslintrc|babelrc|prettierrc|stylelintrc|lintstagedrc)\.(c|m)?js$"
    r"|^(babel|metro|app)\.config\.json$", re.I)
UNTITLED_RE = re.compile(r"^untitled(?:[ _-]?\d+)?$", re.I)

SKIP_DIRS = {"node_modules", ".git", "dist", "build", ".next", ".nuxt", ".output", "out", "coverage",
             ".expo", ".turbo", ".vercel", "vendor", ".svelte-kit", "storybook-static", "Pods"}
LOCKFILES = {"package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb", "bun.lock", "composer.lock",
             "Gemfile.lock", "Podfile.lock", "Cargo.lock", "poetry.lock", "npm-shrinkwrap.json"}
BIN_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".icns", ".bmp", ".tiff", ".avif", ".heic",
           ".pdf", ".zip", ".gz", ".tgz", ".7z", ".rar", ".jar", ".aab", ".apk", ".ipa", ".keystore", ".jks",
           ".woff", ".woff2", ".ttf", ".otf", ".eot", ".mp3", ".mp4", ".mov", ".wav", ".ogg", ".webm",
           ".psd", ".ai", ".sketch", ".fig", ".so", ".dylib", ".dll", ".exe", ".bin", ".wasm", ".node",
           ".db", ".sqlite", ".lottie", ".riv", ".xcf"}
MINIFIED = re.compile(r"\.min\.(js|mjs|cjs|css)$|\.map$|\.bundle\.js$|\.chunk\.js$", re.I)
SELF_FILES = {".github/workflows/worm-guard.yml", ".github/scripts/worm-guard.py"}
ALLOW_FILE = ".github/worm-guard-allow"   # glob per line: skips HEURISTIC checks only, never signatures
CLEANUP_TITLE = "security: remove injected malware from config files"
INSTALL_TITLE = "ci: add worm-guard workflow"
DIRECT_PUSH_BRANCHES = {"main", "master", "dev", "develop", "staging", "production"}
MAX_BYTES = 20 * 1024 * 1024

# ---------------------------------------------------------------- reporting
class Report:
    def __init__(self):
        self.errors, self.warnings, self.notices = [], [], []
    def _esc(self, s, prop=False):
        s = str(s).replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
        return s.replace(":", "%3A").replace(",", "%2C") if prop else s
    def add(self, level, path, line, title, msg):
        bucket = {"error": self.errors, "warning": self.warnings, "notice": self.notices}[level]
        key = (path, line, title)
        if any((e[0], e[1], e[2]) == key for e in bucket): return
        bucket.append((path, line, title, msg))
        props = []
        if path: props.append("file=" + self._esc(path, True))
        if line: props.append("line=%d" % line)
        props.append("title=" + self._esc("worm-guard: " + title, True))
        print("::%s %s::%s" % (level, ",".join(props), self._esc(msg)), flush=True)
    def summary(self, heading, extra=""):
        out = ["## %s" % heading, ""]
        if not (self.errors or self.warnings):
            out.append(":white_check_mark: No findings.")
        for name, rows in (("Errors (fail)", self.errors), ("Warnings", self.warnings), ("Notices", self.notices)):
            if rows:
                out += ["### " + name, "", "| File | Line | Check | Detail |", "|---|---|---|---|"]
                for p, l, t, m in rows:
                    out.append("| `%s` | %s | %s | %s |" % (p or "-", l or "", t, m.replace("|", "\\|")))
                out.append("")
        if extra: out += ["", extra]
        text = "\n".join(out) + "\n"
        sf = os.environ.get("GITHUB_STEP_SUMMARY")
        if sf:
            with open(sf, "a", encoding="utf-8") as fh: fh.write(text)
        else:
            print("\n" + text)

def snip(s, n=60):
    s = s.strip()
    return (s[:n] + "...") if len(s) > n else s

# ---------------------------------------------------------------- helpers
def git(*args, root=".", check=True):
    r = subprocess.run(["git", "-C", root, *args], capture_output=True)
    if check and r.returncode != 0:
        raise RuntimeError("git %s failed: %s" % (" ".join(args), r.stderr.decode(errors="replace").strip()))
    return r.stdout.decode("utf-8", errors="replace") if r.returncode == 0 else None

def git_ok(root, *args):
    return subprocess.run(["git", "-C", root, *args], capture_output=True).returncode == 0

def is_config(path): return bool(CONFIG_RE.match(os.path.basename(path)))

def in_skip_dir(path): return any(part in SKIP_DIRS for part in path.split("/")[:-1])

def load_allow(root):
    p = os.path.join(root, ALLOW_FILE)
    if not os.path.isfile(p): return []
    return [l.strip() for l in open(p, encoding="utf-8", errors="replace") if l.strip() and not l.startswith("#")]

def list_files(root, use_git):
    if use_git:
        out = git("ls-files", "-z", root=root)
        return [f for f in out.split("\0") if f]
    files = []
    for d, dirs, names in os.walk(root):
        dirs[:] = [x for x in dirs if x != ".git"]
        for n in names:
            files.append(os.path.relpath(os.path.join(d, n), root).replace(os.sep, "/"))
    return sorted(files)

def read_text(full):
    try:
        if os.path.islink(full) or not os.path.isfile(full): return None
        if os.path.getsize(full) > MAX_BYTES: return None
        data = open(full, "rb").read()
    except OSError:
        return None
    if b"\0" in data[:8192]: return None
    return data.decode("utf-8", errors="replace")

# ---------------------------------------------------------------- content checks (hard fail)
def scan_content(path, text, rep, heuristics=True):
    lines = text.split("\n")
    cfg = is_config(path)
    traits = []          # (line, title, msg) worm traits found in this file
    for i, ln in enumerate(lines, 1):
        for rx, name in SIG_STRONG:
            if rx.search(ln):
                traits.append((i, "known worm signature", "found %s" % name)); break
        ws = WS_RUN.search(ln) if heuristics else None
        if ws:
            traits.append((i, "hidden code after whitespace run",
                           "%d spaces/tabs then code at col %d (classic worm hiding trick)" % (len(ws.group(0)), ws.end() + 1)))
        if cfg and heuristics and len(ln) > 1000:
            traits.append((i, "overlong line in config file", "line is %d chars long" % len(ln)))
    obfuscated = bool(traits) or (heuristics and any(len(l) > 1000 for l in lines))
    if SIG_DAF.search(text) and obfuscated:
        i = next(n for n, l in enumerate(lines, 1) if SIG_DAF.search(l))
        traits.append((i, "known worm signature", "found obfuscated call marker next to other worm traits"))
    # createRequire block in config files
    if cfg:
        imp = next((n for n, l in enumerate(lines, 1) if CFG_IMPORT.search(l)), None)
        dfn = next((n for n, l in enumerate(lines, 1) if CFG_REQDEF.search(l)), None)
        if imp and dfn:
            # is `require` actually used? ignore the definition line and any payload after a whitespace run
            used = False
            for n, l in enumerate(lines, 1):
                if n == dfn: continue
                m = WS_RUN.search(l)
                body = l[:m.start()] if m else l
                if len(body) > 1000: body = body[:1000]
                if REQ_USE.search(body): used = True; break
            if traits or not used:
                why = "paired with other worm traits" if traits else "`require` is defined but never used"
                traits.append((imp, "injected createRequire block",
                               "createRequire(import.meta.url) block in config file, %s" % why))
            else:
                rep.add("notice", path, imp, "createRequire in config",
                        "createRequire(import.meta.url) found but `require` is used and no other worm traits; looks legitimate")
    for (i, title, msg) in traits:
        rep.add("error", path, i, title, msg)
    return bool(traits)

def full_scan(root, use_git, rep):
    allow = load_allow(root)
    files = list_files(root, use_git)
    scanned = 0
    for f in files:
        base = os.path.basename(f)
        if base in LOCKFILES or f.split("/")[0] == "node_modules" or "/node_modules/" in f: continue
        if UNTITLED_RE.match(base) and "." not in base:
            rep.add("error", f, 1, "suspicious 'Untitled' file",
                    "extensionless file named like an editor scratch buffer; the worm used these to dump secrets. Delete it and rotate any secrets it held.")
        ext = os.path.splitext(base)[1].lower()
        if ext in BIN_EXT: continue
        text = read_text(os.path.join(root, f))
        if text is None: continue
        scanned += 1
        heur = not (in_skip_dir(f) or MINIFIED.search(base) or any(fnmatch.fnmatch(f, g) for g in allow))
        scan_content(f, text, rep, heuristics=heur)
    return scanned, len(files)

# ---------------------------------------------------------------- diff checks (warn on push, fail on PR)
ZERO = "0" * 40

def resolve_base(root, event, base, default_branch):
    if base and base != ZERO and git_ok(root, "cat-file", "-e", base + "^{commit}"):
        mb = git("merge-base", base, "HEAD", root=root, check=False)
        return (mb or base).strip()
    if default_branch:
        for ref in ("origin/" + default_branch, default_branch):
            if git_ok(root, "rev-parse", "--verify", "-q", ref):
                mb = git("merge-base", ref, "HEAD", root=root, check=False)
                if mb and mb.strip() != git("rev-parse", "HEAD", root=root).strip():
                    return mb.strip()
    if git_ok(root, "rev-parse", "--verify", "-q", "HEAD^"):
        return git("rev-parse", "HEAD^", root=root).strip()
    return None

def show(root, rev, path):
    return git("show", "%s:%s" % (rev, path), root=root, check=False)

def lifecycle_scripts(text):
    try:
        s = json.loads(text or "{}").get("scripts") or {}
        return {k: s.get(k) for k in LIFECYCLE if k in s}
    except Exception:
        return None

def diff_scan(root, base, level, rep):
    out = git("diff", "--name-status", "-z", "-M", base, "HEAD", root=root)
    parts = [p for p in out.split("\0") if p != ""]
    changes, i = [], 0
    while i < len(parts):
        st = parts[i]
        if st[0] in "RC": changes.append((st[0], parts[i + 2], parts[i + 1])); i += 3
        else: changes.append((st[0], parts[i + 1], None)); i += 2
    # scripts that CI workflows execute (e.g. scripts/open-promotion-pr.sh) run with the workflow's token
    ci_scripts = set()
    for wf in (git("ls-files", ".github/workflows", root=root, check=False) or "").split("\n"):
        if wf and wf not in SELF_FILES:
            ci_scripts.update(re.findall(r"(?<![\w/.-])\.?/?((?:scripts|bin|tools|\.github/scripts)/[\w./-]+)", show(root, "HEAD", wf) or ""))
    for st, path, old in changes:
        if st == "D": continue
        if path in ci_scripts:
            rep.add(level, path, 1, "CI-executed script changed",
                    "this script is run by a GitHub workflow (with its token); needs owner review.")
        base_name = os.path.basename(path)
        if base_name == ".npmrc":
            rep.add(level, path, 1, ".npmrc changed",
                    ".npmrc added/changed. It can enable install scripts or point to a rogue registry; needs owner review.")
        if path in SELF_FILES:
            rep.add("warning", path, 1, "worm-guard itself changed",
                    "the guard workflow/script was modified in this change; make sure an owner reviewed it.")
        elif path.startswith(".github/workflows/") or path.startswith(".github/actions/"):
            rep.add(level, path, 1, "workflow changed",
                    "CI workflow added/changed; workflows can exfiltrate secrets. Needs owner review.")
        if re.match(r"^\.env(\..+)?$", base_name) and not re.search(r"example|sample|template|dist$", base_name, re.I) and st == "A":
            rep.add(level, path, 1, "env file committed", "a .env file was added; it may contain secrets.")
        if base_name == "package.json":
            new = show(root, "HEAD", path)
            prev = show(root, base, old or path) if st != "A" else "{}"
            a, b = lifecycle_scripts(prev), lifecycle_scripts(new)
            if a is None or b is None:
                rep.add(level, path, 1, "package.json unparsable", "could not parse package.json to compare install scripts")
            else:
                for k in LIFECYCLE:
                    if a.get(k) != b.get(k):
                        ln = next((n for n, l in enumerate((new or "").split("\n"), 1) if re.search(r'"%s"\s*:' % k, l)), 1)
                        rep.add(level, path, ln, "install script changed",
                                "`%s` changed: %r -> %r. Install-time scripts run on every npm/pnpm install." % (k, a.get(k), b.get(k)))
        if is_config(path):
            d = git("diff", "-U0", base, "HEAD", "--", path, root=root, check=False) or ""
            ln = 0
            for l in d.split("\n"):
                m = re.match(r"^@@ -\d+(?:,\d+)? \+(\d+)", l)
                if m: ln = int(m.group(1)); continue
                if l.startswith("+") and not l.startswith("+++"):
                    for rx, name in SUSPICIOUS_ADDED:
                        if rx.search(l):
                            rep.add(level, path, ln, "suspicious code in config",
                                    "added line uses %s in a build config file: %s" % (name, snip(l[1:])))
                    ln += 1
    return len(changes)

# ---------------------------------------------------------------- direct-push check
def gh_api(url, token):
    req = urllib.request.Request(url, headers={
        "Authorization": "Bearer " + token, "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "worm-guard"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())

def commit_has_merged_pr(repo, sha, token, retries=3):
    for attempt in range(retries):
        try:
            prs = gh_api("%s/repos/%s/commits/%s/pulls" % (os.environ.get("GITHUB_API_URL", "https://api.github.com").rstrip("/"), repo, sha), token)
        except urllib.error.HTTPError as e:
            if attempt == retries - 1: raise
            time.sleep(5); continue
        if any(p.get("merged_at") for p in prs): return True, [p["number"] for p in prs if p.get("merged_at")]
        if attempt < retries - 1: time.sleep(float(os.environ.get("WORM_GUARD_RETRY_SLEEP", "10")))   # association can lag a few seconds after a merge
    return False, []

def exempt(root, sha, title):
    files = [f for f in (git("diff-tree", "--no-commit-id", "--name-only", "-r", "--root", sha, root=root, check=False) or "").split("\n") if f]
    if not files:
        return False
    if title == CLEANUP_TITLE:
        return all(is_config(f) or UNTITLED_RE.match(os.path.basename(f)) for f in files)
    if title == INSTALL_TITLE:
        return all(f in SELF_FILES or f == ALLOW_FILE for f in files)
    return False

def direct_push(a):
    rep = Report()
    root = a.root
    branch = (a.ref or "").replace("refs/heads/", "")
    if branch not in DIRECT_PUSH_BRANCHES:
        print("branch %s is not a watched branch; skipping" % branch); return 0
    token = os.environ.get("GITHUB_TOKEN")
    if not token: print("GITHUB_TOKEN missing", file=sys.stderr); return 2
    if a.forced == "true":
        rep.add("error", None, None, "force push",
                "%s force-pushed %s (%s..%s). History was rewritten; this is how the worm got in." % (a.actor, branch, a.before[:7], a.after[:7]))
    if a.before and a.before != ZERO and git_ok(root, "cat-file", "-e", a.before + "^{commit}"):
        shas = (git("rev-list", "--reverse", "%s..%s" % (a.before, a.after), root=root) or "").split()
    else:
        shas = [c for c in (a.commits or "").split() if c] or [a.after]
    if len(shas) > 300:
        rep.add("warning", None, None, "large push", "%d commits pushed; checking the newest 300 only" % len(shas)); shas = shas[-300:]
    flagged = []
    for sha in shas:
        title = (git("log", "-1", "--format=%s", sha, root=root, check=False) or "").strip()
        author = (git("log", "-1", "--format=%an <%ae>", sha, root=root, check=False) or "").strip()
        if title in (CLEANUP_TITLE, INSTALL_TITLE):
            if exempt(root, sha, title):
                rep.add("notice", None, None, "exempt commit", "%s '%s' exempt (touches only allowed files)" % (sha[:7], title)); continue
            rep.add("warning", None, None, "exemption refused",
                    "%s uses an exempt title but touches other files, so it is checked normally" % sha[:7])
        ok, nums = commit_has_merged_pr(a.repo, sha, token)
        if ok:
            rep.add("notice", None, None, "via PR", "%s came from merged PR #%s" % (sha[:7], ",".join(map(str, nums))))
        else:
            flagged.append(sha)
            rep.add("error", None, None, "direct push",
                    "%s pushed %s straight to %s without a merged PR (author %s, \"%s\"). Open a PR so worm-guard can scan it first."
                    % (a.actor, sha[:7], branch, author, snip(title, 70)))
    extra = "Pusher: `%s` · Branch: `%s` · Commits checked: %d · Without merged PR: %d" % (a.actor, branch, len(shas), len(flagged))
    rep.summary("worm-guard: direct-push check", extra)
    return 1 if rep.errors else 0

# ---------------------------------------------------------------- main
def scan(a):
    rep = Report()
    use_git = not a.no_git and git_ok(a.root, "rev-parse", "--is-inside-work-tree")
    scanned, total = full_scan(a.root, use_git, rep)
    n_changes, base = 0, None
    if use_git and a.event:
        level = "error" if a.event == "pull_request" else "warning"
        base = resolve_base(a.root, a.event, a.base, a.default_branch)
        if base: n_changes = diff_scan(a.root, base, level, rep)
        else: rep.add("notice", None, None, "no diff base", "could not find a base commit; diff checks skipped")
    extra = "Files scanned: %d of %d tracked · Diff base: `%s` · Changed files checked: %d" % (
        scanned, total, (base or "n/a")[:12], n_changes)
    rep.summary("worm-guard: malware scan", extra)
    return 1 if rep.errors else 0

def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("scan")
    s.add_argument("--root", default=".")
    s.add_argument("--event", default="")
    s.add_argument("--base", default="")
    s.add_argument("--default-branch", default="")
    s.add_argument("--no-git", action="store_true")
    d = sub.add_parser("direct-push")
    d.add_argument("--root", default=".")
    d.add_argument("--repo", required=True)
    d.add_argument("--actor", required=True)
    d.add_argument("--ref", required=True)
    d.add_argument("--before", default="")
    d.add_argument("--after", required=True)
    d.add_argument("--forced", default="false")
    d.add_argument("--commits", default="", help="space-separated shas (fallback when before is zero)")
    a = p.parse_args()
    try:
        return scan(a) if a.cmd == "scan" else direct_push(a)
    except Exception as e:
        print("::error title=worm-guard internal error::%s" % e); return 2

if __name__ == "__main__":
    sys.exit(main())
