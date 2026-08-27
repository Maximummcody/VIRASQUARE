import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

function GlowOilIllustration({ dark = false }: { dark?: boolean }) {
  const glass = dark ? "#FFDFC7" : "#FFF8F2";
  const label = dark ? "#0B1220" : "#2A1B27";

  return (
    <svg aria-hidden="true" viewBox="0 0 180 190" className="h-full w-full">
      <ellipse cx="90" cy="169" rx="51" ry="10" fill="#0B1220" opacity=".14" />
      <path d="M72 29h36l-5 24H77l-5-24Z" fill="#2A1B27" />
      <path d="M80 19h20v14H80z" fill="#EBC2A6" />
      <path d="M54 58c0-8 6-14 14-14h44c8 0 14 6 14 14v91c0 12-10 21-22 21H76c-12 0-22-9-22-21V58Z" fill="#E48C64" />
      <path d="M59 62c0-7 6-13 13-13h15v116H75c-9 0-16-7-16-16V62Z" fill="#F4B98E" opacity=".76" />
      <rect x="61" y="80" width="58" height="61" rx="6" fill={glass} />
      <rect x="67" y="86" width="46" height="49" rx="4" fill={label} />
      <path d="M77 105c6-9 12-9 18 0 6-9 12-9 18 0" fill="none" stroke="#F4B98E" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M90 94v30" stroke="#F4B98E" strokeWidth="1" opacity=".6" />
      <text x="90" y="121" textAnchor="middle" fill="#FFF8F2" fontSize="7" fontFamily="Arial, sans-serif" fontWeight="700" letterSpacing="1.3">NURA</text>
      <text x="90" y="129" textAnchor="middle" fill="#F4B98E" fontSize="4.5" fontFamily="Arial, sans-serif" letterSpacing=".8">GLOW OIL</text>
      <path d="M118 57c15 6 21 17 22 32" fill="none" stroke="#F8D8C2" strokeWidth="2" strokeLinecap="round" opacity=".8" />
      <path d="M43 112c-10-8-14-18-10-30" fill="none" stroke="#F8D8C2" strokeWidth="2" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

export function SavedProductDemo() {
  return (
    <div className="demo-saved-product relative overflow-hidden rounded-2xl border border-[#BFDBFE] bg-white p-3 shadow-[0_12px_28px_rgba(37,99,235,.12)]">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#DBEAFE]" />
      <div className="relative flex items-center justify-between gap-2"><span className="rounded-full bg-[#EFF6FF] px-2 py-1 text-[8px] font-bold tracking-[.11em] text-[#1D4ED8]">ILLUSTRATIVE SAMPLE</span><span className="text-[9px] font-bold text-[#64748B]">SAVED</span></div>
      <div className="relative mt-3 grid aspect-[16/10] place-items-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_30%_25%,#FFFFFF_0%,#FFF7F0_43%,#DBEAFE_100%)]"><div className="demo-product-orbit absolute h-32 w-32 rounded-full border border-[#93C5FD]/60" /><div className="relative h-32 w-32 drop-shadow-[0_14px_14px_rgba(15,23,42,.18)]"><GlowOilIllustration /></div></div>
      <div className="relative mt-3 flex items-end justify-between gap-3"><div><p className="font-serif text-lg leading-tight text-[#0B1220]">Everyday Glow Oil</p><p className="mt-1 text-[10px] text-[#64748B]">Photo, price, and key details</p></div><span className="rounded-lg bg-[#0B1220] px-2 py-1.5 text-[10px] font-bold text-white">₦8,500</span></div>
    </div>
  );
}

export function HeroProductTaskCue({ onStart }: { onStart: () => void }) {
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.08] p-3.5">
      <div className="flex items-center gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#F8D8C2]/15 p-1"><GlowOilIllustration dark /></div><div className="min-w-0 flex-1"><p className="text-[9px] font-bold tracking-[.13em] text-[#93C5FD]">ILLUSTRATIVE PRODUCT POST</p><p className="mt-1 text-sm font-semibold leading-5 text-white">Turn saved Nura Oil details into a post.</p></div></div>
      <button type="button" onClick={onStart} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-2.5 py-1.5 text-[9px] font-bold tracking-[.08em] text-white hover:bg-[#3B82F6]">MAKE THIS POST <ArrowRight className="h-3 w-3" /></button>
    </div>
  );
}

export function ReadyFlyerDemo() {
  return (
    <div className="demo-ready-flyer relative isolate overflow-hidden rounded-xl bg-[#321A2A] p-3 text-white shadow-[0_12px_24px_rgba(15,23,42,.15)]">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border-[14px] border-[#F4B98E] opacity-80" /><div className="absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-[#E48C64]/40 blur-xl" />
      <div className="relative flex items-center justify-between"><span className="rounded-full bg-white/10 px-2 py-1 text-[7px] font-bold tracking-[.13em] text-[#F8D8C2]">ILLUSTRATIVE FLYER</span><Sparkles className="h-3.5 w-3.5 text-[#F4B98E]" /></div>
      <div className="relative mt-2 grid grid-cols-[.68fr_1fr] items-center gap-2"><div className="h-[78px]"><GlowOilIllustration dark /></div><div><p className="font-serif text-[1.45rem] leading-[.84] tracking-[-.04em]">Glow in your everyday.</p><p className="mt-2 text-[8px] leading-3 text-[#F8D8C2]">Lightweight care for soft, naturally radiant skin.</p><span className="mt-2 inline-block rounded bg-[#E48C64] px-2 py-1 text-[8px] font-bold text-[#2A1B27]">₦8,500</span></div></div>
      <div className="relative mt-1.5 flex items-center justify-between border-t border-white/15 pt-2"><span className="text-[8px] text-[#F8D8C2]">NURA BEAUTY</span><span className="text-[8px] font-bold text-white">Example format</span></div>
    </div>
  );
}

type ContentPreviewProps = { kind: "product" | "education" | "trust" };

export function ContentFormatPreview({ kind }: ContentPreviewProps) {
  if (kind === "product") {
    return <div className="demo-content-preview relative overflow-hidden rounded-xl bg-[#321A2A] p-3 text-white"><span className="absolute -right-6 -top-6 h-20 w-20 rounded-full border-[13px] border-[#E48C64]" /><p className="relative text-[8px] font-bold tracking-[.12em] text-[#F8D8C2]">ILLUSTRATIVE FORMAT</p><div className="relative mt-2 flex items-center gap-2"><div className="h-14 w-14 rounded-lg bg-white/10 p-1"><GlowOilIllustration dark /></div><div><p className="font-serif text-lg leading-none">Glow in your everyday.</p><p className="mt-2 text-[9px] text-[#F8D8C2]">Product post</p></div></div><div className="relative mt-2 flex justify-end"><span className="rounded bg-[#E48C64] px-2 py-1 text-[9px] font-bold text-[#2A1B27]">₦8,500</span></div></div>;
  }

  if (kind === "education") {
    return <div className="demo-content-preview relative h-[140px] overflow-hidden rounded-xl bg-[#EFF6FF] p-3"><span className="absolute left-3 top-3 text-[8px] font-bold tracking-[.12em] text-[#2563EB]">ILLUSTRATIVE FORMAT</span><span aria-hidden="true" className="absolute right-4 top-3 h-8 w-8 rounded-full border-[6px] border-[#BFDBFE]/70" /><div className="mt-8 flex items-end gap-2">{[["01", "Understand its purpose"], ["02", "When to apply it"], ["03", "A simple routine"]].map(([number, label], index) => <div key={number} className="relative flex h-[82px] flex-1 flex-col justify-between overflow-hidden rounded-lg border border-white bg-white p-2 shadow-[0_6px_12px_rgba(37,99,235,.10)]" style={{ transform: `translateY(${index === 1 ? -8 : index === 2 ? -2 : 0}px)` }}><span aria-hidden="true" className="absolute -bottom-4 -right-3 h-12 w-12 rounded-full bg-[#DBEAFE] opacity-80" /><span className="relative text-[8px] font-bold text-[#2563EB]">{number}</span><span className="relative z-10 max-w-[5rem] font-serif text-[10px] leading-3 text-[#0B1220]">{label}</span></div>)}</div></div>;
  }

  return <div className="demo-content-preview relative overflow-hidden rounded-xl border border-[#DCE6F2] bg-white p-3"><span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-[#EFF6FF] text-[#2563EB]"><CheckCircle2 className="h-4 w-4" /></span><p className="text-[8px] font-bold tracking-[.12em] text-[#2563EB]">ILLUSTRATIVE FORMAT</p><div className="mt-3 flex items-center gap-2"><div className="h-14 w-14 shrink-0 rounded-xl bg-[#321A2A] p-1"><GlowOilIllustration dark /></div><p className="max-w-[10rem] font-serif text-lg leading-tight text-[#0B1220]">What customers should know before they choose.</p></div><div className="mt-3 flex gap-1.5"><span className="h-1.5 w-12 rounded-full bg-[#2563EB]" /><span className="h-1.5 w-7 rounded-full bg-[#BFDBFE]" /><span className="h-1.5 w-10 rounded-full bg-[#DBEAFE]" /></div></div>;
}

export function ContentSystemGraphic() {
  return (
    <div className="content-system-graphic relative mx-auto mt-10 h-64 w-full max-w-[360px] lg:mt-0" aria-label="Illustrative ViraSquare content system">
      <div className="absolute left-12 top-0 h-48 w-48 rounded-full border-[18px] border-white/10" />
      <div className="content-system-card absolute left-0 top-7 w-44 rounded-2xl border border-white/25 bg-[#0B1220] p-3 text-white shadow-[0_18px_30px_rgba(11,18,32,.22)]"><p className="text-[8px] font-bold tracking-[.13em] text-[#93C5FD]">DIRECTION</p><p className="mt-3 font-serif text-xl leading-none">Build trust today.</p><div className="mt-4 flex gap-1"><span className="h-1.5 w-10 rounded-full bg-[#2563EB]" /><span className="h-1.5 w-6 rounded-full bg-white/30" /></div></div>
      <div className="content-system-card content-system-card-main absolute right-0 top-14 w-48 rounded-2xl border border-white/80 bg-white p-3 text-[#0B1220] shadow-[0_18px_32px_rgba(15,23,42,.18)]"><div className="flex items-center justify-between"><p className="text-[8px] font-bold tracking-[.13em] text-[#2563EB]">READY VISUAL</p><Sparkles className="h-3.5 w-3.5 text-[#2563EB]" /></div><div className="mt-3 flex h-16 items-center gap-2 rounded-xl bg-[#EFF6FF] p-2"><div className="h-12 w-12 rounded-lg bg-[#0B1220] p-1"><GlowOilIllustration dark /></div><div><p className="font-serif text-sm leading-4">Ready to share.</p><p className="mt-1 text-[8px] text-[#64748B]">Example format</p></div></div></div>
      <div className="content-system-card absolute bottom-0 left-12 w-48 rounded-2xl border border-white/35 bg-[#BFDBFE] p-3 text-[#0B1220] shadow-[0_18px_30px_rgba(15,23,42,.16)]"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-[#2563EB]"><ArrowRight className="h-3.5 w-3.5" /></span><div><p className="text-[8px] font-bold tracking-[.13em] text-[#1D4ED8]">BUYER REPLY</p><p className="mt-1 text-[10px] font-semibold">A helpful next response.</p></div></div></div>
    </div>
  );
}
