import { createFileRoute } from "@tanstack/react-router";
import { handleChat } from "@/lib/delux/assistant.server";

export const Route = createFileRoute("/api/assistant/chat")({
  server: { handlers: { POST: ({ request }) => handleChat(request) } },
});
