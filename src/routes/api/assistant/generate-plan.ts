import { createFileRoute } from "@tanstack/react-router";
import { handleGeneratePlan } from "@/lib/delux/assistant.server";

export const Route = createFileRoute("/api/assistant/generate-plan")({
  server: { handlers: { POST: ({ request }) => handleGeneratePlan(request) } },
});
