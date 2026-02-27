import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Poll DB every 2 seconds, max 2 minutes (60 attempts)
      const MAX_ATTEMPTS = 60;
      let attempts = 0;

      const interval = setInterval(async () => {
        attempts++;

        try {
          const job = await prisma.job.findUnique({
            where: { id: jobId, userId: session.user.id }, 
          });

          if (!job) {
            send({ status: "NOT_FOUND" });
            clearInterval(interval);
            controller.close();
            return;
          }

          if (job.status === "SUCCESS") {
            send({ status: "SUCCESS", output: job.output });
            clearInterval(interval);
            controller.close();
            return;
          }

          if (job.status === "FAILED") {
            send({ status: "FAILED", error: "Processing failed. No credits deducted." });
            clearInterval(interval);
            controller.close();
            return;
          }

          // Still processing
          send({ status: "PROCESSING", attempt: attempts });

          if (attempts >= MAX_ATTEMPTS) {
            send({ status: "TIMEOUT" });
            clearInterval(interval);
            controller.close();
          }
        } catch (err) {
          console.error(`SSE Error for job ${jobId}:`, err);
          send({ status: "ERROR", message: "Internal server error" });
          clearInterval(interval);
          controller.close();
        }
      }, 2000);

      // Clean up on close
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
