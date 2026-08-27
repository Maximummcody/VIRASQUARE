import { CheckCircle2, Sparkles } from "lucide-react";

function WatchSilhouette({ dark = false }: { dark?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 160 160" className="h-full w-full">
      <rect x="63" y="5" width="34" height="48" rx="12" fill={dark ? "#0B1220" : "#2563EB"} opacity=".92" />
      <rect x="63" y="107" width="34" height="48" rx="12" fill={dark ? "#0B1220" : "#2563EB"} opacity=".92" />
      <circle cx="80" cy="80" r="46" fill={dark ? "#0B1220" : "#FFFFFF"} stroke={dark ? "#60A5FA" : "#0B1220"} strokeWidth="7" />
      <circle cx="80" cy="80" r="34" fill={dark ? "#17233A" : "#EFF6FF"} stroke={dark ? "#2563EB" : "#BFDBFE"} strokeWidth="2" />
      <path d="M80 54V81L98 91" stroke={dark ? "#FFFFFF" : "#0B1220"} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="80" cy="80" r="4" fill={dark ? "#FFFFFF" : "#2563EB"} />
    </svg>
  );
}

export function SavedProductDemo() {
  return (
    <div className="demo-saved-product relative overflow-hidden rounded-2xl border border-[#BFDBFE] bg-white p-3 shadow-[0_12px_28px_rgba(37,99,235,.12)]">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#DBEAFE]" />
      <div className="relative flex items-center justify-between gap-2"><span className="rounded-full bg-[#EFF6FF] px-2 py-1 text-[8px] font-bold tracking-[.11em] text-[#1D4ED8]">EXAMPLE PRODUCT</span><span className="text-[9px] font-bold text-[#64748B]">SAVED</span></div>
      <div className="relative mt-3 grid aspect-[16/10] place-items-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_30%_25%,#FFFFFF_0%,#EFF6FF_46%,#DBEAFE_100%)]">
        <div className="demo-product-orbit absolute h-32 w-32 rounded-full border border-[#93C5FD]/60" />
        <div className="relative h-28 w-28 drop-shadow-[0_12px_12px_rgba(15,23,42,.16)]"><WatchSilhouette /></div>
      </div>
      <div className="relative mt-3 flex items-end justify-between gap-3"><div><p className="font-serif text-lg leading-tight text-[#0B1220]">Everyday Watch</p><p className="mt-1 text-[10px] text-[#64748B]">Real photo, price, details</p></div><span className="rounded-lg bg-[#0B1220] px-2 py-1.5 text-[10px] font-bold text-white">₦45,000</span></div>
    </div>
  );
}

export function ReadyFlyerDemo() {
  return (
    <div className="demo-ready-flyer relative isolate overflow-hidden rounded-xl bg-[#0B1220] p-2.5 text-white shadow-[0_12px_24px_rgba(15,23,42,.15)]">
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full border-[10px] border-[#2563EB] opacity-90" />
      <div className="relative flex items-center justify-between"><span className="text-[7px] font-bold tracking-[.13em] text-[#93C5FD]">EXAMPLE FLYER</span><Sparkles className="h-3 w-3 text-[#60A5FA]" /></div>
      <div className="relative mt-1.5 flex items-center gap-2"><div className="h-12 w-12 shrink-0"><WatchSilhouette dark /></div><div><p className="font-serif text-sm leading-none">Everyday, ready.</p><p className="mt-1 text-[8px] text-[#BFDBFE]">Made from saved details</p></div></div>
      <div className="relative mt-2 flex items-center justify-between border-t border-white/15 pt-2"><span className="text-[8px] text-[#BFDBFE]">Example format</span><span className="rounded bg-[#2563EB] px-1.5 py-1 text-[8px] font-bold">₦45,000</span></div>
    </div>
  );
}

type ContentPreviewProps = { kind: "product" | "education" | "trust" };

export function ContentFormatPreview({ kind }: ContentPreviewProps) {
  if (kind === "product") {
    return <div className="demo-content-preview relative overflow-hidden rounded-xl bg-[#0B1220] p-3 text-white"><span className="absolute -right-6 -top-6 h-20 w-20 rounded-full border-[13px] border-[#2563EB]" /><p className="relative text-[8px] font-bold tracking-[.12em] text-[#93C5FD]">EXAMPLE FORMAT</p><div className="relative mt-2 flex items-center gap-2"><div className="h-14 w-14 rounded-lg bg-white/10 p-1"><WatchSilhouette dark /></div><div><p className="font-serif text-lg leading-none">Make today count.</p><p className="mt-2 text-[9px] text-[#BFDBFE]">Product post</p></div></div><div className="relative mt-2 flex justify-end"><span className="rounded bg-[#2563EB] px-2 py-1 text-[9px] font-bold">₦45,000</span></div></div>;
  }

  if (kind === "education") {
    return <div className="demo-content-preview relative flex h-[126px] items-end gap-2 overflow-hidden rounded-xl bg-[#EFF6FF] p-3"><span className="absolute left-3 top-3 text-[8px] font-bold tracking-[.12em] text-[#2563EB]">EXAMPLE FORMAT</span>{[["01", "Start here"], ["02", "Keep it clear"], ["03", "Use it today"]].map(([number, label], index) => <div key={number} className="relative flex h-[68px] flex-1 flex-col justify-between rounded-lg border border-white bg-white p-2 shadow-[0_6px_12px_rgba(37,99,235,.10)]" style={{ transform: `translateY(${index === 1 ? -8 : index === 2 ? -2 : 0}px)` }}><span className="text-[8px] font-bold text-[#2563EB]">{number}</span><span className="font-serif text-[11px] leading-3 text-[#0B1220]">{label}</span></div>)}</div>;
  }

  return <div className="demo-content-preview relative overflow-hidden rounded-xl border border-[#DCE6F2] bg-white p-3"><span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-[#EFF6FF] text-[#2563EB]"><CheckCircle2 className="h-4 w-4" /></span><p className="text-[8px] font-bold tracking-[.12em] text-[#2563EB]">EXAMPLE FORMAT</p><p className="mt-3 max-w-[13rem] font-serif text-xl leading-tight text-[#0B1220]">What customers should know before they choose.</p><div className="mt-3 flex gap-1.5"><span className="h-1.5 w-12 rounded-full bg-[#2563EB]" /><span className="h-1.5 w-7 rounded-full bg-[#BFDBFE]" /><span className="h-1.5 w-10 rounded-full bg-[#DBEAFE]" /></div></div>;
}
