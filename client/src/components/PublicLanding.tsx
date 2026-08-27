import { ViraSquareLogo } from "@/components/ViraSquareLogo";
import { ContentFormatPreview, ReadyFlyerDemo, SavedProductDemo } from "@/components/LandingDemos";
import { ArrowRight, CalendarDays, CheckCircle2, FileImage, Layers3, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

type PublicLandingProps = {
  onStart: () => void;
};

const steps = [
  {
    number: "01",
    title: "Know what to say today",
    detail: "A focused daily direction and a weekly rhythm that helps you show up without starting from a blank page.",
    icon: CalendarDays,
  },
  {
    number: "02",
    title: "Turn it into something useful",
    detail: "Build educational content or create a complete product post from the details you have actually saved.",
    icon: FileImage,
  },
  {
    number: "03",
    title: "Keep the rhythm going",
    detail: "Save work, return to it later, and use your own feedback as a gentle cue for what to make next.",
    icon: CheckCircle2,
  },
];

const contentTypes = [
  { eyebrow: "PRODUCT POST", title: "A flyer grounded in your real product", accent: "bg-[#2563EB]", kind: "product" },
  { eyebrow: "EDUCATIONAL CONTENT", title: "A clear carousel that teaches one useful point", accent: "bg-[#60A5FA]", kind: "education" },
  { eyebrow: "TRUST BUILDING", title: "A steady way to show what your business knows", accent: "bg-[#0B1220]", kind: "trust" },
] as const;

export function PublicLanding({ onStart }: PublicLandingProps) {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className="public-landing overflow-x-hidden bg-[#F5F7FA] text-[#0B1220]">
      <section className="landing-hero relative isolate overflow-hidden px-5 pb-20 pt-5 sm:px-8 sm:pb-28 lg:px-12 lg:pt-7">
        <div className="landing-grid pointer-events-none absolute inset-0 -z-10 opacity-50" />
        <div className="landing-glow landing-glow-one pointer-events-none absolute -right-28 top-28 -z-10 h-[33rem] w-[33rem] rounded-full bg-[#BFDBFE] opacity-60 blur-3xl" />
        <div className="landing-glow landing-glow-two pointer-events-none absolute -left-32 bottom-0 -z-10 h-80 w-80 rounded-full bg-[#DBEAFE] opacity-70 blur-3xl" />

        <div className="mx-auto max-w-[1240px]">
          <header className="flex items-center justify-between gap-4 rounded-2xl border border-white/90 bg-white/80 px-3 py-2.5 shadow-[0_12px_42px_rgba(15,23,42,.06)] backdrop-blur sm:px-4">
            <button type="button" aria-label="ViraSquare home" onClick={() => scrollTo("top")} className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]">
              <ViraSquareLogo />
            </button>
            <nav aria-label="Landing page" className="hidden items-center gap-1 lg:flex">
              <button type="button" onClick={() => scrollTo("how-it-works")} className="rounded-xl px-3 py-2 text-sm font-semibold text-[#526174] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]">How it works</button>
              <button type="button" onClick={() => scrollTo("product-posts")} className="rounded-xl px-3 py-2 text-sm font-semibold text-[#526174] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]">Product posts</button>
              <button type="button" onClick={() => scrollTo("your-control")} className="rounded-xl px-3 py-2 text-sm font-semibold text-[#526174] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]">Your control</button>
            </nav>
            <button type="button" onClick={onStart} className="rounded-xl px-3 py-2 text-sm font-bold text-[#1D4ED8] hover:bg-[#EFF6FF]">Sign in</button>
          </header>

          <div id="top" className="grid min-h-[650px] items-center gap-12 py-16 lg:grid-cols-[1.03fr_.97fr] lg:gap-16 lg:py-24">
            <div className="vs-reveal max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-white/85 px-3 py-1.5 text-[11px] font-bold tracking-[.13em] text-[#1D4ED8] shadow-sm"><Sparkles className="h-3.5 w-3.5" /> YOUR DAILY CONTENT PARTNER</p>
              <h1 className="mt-6 max-w-2xl font-serif text-5xl leading-[.91] tracking-[-.065em] text-[#0B1220] sm:text-6xl lg:text-7xl">Know what to post.<br /><em className="text-[#2563EB]">Show up</em> with ease.</h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-[#526174] sm:text-lg">ViraSquare turns the real details you already know about your business into a clearer content rhythm, ready-to-use posts, and useful product-selling support.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button type="button" onClick={onStart} className="landing-primary inline-flex h-12 items-center justify-center rounded-2xl bg-[#0B1220] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(15,23,42,.18)] hover:bg-[#17233A]">Start your content rhythm <ArrowRight className="ml-2 h-4 w-4" /></button>
                <button type="button" onClick={() => scrollTo("how-it-works")} className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#BFDBFE] bg-white/80 px-5 text-sm font-bold text-[#1D4ED8] hover:bg-[#EFF6FF]">See how it works</button>
              </div>
              <div className="mt-10 grid gap-3 text-sm text-[#405167] sm:grid-cols-3">
                {[["Daily direction", "A clear next post"], ["Real details", "No made-up claims"], ["Owner control", "Review before you use"]].map(([title, detail]) => <div key={title} className="border-l-2 border-[#60A5FA] pl-3"><p className="font-bold text-[#0B1220]">{title}</p><p className="mt-1 text-xs leading-5 text-[#64748B]">{detail}</p></div>)}
              </div>
            </div>

            <div className="vs-reveal vs-delay-one relative mx-auto w-full max-w-[520px]">
              <div className="hero-orbit absolute -left-5 -top-5 h-24 w-24 rounded-[2rem] border border-[#BFDBFE] bg-white/85" />
              <div className="hero-orbit hero-orbit-two absolute -bottom-8 -right-6 h-28 w-28 rounded-full bg-[#2563EB]/10" />
              <article className="hero-workspace relative overflow-hidden rounded-[2.2rem] border border-white bg-white p-4 shadow-[0_30px_90px_rgba(37,99,235,.22)] sm:p-5">
                <div className="rounded-[1.65rem] bg-[#0B1220] p-5 text-white sm:p-6">
                  <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-bold tracking-[.14em] text-[#93C5FD]">EXAMPLE WORKSPACE</p><span className="rounded-full border border-white/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-[#BFDBFE]">Not your data</span></div>
                  <p className="mt-8 text-sm text-[#BFDBFE]">Your focus today</p>
                  <h2 className="mt-1 font-serif text-4xl">Build trust</h2>
                  <div className="mt-7 rounded-2xl border border-white/10 bg-white/[.09] p-4"><p className="text-[10px] font-bold tracking-[.12em] text-[#93C5FD]">TODAY’S DIRECTION</p><p className="mt-2 text-sm leading-6 text-white">Share one common mistake your customers can avoid.</p></div>
                </div>
                <div className="grid gap-2 pt-4 sm:grid-cols-3">
                  {[["01", "Choose a direction"], ["02", "Make it useful"], ["03", "Keep moving"]].map(([number, label], index) => <div key={number} className="relative rounded-2xl bg-[#EFF6FF] p-3"><p className="text-[10px] font-bold tracking-[.12em] text-[#2563EB]">{number}</p><p className="mt-4 text-xs font-bold leading-5 text-[#0B1220]">{label}</p>{index < 2 && <span className="absolute right-0 top-1/2 hidden translate-x-1/2 rounded-full bg-white p-1 text-[#2563EB] shadow-sm sm:grid"><ArrowRight className="h-3 w-3" /></span>}</div>)}
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#DCE6F2] bg-white px-5 py-7 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl font-serif text-2xl leading-tight text-[#0B1220] sm:text-3xl">You should not have to start from a blank page every time you want to post.</p>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#EFF6FF] px-3 py-2 text-xs font-bold text-[#1D4ED8]"><CheckCircle2 className="h-4 w-4" /> Direction first. Then real work.</span>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-6 px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto max-w-[1120px]">
          <div className="max-w-2xl"><p className="eyebrow">HOW VIRASQUARE HELPS</p><h2 className="mt-3 font-serif text-4xl leading-[.98] tracking-[-.045em] text-[#0B1220] sm:text-5xl">Your content, in one clear flow.</h2><p className="mt-5 text-base leading-7 text-[#64748B]">Instead of jumping between blank notes, ideas, and last-minute posts, ViraSquare helps you move from a useful direction to something you can confidently use.</p></div>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => { const Icon = step.icon; return <article key={step.number} className={`vs-reveal vs-delay-${index + 1} relative overflow-hidden rounded-[1.8rem] border border-[#DCE6F2] bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,.05)]`}><div className="flex items-center justify-between"><span className="text-[11px] font-bold tracking-[.14em] text-[#2563EB]">{step.number}</span><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]"><Icon className="h-5 w-5" /></span></div><h3 className="mt-10 font-serif text-3xl leading-tight text-[#0B1220]">{step.title}</h3><p className="mt-4 text-sm leading-7 text-[#64748B]">{step.detail}</p><div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-[#EFF6FF]"><span className="block h-full rounded-full bg-[#2563EB]" style={{ width: `${42 + index * 22}%` }} /></div></article>; })}
          </div>
        </div>
      </section>

      <section id="product-posts" className="scroll-mt-6 bg-[#0B1220] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto grid max-w-[1120px] gap-12 lg:grid-cols-[.88fr_1.12fr] lg:items-center">
          <div className="vs-reveal"><p className="text-[11px] font-bold tracking-[.15em] text-[#93C5FD]">PRODUCT POSTS, WITHOUT GUESSING</p><h2 className="mt-4 max-w-lg font-serif text-4xl leading-[.98] tracking-[-.045em] sm:text-5xl">Turn what you sell into content you can confidently use.</h2><p className="mt-6 max-w-lg text-base leading-7 text-[#BFDBFE]">Save a real product once. When you choose to make a product post, ViraSquare keeps those saved facts at the centre and gives you a fuller selling set, not just a random idea.</p><button type="button" onClick={onStart} className="mt-8 inline-flex h-12 items-center rounded-2xl bg-white px-5 text-sm font-bold text-[#0B1220] hover:bg-[#EFF6FF]">Make a product post <ArrowRight className="ml-2 h-4 w-4" /></button></div>
          <div className="vs-reveal vs-delay-one grid gap-3 sm:grid-cols-[.82fr_1.18fr]">
            <article className="rounded-[1.7rem] border border-white/10 bg-white/[.07] p-4"><p className="text-[10px] font-bold tracking-[.14em] text-[#93C5FD]">WHAT YOU SAVE</p><div className="mt-4"><SavedProductDemo /><div className="demo-flow-arrow flex items-center gap-2 py-3 text-[9px] font-bold uppercase tracking-[.11em] text-[#93C5FD]"><span className="h-px flex-1 bg-[#60A5FA]/60" />Becomes ready<span className="h-px flex-1 bg-[#60A5FA]/60" /></div><ReadyFlyerDemo /></div><p className="mt-4 text-xs leading-5 text-[#BFDBFE]">An example of the format, grounded in details an owner has confirmed.</p></article>
            <article className="rounded-[1.7rem] bg-white p-5 text-[#0B1220]"><p className="text-[10px] font-bold tracking-[.14em] text-[#2563EB]">WHAT YOU GET</p><h3 className="mt-3 font-serif text-3xl leading-tight">One post. A fuller selling package.</h3><div className="mt-6 grid gap-3">{[["Post-ready flyer", "A full visual built around your product."], ["Matching caption", "Words that fit the product you saved."], ["Buyer reply help", "A concise response for customer questions."], ["Next selling angle", "A different way to talk about the same product later."]].map(([title, detail]) => <div key={title} className="flex gap-3 rounded-xl bg-[#F5F7FA] p-3"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#DBEAFE] text-[#1D4ED8]"><CheckCircle2 className="h-3.5 w-3.5" /></span><div><p className="text-sm font-bold">{title}</p><p className="mt-0.5 text-xs leading-5 text-[#64748B]">{detail}</p></div></div>)}</div></article>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto max-w-[1120px]">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-xl"><p className="eyebrow">MORE THAN ONE KIND OF POST</p><h2 className="mt-3 font-serif text-4xl leading-[.98] tracking-[-.045em] text-[#0B1220] sm:text-5xl">Create a content rhythm people can feel.</h2></div><p className="max-w-sm text-sm leading-6 text-[#64748B]">Stay useful, show the product when it matters, and give customers more reasons to trust what you know.</p></div>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {contentTypes.map((content, index) => <article key={content.eyebrow} className={`vs-reveal vs-delay-${index + 1} group flex min-h-[390px] flex-col overflow-hidden rounded-[1.8rem] border border-[#DCE6F2] bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,.05)]`}><div className={`h-2.5 w-14 rounded-full ${content.accent}`} /><p className="mt-7 text-[10px] font-bold tracking-[.14em] text-[#2563EB]">{content.eyebrow}</p><h3 className="mt-3 max-w-xs font-serif text-3xl leading-tight text-[#0B1220]">{content.title}</h3><div className="mt-6"><ContentFormatPreview kind={content.kind} /></div><div className="mt-auto pt-5 flex items-center gap-2 text-xs font-bold text-[#1D4ED8]"><span className="h-px w-8 bg-[#60A5FA]" /> Example format</div></article>)}
          </div>
        </div>
      </section>

      <section id="your-control" className="scroll-mt-6 px-5 pb-20 sm:px-8 sm:pb-28 lg:px-12">
        <div className="control-panel vs-reveal mx-auto max-w-[1120px] overflow-hidden rounded-[2rem] border border-[#BFDBFE] bg-[#EFF6FF] p-6 sm:p-10 lg:grid lg:grid-cols-[1fr_.9fr] lg:gap-12">
          <div><p className="eyebrow">BUILT TO STAY IN YOUR CONTROL</p><h2 className="mt-3 max-w-xl font-serif text-4xl leading-[.98] tracking-[-.045em] text-[#0B1220] sm:text-5xl">Your business should still sound like your business.</h2><p className="mt-5 max-w-xl text-base leading-7 text-[#526174]">ViraSquare uses the information you choose to save. You review every post before you use it, correct what is not right, and keep your work organised for later.</p></div>
          <div className="mt-8 grid gap-3 lg:mt-0">{[[ShieldCheck, "Use your real details", "Product facts, pricing, and brand context stay owner-provided."], [CheckCircle2, "Review and correct", "Check the output and ask for a correction before you use it."], [Layers3, "Keep useful work close", "Use Drafts, Ready to post, Posted, and Archived views to stay organised."], [MessageCircle, "Your feedback stays yours", "Optional feedback only guides future suggestions. It is not invented analytics."]].map(([Icon, title, detail]) => { const ItemIcon = Icon as typeof ShieldCheck; return <div key={title as string} className="rounded-2xl border border-white bg-white/90 p-4 shadow-sm"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#DBEAFE] text-[#1D4ED8]"><ItemIcon className="h-5 w-5" /></span><div><p className="text-sm font-bold text-[#0B1220]">{title as string}</p><p className="mt-1 text-xs leading-5 text-[#64748B]">{detail as string}</p></div></div></div>; })}</div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-28 lg:px-12">
        <div className="final-invitation vs-reveal mx-auto max-w-[1120px] overflow-hidden rounded-[2rem] bg-[#2563EB] px-6 py-12 text-white shadow-[0_24px_60px_rgba(37,99,235,.24)] sm:px-10 sm:py-14"><div className="relative max-w-2xl"><span className="absolute -left-10 -top-20 h-40 w-40 rounded-full border-[18px] border-white/10" /><p className="relative text-[11px] font-bold tracking-[.15em] text-[#DBEAFE]">READY WHEN YOU ARE</p><h2 className="relative mt-4 font-serif text-4xl leading-[.98] tracking-[-.045em] sm:text-5xl">Make content you can confidently use, not just content you have to figure out.</h2><p className="relative mt-5 max-w-xl text-base leading-7 text-[#DBEAFE]">Start with your real business details. Choose what you want to make. Keep every decision in your hands.</p><div className="relative mt-8 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={onStart} className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-bold text-[#0B1220] hover:bg-[#EFF6FF]">Start your content rhythm <ArrowRight className="ml-2 h-4 w-4" /></button><button type="button" onClick={onStart} className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/30 px-5 text-sm font-bold text-white hover:bg-white/10">Sign in</button></div></div></div>
      </section>

      <footer className="border-t border-[#DCE6F2] bg-white px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1120px] gap-10 md:grid-cols-[1.2fr_.75fr_.75fr]">
          <div><ViraSquareLogo /><p className="mt-5 max-w-sm text-sm leading-6 text-[#64748B]">A focused daily content partner for small businesses that want clearer direction and content they can confidently use.</p><button type="button" onClick={onStart} className="mt-5 inline-flex items-center text-sm font-bold text-[#1D4ED8] hover:text-[#0B1220]">Start your content rhythm <ArrowRight className="ml-1.5 h-4 w-4" /></button></div>
          <div><p className="text-[10px] font-bold tracking-[.14em] text-[#2563EB]">EXPLORE SERVICES</p><div className="mt-4 grid gap-3"><button type="button" onClick={onStart} className="w-fit text-left text-sm font-semibold text-[#405167] hover:text-[#1D4ED8]">Daily content direction</button><button type="button" onClick={onStart} className="w-fit text-left text-sm font-semibold text-[#405167] hover:text-[#1D4ED8]">Product posts</button><button type="button" onClick={onStart} className="w-fit text-left text-sm font-semibold text-[#405167] hover:text-[#1D4ED8]">Educational content</button><button type="button" onClick={onStart} className="w-fit text-left text-sm font-semibold text-[#405167] hover:text-[#1D4ED8]">Your content library</button></div></div>
          <div><p className="text-[10px] font-bold tracking-[.14em] text-[#2563EB]">TRUST AND COMPANY</p><div className="mt-4 grid gap-3 text-sm text-[#64748B]"><p><span className="font-semibold text-[#405167]">About ViraSquare</span><br />Built for clearer daily content work.</p><p><span className="font-semibold text-[#405167]">Privacy, terms, and data rights</span><br />Public pages are being prepared accurately for launch.</p><p><span className="font-semibold text-[#405167]">Support</span><br />A branded support contact is being prepared for launch.</p></div></div>
        </div>
        <div className="mx-auto mt-10 flex max-w-[1120px] flex-col gap-2 border-t border-[#E7EDF5] pt-5 text-xs text-[#64748B] sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} ViraSquare. Content, with direction.</span><span>Use real details. Review before you use.</span></div>
      </footer>
    </main>
  );
}
