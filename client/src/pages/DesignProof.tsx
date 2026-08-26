import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ArchiveRestore, ArrowRight, CalendarDays, CheckCircle2, CircleDot, Eye, Flame, LayoutDashboard, Loader2, PackagePlus, Sparkles, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";

type ProofTab = "today" | "products";

export const NAVY_PROOF_TOKENS = {
  ink: "#0B1220",
  electricBlue: "#2563EB",
  skyBlue: "#60A5FA",
  paper: "#FFFFFF",
  workspace: "#F5F7FA",
  text: "#111827",
} as const;

function iso(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function weekDates(now = new Date()) {
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return iso(date);
  });
}

function readable(date: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(undefined, options).format(new Date(`${date}T12:00:00`));
}

function ProofHeader({ active, onChange, name }: { active: ProofTab; onChange: (tab: ProofTab) => void; name?: string | null }) {
  return <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-7">
    <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0B1220] text-sm font-black text-white">V</div><div><p className="text-[17px] font-black tracking-[-.04em] text-[#0B1220]">virasquare</p><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#64748B]">NAVY + BLUE PROOF</p></div></div>
    <nav className="order-3 flex w-full gap-1 overflow-x-auto rounded-xl bg-[#F5F7FA] p-1 sm:order-none sm:w-auto" aria-label="Private design proof sections">
      <button type="button" onClick={() => onChange("today")} className={cn("rounded-lg px-3 py-2 text-xs font-bold transition", active === "today" ? "bg-[#0B1220] text-white shadow-sm" : "text-[#475569] hover:bg-white")}>Today</button>
      <button type="button" onClick={() => onChange("products")} className={cn("rounded-lg px-3 py-2 text-xs font-bold transition", active === "products" ? "bg-[#0B1220] text-white shadow-sm" : "text-[#475569] hover:bg-white")}>My Products</button>
    </nav>
    <div className="hidden text-right text-xs sm:block"><p className="font-bold text-[#0B1220]">{name || "Your workspace"}</p><p className="text-[#64748B]">Private review only</p></div>
  </header>;
}

function ProofNotice() {
  return <div className="flex items-start gap-2 border-b border-blue-100 bg-[#EFF6FF] px-4 py-2.5 text-xs leading-5 text-[#1E40AF] sm:px-7"><Eye className="mt-0.5 h-4 w-4 shrink-0" /><p><strong>Design proof only.</strong> This route uses your real workspace data, but its Navy-and-Blue styling is not in the normal ViraSquare navigation and does not replace the live design.</p></div>;
}

function TodayProof({ workspace, products, dates, today }: { workspace: any; products: any[]; dates: string[]; today: string }) {
  const current = workspace.todayContent;
  const byDate = new Map<string, any>((workspace.weeklyPlan || []).map((item: any) => [item.plannedFor, item] as [string, any]));
  const featuredProduct = products.find(product => product.id === current?.productId);
  const completed = workspace.consistency?.weeklyProgress || 0;

  return <main className="mx-auto max-w-7xl px-4 py-5 sm:px-7 sm:py-8">
    <div className="grid gap-5 xl:grid-cols-[188px_minmax(0,1fr)_290px] xl:items-start">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,.05)] xl:sticky xl:top-5">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#2563EB]">Today</p>
        <p className="mt-2 text-5xl font-black tracking-[-.08em] text-[#0B1220]">{readable(today, { day: "numeric" })}</p>
        <p className="mt-1 text-sm font-bold text-[#334155]">{readable(today, { weekday: "long", month: "long" })}</p>
        <div className="mt-6 border-t border-slate-100 pt-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#64748B]">Weekly rhythm</p><div className="mt-3 grid grid-cols-7 gap-1.5 xl:grid-cols-1">{dates.map(date => { const item = byDate.get(date); const selected = date === today; return <div key={date} className={cn("rounded-lg border px-2 py-2", selected ? "border-[#2563EB] bg-[#EFF6FF]" : "border-slate-100 bg-[#FAFBFC]")}><div className="flex items-center justify-between"><span className="text-[10px] font-bold text-[#64748B]">{readable(date, { weekday: "short" })}</span>{item?.status === "completed" ? <CheckCircle2 className="h-3.5 w-3.5 text-[#2563EB]" /> : <CircleDot className="h-3.5 w-3.5 text-[#CBD5E1]" />}</div><span className="mt-1 block text-sm font-black text-[#0B1220]">{readable(date, { day: "numeric" })}</span></div>; })}</div></div>
      </aside>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,.08)]">
        <div className="grid min-h-[475px] lg:grid-cols-[.88fr_1.12fr]">
          <div className="relative overflow-hidden bg-[#0B1220] p-5 text-white sm:p-7"><div className="absolute right-[-4rem] top-[-5rem] h-56 w-56 rounded-full border-[28px] border-[#2563EB]/35" /><div className="relative flex h-full flex-col"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#93C5FD]">Today’s content canvas</p><h1 className="mt-4 max-w-sm text-4xl font-black leading-[.95] tracking-[-.065em] sm:text-5xl">{current?.title || "Your next post is taking shape"}</h1><p className="mt-5 max-w-md text-sm leading-6 text-slate-300">{current?.brief || "Your real content, product details, and next actions belong here."}</p><div className="mt-auto pt-8"><p className="text-xs font-semibold text-[#93C5FD]">{current?.caption ? "Caption, visual & selling help ready" : "Your written post is the next step"}</p><Button disabled className="mt-3 h-11 w-full rounded-xl bg-[#2563EB] text-white opacity-100 hover:bg-[#2563EB]"><Sparkles className="mr-2 h-4 w-4" />Review post <ArrowRight className="ml-2 h-4 w-4" /></Button></div></div></div>
          <div className="relative flex min-h-[330px] items-center justify-center overflow-hidden bg-[#F8FBFF] p-6 sm:p-9"><div className="absolute inset-x-0 top-0 h-2 bg-[#2563EB]" /><div className="absolute left-8 top-8 text-[10px] font-bold uppercase tracking-[.15em] text-[#64748B]">Your output</div>{featuredProduct?.imageUrl ? <div className="relative w-full max-w-[280px] rotate-[-2deg] overflow-hidden rounded-[1.5rem] border-[9px] border-white bg-white shadow-[0_20px_35px_rgba(15,23,42,.18)]"><div className="h-72 bg-white p-5"><img src={featuredProduct.imageUrl} alt={featuredProduct.name} className="h-40 w-full object-contain" /><p className="mt-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#2563EB]">Ready to post</p><p className="mt-1 text-2xl font-black tracking-[-.06em] text-[#0B1220]">{featuredProduct.name}</p><p className="mt-2 text-sm font-bold text-[#2563EB]">{featuredProduct.price ? `₦${featuredProduct.price}` : "Ask for price"}</p></div></div> : <div className="w-full max-w-[280px] rotate-[-2deg] rounded-[1.5rem] border-[9px] border-white bg-white p-6 shadow-[0_20px_35px_rgba(15,23,42,.18)]"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#2563EB]">{current?.format || "Content"}</p><p className="mt-6 text-3xl font-black leading-[.95] tracking-[-.07em] text-[#0B1220]">{current?.title || "Your next post"}</p><div className="mt-7 h-1.5 w-16 rounded-full bg-[#2563EB]" /><p className="mt-4 text-sm leading-6 text-[#64748B]">Your real post details remain the focus. This proof does not invent a product image for a non-product post.</p></div>}</div>
        </div>
      </section>

      <aside className="grid gap-4"><article className="rounded-2xl bg-[#2563EB] p-5 text-white shadow-[0_15px_28px_rgba(37,99,235,.22)]"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-100">Your next move</p><h2 className="mt-2 text-2xl font-black tracking-[-.05em]">Make this post yours.</h2><p className="mt-3 text-sm leading-6 text-blue-100">Review what is ready, save it for later, or share when the time is right.</p><div className="mt-5 space-y-2 text-sm"><p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Review visual</p><p className="flex items-center gap-2"><CircleDot className="h-4 w-4" />Save to Drafts</p><p className="flex items-center gap-2"><CircleDot className="h-4 w-4" />Post when ready</p></div></article><article className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#64748B]">Weekly momentum</p><p className="mt-1 text-3xl font-black tracking-[-.06em] text-[#0B1220]">{completed}%</p></div><Flame className="h-6 w-6 text-[#2563EB]" /></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E2E8F0]"><div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${completed}%` }} /></div><p className="mt-3 text-sm leading-6 text-[#64748B]">A small, visible rhythm helps you keep moving without turning content into pressure.</p></article></aside>
    </div>
  </main>;
}

function ProductsProof({ products, archivedProducts }: { products: any[]; archivedProducts: any[] }) {
  const featured = products[0];
  const rest = products.slice(1, 5);
  return <main className="mx-auto max-w-7xl px-4 py-5 sm:px-7 sm:py-8"><section className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)]"><aside className="rounded-2xl bg-[#0B1220] p-6 text-white xl:min-h-[590px]"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#93C5FD]">Creative inventory</p><h1 className="mt-4 text-4xl font-black leading-[.94] tracking-[-.07em]">What are we making visible next?</h1><p className="mt-5 text-sm leading-6 text-slate-300">Your products are not just a catalogue. They are starting points for a real flyer, caption, and selling package.</p><Button disabled className="mt-7 h-11 w-full rounded-xl bg-[#2563EB] text-white opacity-100 hover:bg-[#2563EB]"><PackagePlus className="mr-2 h-4 w-4" />Add product</Button><div className="mt-auto border-t border-white/10 pt-6"><p className="text-xs leading-5 text-[#BFDBFE]">Design proof only. Product actions remain in your current live workspace.</p></div></aside><section className="space-y-5"><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#2563EB]">My Products</p><h2 className="mt-1 text-3xl font-black tracking-[-.06em] text-[#0B1220]">Content-ready inventory</h2></div><span className="hidden rounded-full bg-[#EFF6FF] px-3 py-1.5 text-xs font-bold text-[#1D4ED8] sm:block">{products.length} active products</span></div>{featured ? <article className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_38px_rgba(15,23,42,.07)] md:grid-cols-[.92fr_1.08fr]"><div className="relative min-h-72 bg-[#EFF6FF] p-6"><p className="relative z-10 text-[10px] font-bold uppercase tracking-[.16em] text-[#2563EB]">Featured for content</p><img src={featured.imageUrl} alt={featured.name} className="relative z-10 mt-5 h-56 w-full object-contain" /><div className="absolute bottom-0 right-0 h-32 w-32 rounded-tl-[4rem] bg-[#2563EB]" /></div><div className="flex flex-col p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#64748B]">Product spotlight</p><h3 className="mt-3 text-4xl font-black leading-none tracking-[-.07em] text-[#0B1220]">{featured.name}</h3><p className="mt-3 text-sm font-bold text-[#2563EB]">{featured.price ? `₦${featured.price}` : "Ask for price"}</p><p className="mt-5 text-sm leading-6 text-[#64748B]">Ready to turn into a truthful product post using your real photo, verified details, and brand identity.</p><Button disabled className="mt-auto h-11 rounded-xl bg-[#0B1220] text-white opacity-100 hover:bg-[#0B1220]"><WandSparkles className="mr-2 h-4 w-4" />Turn into a post <ArrowRight className="ml-2 h-4 w-4" /></Button></div></article> : <article className="rounded-2xl border border-dashed border-[#93C5FD] bg-white p-8 text-center"><PackagePlus className="mx-auto h-8 w-8 text-[#2563EB]" /><h3 className="mt-3 text-xl font-black text-[#0B1220]">Your creative inventory starts with one real product.</h3><p className="mt-2 text-sm text-[#64748B]">This proof will show your real products once one is saved.</p></article>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rest.map(product => <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="h-36 bg-[#F8FAFC] p-3"><img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" /></div><div className="border-t border-slate-100 p-4"><p className="truncate font-black tracking-[-.03em] text-[#0B1220]">{product.name}</p><p className="mt-1 text-xs font-bold text-[#2563EB]">{product.price ? `₦${product.price}` : "Ask for price"}</p><p className="mt-4 text-xs font-bold text-[#64748B]">Ready for a product story <ArrowRight className="ml-1 inline h-3 w-3" /></p></div></article>)}</div>{archivedProducts.length > 0 && <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><ArchiveRestore className="h-5 w-5 text-[#2563EB]" /><div><p className="font-black text-[#0B1220]">Archived products</p><p className="text-sm text-[#64748B]">{archivedProducts.length} item{archivedProducts.length === 1 ? "" : "s"} still available for recovery in your live workspace.</p></div></div><span className="text-xs font-bold text-[#2563EB]">Archive is intentionally quiet here</span></section>}</section></section></main>;
}

export default function DesignProof() {
  const { loading, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<ProofTab>(() => window.location.pathname.endsWith("/products") ? "products" : "today");
  const today = useMemo(() => iso(), []);
  const dates = useMemo(() => weekDates(), []);
  const workspaceInput = useMemo(() => ({ today, weekStart: dates[0], weekEnd: dates[6] }), [dates, today]);
  const workspace = trpc.virasquare.workspace.useQuery(workspaceInput, { enabled: isAuthenticated });
  const products = trpc.virasquare.products.useQuery(undefined, { enabled: isAuthenticated });
  const archivedProducts = trpc.virasquare.archivedProducts.useQuery(undefined, { enabled: isAuthenticated });

  if (loading || (isAuthenticated && (workspace.isLoading || products.isLoading || archivedProducts.isLoading))) return <main className="grid min-h-screen place-items-center bg-[#F5F7FA]"><Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" /></main>;
  if (!isAuthenticated) return <main className="grid min-h-screen place-items-center bg-[#F5F7FA] p-6"><section className="max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm"><LayoutDashboard className="mx-auto h-8 w-8 text-[#2563EB]" /><h1 className="mt-4 text-2xl font-black text-[#0B1220]">Sign in to view this private design proof.</h1><p className="mt-3 text-sm leading-6 text-[#64748B]">This route is intentionally not part of the public ViraSquare experience.</p><Button onClick={() => startLogin()} className="mt-6 bg-[#2563EB] hover:bg-[#1D4ED8]">Sign in</Button></section></main>;
  if (!workspace.data?.profile) return <main className="grid min-h-screen place-items-center bg-[#F5F7FA] p-6"><section className="max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center"><h1 className="text-2xl font-black text-[#0B1220]">Complete your ViraSquare setup first.</h1><p className="mt-3 text-sm leading-6 text-[#64748B]">This proof appears after your real workspace has a business profile.</p></section></main>;

  return <main className="min-h-screen bg-[#F5F7FA] text-[#111827]"><ProofHeader active={tab} onChange={setTab} name={workspace.data.profile.businessName} /><ProofNotice />{tab === "today" ? <TodayProof workspace={workspace.data} products={products.data || []} dates={dates} today={today} /> : <ProductsProof products={products.data || []} archivedProducts={archivedProducts.data || []} />}</main>;
}
