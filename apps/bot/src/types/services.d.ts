declare module '@et-id-ocr/id-engine' {
  export function generateID(front: Buffer, back: Buffer, third: Buffer): Promise<{ image: Buffer, format: string }>;
}

declare module '@et-id-ocr/credit-engine' {
  export function addCredits(userId: string, amount: number): Promise<void>;
  export function deductCredits(userId: string, amount: number): Promise<void>;
  export function getBalance(userId: string): Promise<number>;
}

declare module '@et-id-ocr/payment-engine' {
  export function createPayment(userId: string, data: any): Promise<any>;
  export function approvePayment(paymentId: string, adminId: string): Promise<void>;
  export function rejectPayment(paymentId: string, adminId: string): Promise<void>;
  export function getPendingPayments(): Promise<any[]>;
}
