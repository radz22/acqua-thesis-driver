type AuthErrorLike = {
  code?: string | undefined;
  message?: string | undefined;
};

function errorHaystack(error: unknown) {
  if (!error) return "";
  if (typeof error === "string") return error.toLowerCase();
  if (typeof error !== "object") return "";

  const record = error as AuthErrorLike & { cause?: unknown; name?: unknown };
  const cause =
    record.cause && typeof record.cause === "object" && "message" in record.cause
      ? String((record.cause as { message?: unknown }).message ?? "")
      : "";

  return `${record.name ?? ""} ${record.code ?? ""} ${record.message ?? ""} ${cause}`.toLowerCase();
}

export function authErrorMessage(error: unknown, fallback: string) {
  const haystack = errorHaystack(error);

  if (
    haystack.includes("failed to fetch") ||
    haystack.includes("network request failed") ||
    haystack.includes("network error") ||
    haystack.includes("load failed")
  ) {
    return "Can't reach the server. Check that the backend is running.";
  }

  if (haystack.includes("email_not_verified") || haystack.includes("email not verified")) {
    return "Verify your email before signing in.";
  }
  if (haystack.includes("invalid_email_or_password") || haystack.includes("invalid password")) {
    return "Email or password is incorrect.";
  }
  if (haystack.includes("user_already_exists") || haystack.includes("already exists")) {
    return "An account with this email already exists.";
  }
  if (haystack.includes("user_not_found") || haystack.includes("user not found")) {
    return "No account found with this email.";
  }
  if (haystack.includes("invalid_otp") || haystack.includes("invalid otp")) {
    return "That code is incorrect. Try again.";
  }
  if (haystack.includes("otp_expired") || haystack.includes("otp expired")) {
    return "That code has expired. Send a new one.";
  }
  if (haystack.includes("too_many_attempts")) {
    return "Too many tries. Request a new code.";
  }
  if (haystack.includes("invalid_email")) {
    return "Enter a valid email address.";
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as AuthErrorLike).message ?? "").trim();
    if (message) return message;
  }
  if (typeof error === "string" && error.trim()) return error.trim();

  return fallback;
}

export function isEmailNotVerified(error: AuthErrorLike | null | undefined) {
  const haystack = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
  return haystack.includes("email_not_verified") || haystack.includes("email not verified");
}

export function isEmailTaken(error: AuthErrorLike | null | undefined) {
  const haystack = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
  return haystack.includes("user_already_exists") || haystack.includes("already exists");
}

export function isUserNotFound(error: AuthErrorLike | null | undefined) {
  const haystack = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
  return haystack.includes("user_not_found") || haystack.includes("user not found");
}

export function needsNewOtp(error: AuthErrorLike | null | undefined) {
  const haystack = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
  return (
    haystack.includes("otp_expired") ||
    haystack.includes("otp expired") ||
    haystack.includes("too_many_attempts")
  );
}
