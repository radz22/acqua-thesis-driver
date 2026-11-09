export type OtpPurpose = "email-verification" | "forget-password";

type ResetDraft = {
  email: string;
  otp: string;
};

let resetDraft: ResetDraft | null = null;

export function setResetDraft(draft: ResetDraft) {
  resetDraft = draft;
}

export function getResetDraft(): ResetDraft | null {
  return resetDraft;
}

export function clearResetDraft() {
  resetDraft = null;
}
