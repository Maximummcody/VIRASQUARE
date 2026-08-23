import { Button } from "@/components/ui/button";
import { ArrowRight, WandSparkles } from "lucide-react";
import type React from "react";

export function createWorkspaceRetryHandler(retry: () => void) {
  return () => retry();
}

export function WorkspaceLoadFailure({ retry }: { retry: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f2] px-5">
      <div className="max-w-sm rounded-[1.75rem] border border-[#e1e7dc] bg-[#fffefa] p-7 text-center shadow-sm">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#f8e9df] text-[#a55b4d]">
          <WandSparkles className="h-5 w-5" />
        </div>
        <h1 className="mt-5 font-serif text-3xl tracking-[-.04em]">We couldn’t load your workspace.</h1>
        <p className="mt-3 text-sm leading-6 text-[#6d776c]">Your content is safe. Please try again, and if this continues, refresh the page.</p>
        <Button onClick={createWorkspaceRetryHandler(retry)} className="mt-6 rounded-xl bg-[#263327] hover:bg-[#3b4b3b]">
          <ArrowRight className="mr-2 h-4 w-4" />Try again
        </Button>
      </div>
    </main>
  );
}
