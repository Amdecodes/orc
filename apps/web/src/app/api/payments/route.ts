import { auth } from "@/lib/auth";
import { createPayment } from "@et-id-ocr/payment-engine";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { packageId, amount, credits, method, referenceText, proofUrl } = await req.json();

  try {
    const payment = await createPayment(session.user.id, {
      packageId,
      amount,
      credits,
      method,
      referenceText,
      proofUrl,
    });

    return NextResponse.json({ success: true, paymentId: payment.id });
  } catch (error) {
    console.error("Payment Submission Error:", error);
    return NextResponse.json({ error: "Failed to submit payment" }, { status: 500 });
  }
}
