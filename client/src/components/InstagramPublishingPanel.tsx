import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, Instagram, Loader2, LockKeyhole, RotateCcw, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ReadyVisual = {
  id: number;
  type: "single_post" | "carousel" | "story";
  generationMode?: "standard" | "stylish";
  slides?: Array<{ assetUrl?: string | null; sourceMode?: string | null }>;
};

/**
 * This panel deliberately starts with account connection, not a publish action.
 * Publish Now only appears after a real Instagram Professional test account is
 * connected and the server-side Meta request has been verified.
 */
export function InstagramPublishingPanel({ visual }: { visual: ReadyVisual }) {
  const utils = trpc.useUtils();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const publishing = trpc.virasquare.socialPublishing.useQuery();
  const captionReview = trpc.virasquare.productPostCaptionReview.useQuery({ deliverableId: visual.id }, { enabled: visual.type === "single_post" });
  const beginConnection = trpc.virasquare.beginInstagramConnection.useMutation({
    onSuccess: ({ authorizeUrl }) => window.location.assign(authorizeUrl),
    onError: error => toast.error(error.message),
  });

  if (visual.type !== "single_post" || !visual.slides?.[0]?.assetUrl) return null;

  const instagram = publishing.data?.instagram;
  const account = instagram?.account;
  const isConnected = account?.connectionStatus === "connected";
  const latestAttempt = publishing.data?.recentAttempts.find(attempt => attempt.platform === "instagram" && attempt.deliverableId === visual.id);
  const publishNow = trpc.virasquare.publishInstagramNow.useMutation({
    onSuccess: async (result) => {
      setConfirmOpen(false);
      await Promise.all([utils.virasquare.socialPublishing.invalidate(), utils.virasquare.activity.invalidate(), utils.virasquare.workspace.invalidate(), utils.virasquare.library.invalidate()]);
      toast.success(result.alreadyPublished ? "This flyer is already published on Instagram." : "Your flyer has been published on Instagram.");
    },
    onError: error => {
      setConfirmOpen(false);
      toast.error(error.message);
    },
  });

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
      {latestAttempt?.status === "published" ? <div className="mt-3 rounded-lg bg-[#eff6ff] p-3"><p className="flex items-center gap-2 text-xs font-semibold text-[#1e3a5f]"><CheckCircle2 className="h-4 w-4 text-[#2563eb]" />Published on Instagram</p>{latestAttempt.providerPermalink && <a className="mt-1 inline-block text-xs font-semibold text-[#2563eb] underline underline-offset-2" href={latestAttempt.providerPermalink} target="_blank" rel="noreferrer">View published post</a>}</div> : latestAttempt?.status === "publishing" ? <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#eff6ff] p-3 text-xs font-semibold text-[#1e3a5f]"><Loader2 className="h-4 w-4 animate-spin text-[#2563eb]" />Instagram is preparing your flyer. Do not submit it again.</div> : captionReview.isLoading ? <p className="mt-3 flex items-center gap-2 text-xs leading-5 text-[#526174]"><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading the exact saved caption for final review…</p> : captionReview.data ? <><p className="mt-1 text-xs leading-5 text-[#526174]">Your finished flyer, connected account, and exact saved caption are shown together one more time before anything is sent.</p>{latestAttempt?.status === "failed" && <div role="alert" className="mt-3 rounded-lg border border-[#f4d4cb] bg-[#fff7f5] p-3 text-xs leading-5 text-[#8a3f2c]"><p className="flex items-center gap-1 font-semibold"><AlertTriangle className="h-3.5 w-3.5" />Instagram did not publish this flyer.</p><p className="mt-1">{latestAttempt.failureMessage || "Nothing was marked as posted. You can review the flyer and try again when ready."}</p></div>}<Button type="button" onClick={() => setConfirmOpen(true)} disabled={publishNow.isPending} className="mt-3 w-full rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] sm:w-auto">{publishNow.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : latestAttempt?.status === "failed" ? <RotateCcw className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}{latestAttempt?.status === "failed" ? "Review and try again" : "Review and publish now"}</Button></> : <p className="mt-2 text-xs leading-5 text-[#526174]">Prepare and save the product selling package first so ViraSquare can show the exact caption you will post.</p>}
    </div> : <div className="mt-4 rounded-xl border border-[#c8dcf7] bg-white p-3">
      <p className="text-sm font-semibold text-[#1e3a5f]">Connect an Instagram Professional account</p>
      <p className="mt-1 text-xs leading-5 text-[#526174]">Business or Creator account required. ViraSquare opens Instagram’s secure approval screen and stores the connection on the server, never in your browser.</p>
      <Button type="button" onClick={() => beginConnection.mutate()} disabled={!instagram?.configured || beginConnection.isPending} className="mt-3 w-full rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] sm:w-auto">
        {beginConnection.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Instagram className="mr-2 h-4 w-4" />}
        {instagram?.configured ? "Connect Instagram" : "Instagram test setup in progress"}
      </Button>
    </div>}

    <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-[#607187]"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563eb]" />Test connection only. Scheduled publishing and Facebook Page publishing are intentionally not active yet.</p>
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#2563eb]">FINAL PUBLISH CONFIRMATION</p>
          <AlertDialogTitle>Publish this flyer to {account?.username ? `@${account.username}` : "Instagram"} now?</AlertDialogTitle>
          <AlertDialogDescription>Nothing has been sent yet. Confirm only if this exact image and text are ready for your connected Instagram Professional account. Nothing will be scheduled.</AlertDialogDescription>
        </AlertDialogHeader>
        {captionReview.data && <div className="space-y-3"><img src={visual.slides?.[0]?.assetUrl || ""} alt="Final flyer selected for Instagram" className="aspect-[4/5] w-full rounded-xl border border-[#dbeafe] bg-[#f5f9ff] object-contain"/><div className="rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-3"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#2563eb]">EXACT SAVED CAPTION</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#253750]">{captionReview.data.finalCaption}</p></div>{(visual.generationMode === "stylish" || visual.slides?.[0]?.sourceMode === "ai_product") && <p className="rounded-lg border border-[#dbeafe] bg-[#eff6ff] px-3 py-2 text-xs leading-5 text-[#35516f]">This AI-enhanced flyer will be honestly shared with Instagram’s AI-content disclosure.</p>}</div>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={publishNow.isPending}>Keep reviewing</AlertDialogCancel>
          <AlertDialogAction disabled={publishNow.isPending} onClick={event => { event.preventDefault(); publishNow.mutate({ deliverableId: visual.id, confirmed: true }); }} className="bg-[#2563eb] hover:bg-[#1d4ed8]">{publishNow.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Instagram className="mr-2 h-4 w-4" />}Publish now</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>;
}
