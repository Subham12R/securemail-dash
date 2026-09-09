const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateWorkEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = email.trim();
  if (!trimmed) {
    return { valid: false, error: "Email address is required." };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Please enter a valid work email address." };
  }
  return { valid: true };
}

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf("@");
  if (atIndex <= 1) return trimmed;

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex);

  if (local.length <= 2) {
    return `${local[0]}*${domain}`;
  }

  const first = local[0];
  const last = local[local.length - 1];
  const stars = "*".repeat(Math.min(3, local.length - 2));
  return `${first}${stars}${last}${domain}`;
}
