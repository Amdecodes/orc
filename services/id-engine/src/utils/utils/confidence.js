/**
 * Compositional Confidence Scoring Model
 * 
 * Rules:
 * - QR decoded -> +0.4
 * - FIN valid -> +0.2
 * - Phone valid -> +0.2
 * - Dates valid -> +0.2
 * Max = 1.0
 */
export function calculateCompositionalConfidence(evidence) {
    let score = 0;

    if (evidence.qrDecoded) score += 0.4;
    if (evidence.finValid) score += 0.2;
    if (evidence.phoneValid) score += 0.2;
    if (evidence.datesValid) score += 0.2;

    return parseFloat(score.toFixed(1));
}
