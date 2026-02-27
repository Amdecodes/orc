import { useEffect, useState } from "react";

export type JobStatus = "PROCESSING" | "SUCCESS" | "FAILED" | "TIMEOUT" | "IDLE" | "ERROR" | "NOT_FOUND";

export function useJobStatus(jobId: string | null) {
  const [status, setStatus] = useState<JobStatus>("IDLE");
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setStatus("IDLE");
      setOutput(null);
      setError(null);
      return;
    }

    const eventSource = new EventSource(`/api/jobs/${jobId}/status`);

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setStatus(data.status);

        if (data.status === "SUCCESS") {
          setOutput(data.output);
          eventSource.close();
        }

        if (data.status === "FAILED" || data.status === "TIMEOUT" || data.status === "ERROR" || data.status === "NOT_FOUND") {
          setError(data.error || data.message || "Something went wrong.");
          eventSource.close();
        }
      } catch (err) {
        console.error("Error parsing SSE data:", err);
        setError("Failed to parse status update.");
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setError("Connection lost or server error. Please check your connection.");
      setStatus("ERROR");
      eventSource.close();
    };

    // Cleanup on unmount or jobId change
    return () => eventSource.close();
  }, [jobId]);

  return { status, output, error };
}
