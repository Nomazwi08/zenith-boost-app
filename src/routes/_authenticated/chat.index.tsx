import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";
import { createThread, listThreads } from "@/lib/threads.functions";
import { Sparkles, MessageSquarePlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat/")({
  head: () => ({ meta: [{ title: "Chat — Aivora" }] }),
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const _list = useServerFn(listThreads);
  const _create = useServerFn(createThread);
  const threads = useQuery({ queryKey: ["threads"], queryFn: () => _list({}) });

  const create = useMutation({
    mutationFn: () => _create({}),
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: id } });
    },
  });

  // If threads exist, jump to the most recent one automatically.
  useEffect(() => {
    if (!threads.isLoading && threads.data && threads.data.length > 0) {
      navigate({
        to: "/chat/$threadId",
        params: { threadId: threads.data[0].id },
        replace: true,
      });
    }
  }, [threads.isLoading, threads.data, navigate]);

  return (
    <>
      <AppTopbar title="AI Chat Assistant" subtitle="Ask, draft, brainstorm, decide" />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-elegant">
          <Sparkles className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Start a new conversation</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Your chats are saved automatically. Pick up any previous conversation from the sidebar.
        </p>
        <Button
          className="mt-6"
          size="lg"
          onClick={() => create.mutate()}
          disabled={create.isPending}
        >
          <MessageSquarePlus className="mr-2 h-4 w-4" /> New conversation
        </Button>
      </main>
    </>
  );
}
