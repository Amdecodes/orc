/**
 * Validates Ethiopian Digital ID (FIN).
 * Rule: Numeric only, fixed length 12.
 */
export function validateFIN(fin) {
    if (!fin) return { valid: false, reason: "Missing FIN" };
    const clean = String(fin).replace(/\D/g, "");
    const isValid = /^\d{12}$/.test(clean);
    return {
        valid: isValid,
        value: clean,
        reason: isValid ? null : "Invalid format (Must be 12 digits)"
    };
}
