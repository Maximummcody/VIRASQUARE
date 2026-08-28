import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Instagram, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

type ReadyVisual = {
  id: number;
  type: "single_post" | "carousel" | "story";
  slides?: Array<{ assetUrl?: string | null }>;
};

/**
 * This panel deliberately starts with account connection, not a publish action.
 * Publish Now only appears after a real Instagram Professional test account is
 * connected and the server-side Meta request has been verified.
 */
export function InstagramPublishingPanel({ visual }: { visual: ReadyVisual }) {
  const publishing = trpc.virasquare.socialPublishing.useQuery();
  const beginConnection = trpc.virasquare.beginInstagramConnection.useMutation({
    onSuccess: ({ authorizeUrl }) => window.location.assign(authorizeUrl),
    onError: error => toast.error(error.message),
  });

  if (visual.type !== "single_post" || !visual.slides?.[0]?.assetUrl) return null;

  const instagram = publishing.data?.instagram;
  const account = instagram?.account;
  const isConnected = account?.connectionStatus === "connected";

  return <section className="mt-4 rounded-2xl border border-[#bfdbfe] bg-[#f5f9ff] p-4">
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#dbeafe] text-[#2563eb]"><Instagram className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#2563eb]">INSTAGRAM PUBLISHING</p>
        <h5 className="mt-1 font-serif text-xl leading-tight text-[#0b1220]">Send a finished flyer when you are ready.</h5>
        <p className="mt-2 text-xs leading-5 text-[#526174]">ViraSquare will always show the final flyer and caption first. Nothing publishes automatically.</p>
      </div>
    </div>

    {publishing.isLoading ? <div className="mt-4 flex items-center gap-2 text-xs text-[#526174]"><Loader2 className="h-4 w-4 animate-spin" />Checking your connection…</div> : isConnected ? <div className="mt-4 rounded-xl border border-[#c8dcf7] bg-white p-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-[#1e3a5f]"><CheckCircle2 className="h-4 w-4 text-[#2563eb]" />Connected as {account?.username ? `@${account.username}` : account?.accountName}</p>
      <p className="mt-1 text-xs leading-5 text-[#526174]">The final Publish now confirmation becomes available once this test connection has been verified with Meta.</p>
    </div> : <div className="mt-4 rounded-xl border border-[#c8dcf7] bg-white p-3">
      <p className="text-sm font-semibold text-[#1e3a5f]">Connect an Instagram Professional account</p>
      <p className="mt-1 text-xs leading-5 text-[#526174]">Business or Creator account required. ViraSquare opens Instagram’s secure approval screen and stores the connection on the server, never in your browser.</p>
      <Button type="button" onClick={() => beginConnection.mutate()} disabled={!instagram?.configured || beginConnection.isPending} className="mt-3 w-full rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] sm:w-auto">
        {beginConnection.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Instagram className="mr-2 h-4 w-4" />}
        {instagram?.configured ? "Connect Instagram" : "Instagram test setup in progress"}
      </Button>
    </div>}

    <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-[#607187]"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563eb]" />Test connection only. Scheduled publishing and Facebook Page publishing are intentionally not active yet.</p>
  </section>;
}
