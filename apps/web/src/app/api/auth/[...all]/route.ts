import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { startCleanupJob } from "@/lib/cleanup";

// Start background cleanup job on server init
startCleanupJob();

export const { GET, POST } = toNextJsHandler(auth);
