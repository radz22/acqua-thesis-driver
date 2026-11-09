type AuthErrorLike = {
  code?: string | undefined;
  message?: string | undefined;
};

export function authErrorMessage(error: AuthErrorLike | null | undefined, fallback: string) {
  const code = error?.code ?? "";
  const message = error?.message ?? "";
  const haystack = `${code} ${message}`.toLowerCase();

  if (haystack.includes("email_not_verified") || haystack.includes("email not verified")) {
    return "Verify your email before signing in.";
  }
  if (haystack.includes("invalid_email_or_password") || haystack.includes("invalid password")) {
    return "Email or password is incorrect.";
  }
  if (haystack.includes("user_already_exists") || haystack.includes("already exists")) {
    return "An account with this email already exists.";
  }
  if (haystack.includes("invalid_otp") || haystack.includes("invalid otp")) {
    return "That code is incorrect. Try again.";
  }
  if (haystack.includes("otp_expired") || haystack.includes("expired")) {
    return "That code has expired. Send a new one.";
  }
  if (haystack.includes("too_many_attempts")) {
    return "Too many tries. Request a new code.";
  }
  if (haystack.includes("invalid_email")) {
    return "Enter a valid email address.";
  }

  return message.trim() || fallback;
}

export function isEmailNotVerified(error: AuthErrorLike | null | undefined) {
  const haystack = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
  return haystack.includes("email_not_verified") || haystack.includes("email not verified");
}

export function isEmailTaken(error: AuthErrorLike | null | undefined) {
  const haystack = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
  return haystack.includes("user_already_exists") || haystack.includes("already exists");
}
