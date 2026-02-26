/**
 * Validates Ethiopian phone numbers.
 * Rule: Must match ^09\d{8}$
 * No +251, no spaces.
 */
export function validatePhone(phone) {
    if (!phone) return { valid: false, reason: "Missing phone" };
    const clean = String(phone).replace(/\D/g, "");
    const isValid = /^09\d{8}$/.test(clean);
    return {
        valid: isValid,
        value: clean,
        reason: isValid ? null : "Invalid format (Must be 10 digits starting with 09)"
    };
}
