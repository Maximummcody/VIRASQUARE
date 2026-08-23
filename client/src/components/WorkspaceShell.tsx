import { VisualMaker } from "@/components/VisualMaker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Archive, CalendarDays, CheckCircle2, ChevronRight, Clock3, LayoutGrid, Library, Loader2, Package, Palette, PenLine, Plus, Sparkles, Target, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type View = "today" | "calendar" | "products" | "library" | "brand";
type Item = {
  id: number;
  title: string;
  objective: string;
  format: string;
  brief: string;
  plannedFor: string;
  caption: string | null;
  hashtags: string[];
  carouselSlides: Array<{ cardType?: string; eyebrow?: string; heading: string; body: string; footer?: string }>;
  requiresProduct: boolean;
  preparationNote: string | null;
  lifecycleStatus: string;
};

const views: Array<{ id: View; label: string; icon: typeof Target; hint: string }> = [
  { id: "today", label: "Today", icon: Target, hint: "Your next useful action" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, hint: "Plan and prepare" },
  { id: "products", label: "My Products", icon: Package, hint: "Verified product facts" },
  { id: "library", label: "Library", icon: Library, hint: "Your created work" },
  { id: "brand", label: "Brand", icon: Palette, hint: "Card style and voice" },
];

const objectives = ["Teach something useful", "Build trust", "Invite a conversation", "Feature a product"];
const formats = [
  { value: "carousel", label: "Rich carousel", description: "A complete card set with organised detail." },
  { value: "caption", label: "Caption", description: "A focused written post for today." },
  { value: "tip", label: "Quick tip", description: "One useful, memorable idea." },
  { value: "promo", label: "Product post", description: "A truthful product-led invitation." },
  { value: "story", label: "Story", description: "A short conversational update." },
] as const;

function iso(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function readable(date: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(undefined, options).format(new Date(`${date}T12:00:00`));
}

function weekDates(now = new Date()) {
  const start = new Date(now);
  const day = now.getDay();
  start.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    return iso(next);
  });
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("This image could not be read."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function PostCreator({ close, onCreated }: { close: () => void; onCreated: (item: Item) => void }) {
  const utils = trpc.useUtils();
  const [objective, setObjective] = useState(objectives[0]);
  const [format, setFormat] = useState<(typeof formats)[number]["value"]>("carousel");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState(iso());
  const [ideas, setIdeas] = useState<Array<{ title: string; objective: string; format: "caption" | "carousel" | "tip" | "promo" | "story"; brief: string }>>([]);
  const suggest = trpc.virasquare.generateIdeas.useMutation({ onSuccess: result => setIdeas(result), onError: error => toast.error(error.message) });
  const save = trpc.virasquare.saveIdea.useMutation({
    onSuccess: result => {
      utils.virasquare.workspace.invalidate();
      utils.virasquare.library.invalidate();
      toast.success("Your new post is on the calendar.");
      onCreated(result as Item);
      close();
    },
    onError: error => toast.error(error.message),
  });

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#172017]/35 backdrop-blur-sm sm:items-center sm:p-6">
    <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-[2rem] bg-[#fffefa] shadow-2xl sm:rounded-[2rem]">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e8ece5] bg-[#fffefa]/95 px-5 py-4 sm:px-7">
        <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">CREATE A NEW POST</p><h2 className="mt-1 font-serif text-2xl text-[#263327]">Choose what you need today</h2></div>
        <button onClick={close} className="grid h-9 w-9 place-items-center rounded-full bg-[#f0f4ed]" aria-label="Close new post creator"><X className="h-4 w-4" /></button>
      </header>
      <div className="p-5 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <section className="rounded-3xl bg-[#263327] p-5 text-[#f7faed]"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#cce1b8]">1. YOUR INTENTION</p><p className="mt-2 text-sm leading-6 text-[#d8e2d2]">Tell ViraSquare what you want the post to do. It will suggest specific directions before anything is added to your calendar.</p><div className="mt-5 grid gap-2">{objectives.map(value => <button key={value} onClick={() => setObjective(value)} className={cn("rounded-2xl border p-3 text-left text-sm font-semibold transition", objective === value ? "border-[#eaf2ca] bg-[#eaf2ca] text-[#263327]" : "border-white/15 bg-white/5 text-[#eef6ea] hover:bg-white/10")}>{value}</button>)}</div><Label className="mt-5 block text-[#eaf2ca]">Optional topic or direction</Label><Textarea value={topic} onChange={event => setTopic(event.target.value)} className="mt-2 min-h-28 border-white/15 bg-white/5 text-white placeholder:text-[#b8c4b3]" placeholder="e.g. Help first-time buyers choose a watch they will wear often." /></section>
          <section><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">2. OUTPUT AND TIMING</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{formats.map(option => <button key={option.value} onClick={() => setFormat(option.value)} className={cn("rounded-2xl border p-4 text-left transition", format === option.value ? "border-[#263327] bg-[#edf4e9] shadow-sm" : "border-[#e1e8dc] bg-white hover:border-[#aabda2]")}><p className="font-semibold text-[#263327]">{option.label}</p><p className="mt-1 text-xs leading-5 text-[#6c776b]">{option.description}</p></button>)}</div><div className="mt-5 max-w-xs"><Label>Place this on your calendar</Label><Input type="date" value={date} onChange={event => setDate(event.target.value)} className="mt-2" /></div><Button disabled={suggest.isPending} onClick={() => suggest.mutate({ format, objective, topic: topic.trim() || undefined })} className="mt-6 w-full rounded-xl bg-[#263327] hover:bg-[#3b4b3b]">{suggest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Suggest post directions</Button></section>
        </div>
        {ideas.length > 0 && <section className="mt-7"><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">3. CHOOSE A DIRECTION</p><h3 className="mt-1 font-serif text-2xl text-[#263327]">Pick the post that feels most useful</h3></div><p className="hidden text-xs text-[#6d786c] sm:block">You can generate the full content after choosing.</p></div><div className="mt-4 grid gap-3 md:grid-cols-2">{ideas.map((idea, index) => <article key={`${idea.title}-${index}`} className="flex flex-col rounded-2xl border border-[#e1e8dc] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#75965f]">{idea.format} · {idea.objective}</p><h4 className="mt-3 font-serif text-xl leading-tight text-[#263327]">{idea.title}</h4><p className="mt-3 flex-1 text-sm leading-6 text-[#6a7568]">{idea.brief}</p><Button disabled={save.isPending} onClick={() => save.mutate({ date, title: idea.title, objective: idea.objective, format: idea.format, brief: idea.brief })} variant="outline" className="mt-5 w-full rounded-xl">Use this post <ChevronRight className="ml-1 h-4 w-4" /></Button></article>)}</div></section>}
      </div>
    </div>
  </div>;
}

function ContentDetail({ item, close }: { item: Item; close: () => void }) {
  const utils = trpc.useUtils();
  const generate = trpc.virasquare.generateContent.useMutation({ onSuccess: () => { utils.virasquare.workspace.invalidate(); utils.virasquare.library.invalidate(); toast.success("Your rich content is ready."); }, onError: error => toast.error(error.message) });
  const lifecycle = trpc.virasquare.setLifecycle.useMutation({ onSuccess: () => { utils.virasquare.workspace.invalidate(); utils.virasquare.library.invalidate(); toast.success("Content status updated."); }, onError: error => toast.error(error.message) });
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#172017]/35 backdrop-blur-sm sm:items-center sm:p-6"><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] bg-[#fffefa] shadow-2xl sm:rounded-[2rem]"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e8ece5] bg-[#fffefa]/95 px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">{item.format} · {item.lifecycleStatus}</p><h2 className="mt-1 font-serif text-2xl text-[#263327]">Your content</h2></div><button onClick={close} className="grid h-9 w-9 place-items-center rounded-full bg-[#f0f4ed]"><X className="h-4 w-4" /></button></header><div className="p-5 pb-8"><h3 className="font-serif text-3xl leading-tight text-[#263327]">{item.title}</h3><p className="mt-3 leading-6 text-[#667165]">{item.brief}</p>{item.requiresProduct && <div className="mt-5 rounded-2xl border border-[#cfe0c7] bg-[#f1f8ed] p-4 text-sm leading-6 text-[#496643]"><strong>Prepare this first.</strong> {item.preparationNote || "This post needs a real product image and verified details."}</div>}{!item.caption ? <div className="mt-7 rounded-2xl border border-dashed border-[#c9d9c1] bg-[#f6faf2] p-5 text-center"><Sparkles className="mx-auto h-6 w-6 text-[#719761]" /><p className="mt-3 font-medium">Ready to make this more complete?</p><p className="mt-1 text-sm text-[#748073]">ViraSquare will create the writing and a full card-set structure.</p><Button disabled={generate.isPending} onClick={() => generate.mutate({ itemId: item.id })} className="mt-5 rounded-xl bg-[#263327] hover:bg-[#3b4b3b]">{generate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create rich content</Button></div> : <><section className="mt-7 rounded-2xl border border-[#e4e9e0] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">CAPTION</p><p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-[#39453a]">{item.caption}</p></section>{item.carouselSlides.length > 0 && <section className="mt-5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">RICH CARD SET</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{item.carouselSlides.map((slide, index) => <article key={`${slide.heading}-${index}`} className="min-h-44 rounded-2xl bg-[#263327] p-4 text-[#f7f9ee]"><p className="text-[10px] font-bold uppercase tracking-wider text-[#c9dfb4]">{slide.cardType || "guide"} · {slide.eyebrow || `Card ${index + 1}`}</p><h4 className="mt-4 font-serif text-xl leading-tight">{slide.heading}</h4><p className="mt-3 text-xs leading-5 text-[#d5e0ce]">{slide.body}</p><p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#eaf2ca]">{slide.footer}</p></article>)}</div></section>}<VisualMaker item={item} /><div className="mt-6 rounded-2xl border border-[#e2e8de] bg-[#fbfcf8] p-4"><p className="text-sm font-semibold text-[#405142]">What happened after you posted?</p><p className="mt-1 text-xs leading-5 text-[#738072]">This is your own feedback—not assumed social data—and helps ViraSquare learn what you return to.</p><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => lifecycle.mutate({ itemId: item.id, lifecycleStatus: "posted" })} className="rounded-xl bg-[#263327] hover:bg-[#3b4b3b]"><CheckCircle2 className="mr-2 h-4 w-4" />Mark as posted</Button><Button onClick={() => lifecycle.mutate({ itemId: item.id, lifecycleStatus: "posted", outcome: "conversations" })} variant="outline" className="rounded-xl">Started conversations</Button><Button onClick={() => lifecycle.mutate({ itemId: item.id, lifecycleStatus: "posted", outcome: "orders" })} variant="outline" className="rounded-xl">Helped an order</Button><Button onClick={() => lifecycle.mutate({ itemId: item.id, lifecycleStatus: "posted", outcome: "engagement" })} variant="outline" className="rounded-xl">Useful engagement</Button><Button onClick={() => lifecycle.mutate({ itemId: item.id, lifecycleStatus: "archived" })} variant="ghost" className="rounded-xl text-[#8b514a]"><Archive className="mr-2 h-4 w-4" />Archive</Button></div></div></>}</div></div></div>;
}

function ProductManager() {
  const utils = trpc.useUtils();
  const products = trpc.virasquare.products.useQuery();
  const usage = trpc.virasquare.productUsage.useQuery();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [details, setDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const create = trpc.virasquare.createProduct.useMutation({ onSuccess: () => { setOpen(false); setName(""); setPrice(""); setDetails(""); setFile(null); utils.virasquare.products.invalidate(); toast.success("Product saved to My Products."); }, onError: error => toast.error(error.message) });
  const remove = trpc.virasquare.deleteProduct.useMutation({ onSuccess: () => { utils.virasquare.products.invalidate(); toast.success("Product removed."); }, onError: error => toast.error(error.message) });
  const add = async () => { if (!file || name.trim().length < 2) return toast.error("Add a product name and image first."); try { create.mutate({ name: name.trim(), price: price.trim() || undefined, details: details.trim() || undefined, image: { dataUrl: await readFile(file), fileName: file.name } }); } catch { toast.error("The image could not be read."); } };
  return <section><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">YOUR CATALOGUE</p><h1 className="mt-1 font-serif text-3xl text-[#263327]">My Products</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#6c776b]">Keep verified product information ready for the content that actually needs it.</p></div><Button onClick={() => setOpen(value => !value)} className="rounded-xl bg-[#263327] hover:bg-[#3b4b3b]"><Plus className="mr-2 h-4 w-4" />Add product</Button></div>{open && <div className="mt-5 grid gap-4 rounded-2xl border border-[#dce8d5] bg-[#f8fbf5] p-4 sm:grid-cols-2"><div className="grid gap-2"><Label>Product name</Label><Input value={name} onChange={event => setName(event.target.value)} /></div><div className="grid gap-2"><Label>Verified price</Label><Input value={price} onChange={event => setPrice(event.target.value)} /></div><div className="grid gap-2 sm:col-span-2"><Label>Product image</Label><Input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => setFile(event.target.files?.[0] ?? null)} /></div><div className="grid gap-2 sm:col-span-2"><Label>Verified details</Label><Textarea value={details} onChange={event => setDetails(event.target.value)} /></div><div className="sm:col-span-2"><Button onClick={add} disabled={create.isPending} className="rounded-xl bg-[#263327] hover:bg-[#3b4b3b]">{create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save product</Button></div></div>}<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.data?.map(product => { const insight = usage.data?.find(entry => entry.productId === product.id); return <article key={product.id} className="overflow-hidden rounded-2xl border border-[#e1e8dc] bg-white"><img src={product.imageUrl} alt={product.name} className="aspect-square w-full object-cover" /><div className="p-4"><div className="flex justify-between gap-2"><div><h2 className="font-serif text-xl text-[#263327]">{product.name}</h2><p className="mt-1 text-sm text-[#6f7c6e]">{product.price ? `₦${product.price}` : "Price on request"}</p></div><Button onClick={() => remove.mutate({ productId: product.id })} size="icon" variant="ghost" className="h-8 w-8 text-[#a25f55]"><Trash2 className="h-4 w-4" /></Button></div><p className="mt-3 line-clamp-2 text-sm leading-5 text-[#738072]">{product.details || "No verified details yet."}</p><div className="mt-4 flex gap-2 text-[10px] font-bold uppercase tracking-wide"><span className="rounded-full bg-[#eef6e9] px-2 py-1 text-[#557445]">{insight?.visualCount || 0} visuals</span><span className="rounded-full bg-[#eef0ff] px-2 py-1 text-[#506099]">{insight?.postedCount || 0} posted</span></div></div></article>; })}{!products.data?.length && <div className="rounded-2xl border border-dashed border-[#cbd9c4] bg-[#fbfcf8] p-7 text-sm text-[#6f7b6f]">Your product catalogue is empty. Add products here before a product-led post needs one.</div>}</div></section>;
}

function BrandSettings({ profile, onEditProfile }: { profile: any; onEditProfile: () => void }) {
  const utils = trpc.useUtils();
  const [primary, setPrimary] = useState(profile.brandPrimaryColor || "#263327");
  const [accent, setAccent] = useState(profile.brandAccentColor || "#EAF2CA");
  const [cta, setCta] = useState(profile.defaultCta || "Send us a message to order.");
  const save = trpc.virasquare.saveProfile.useMutation({ onSuccess: () => { utils.virasquare.profile.invalidate(); utils.virasquare.workspace.invalidate(); toast.success("Your card style is saved."); }, onError: error => toast.error(error.message) });
  const submit = () => save.mutate({ businessName: profile.businessName, businessType: profile.businessType, businessCategory: profile.businessCategory, targetAudience: profile.targetAudience, contentPillars: profile.contentPillars, postingGoal: profile.postingGoal, weeklyPostGoal: profile.weeklyPostGoal, brandVoice: profile.brandVoice, brandPrimaryColor: primary, brandAccentColor: accent, defaultCta: cta });
  return <section className="max-w-2xl"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">YOUR FOUNDATION</p><h1 className="mt-1 font-serif text-3xl text-[#263327]">Brand</h1><div className="mt-6 rounded-2xl border border-[#e2e8de] bg-[#fffefa] p-5"><p className="font-serif text-2xl text-[#263327]">{profile.businessName}</p><p className="mt-2 text-sm leading-6 text-[#6c776b]">{profile.brandVoice}</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label>Primary card colour</Label><div className="flex items-center gap-2"><Input type="color" value={primary} onChange={event => setPrimary(event.target.value)} className="h-10 w-14 p-1" /><Input value={primary} onChange={event => setPrimary(event.target.value)} /></div></div><div className="grid gap-2"><Label>Accent colour</Label><div className="flex items-center gap-2"><Input type="color" value={accent} onChange={event => setAccent(event.target.value)} className="h-10 w-14 p-1" /><Input value={accent} onChange={event => setAccent(event.target.value)} /></div></div><div className="grid gap-2 sm:col-span-2"><Label>Default call to action</Label><Input value={cta} onChange={event => setCta(event.target.value)} placeholder="e.g. Send us a message to order." /></div></div><div className="mt-6 flex flex-wrap gap-2"><Button onClick={submit} disabled={save.isPending} className="rounded-xl bg-[#263327] hover:bg-[#3b4b3b]">{save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save card style</Button><Button onClick={onEditProfile} variant="outline" className="rounded-xl">Edit business profile</Button></div></div></section>;
}

function CalendarPanel({ plan, dates, select, create }: { plan: Item[]; dates: string[]; select: (item: Item) => void; create: () => void }) {
  const planned = plan.length;
  const ready = plan.filter(item => Boolean(item.caption)).length;
  const prep = plan.filter(item => item.requiresProduct).length;
  return <section><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">YOUR RHYTHM</p><h1 className="mt-1 font-serif text-3xl text-[#263327]">Calendar</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#6c776b]">Plan the week, see what needs preparation, and keep every post moving toward a real action.</p></div><Button onClick={create} className="rounded-xl bg-[#263327] hover:bg-[#3b4b3b]"><Plus className="mr-2 h-4 w-4" />Add a post</Button></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-[#edf4e9] p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#53764b]">PLANNED THIS WEEK</p><p className="mt-2 font-serif text-3xl text-[#334b32]">{planned}</p></div><div className="rounded-2xl bg-[#fff2d6] p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#806531]">READY TO REVIEW</p><p className="mt-2 font-serif text-3xl text-[#68552e]">{ready}</p></div><div className="rounded-2xl bg-[#edf0ff] p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#55639a]">NEEDS PRODUCT PREP</p><p className="mt-2 font-serif text-3xl text-[#394979]">{prep}</p></div></div><div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-7">{dates.map(date => { const item = plan.find(value => value.plannedFor === date); return <article key={date} className={cn("min-h-52 rounded-2xl border p-4", item ? "border-[#dbe6d6] bg-[#fffefa]" : "border-dashed border-[#dbe3d7] bg-[#fbfcf9]")}><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wide text-[#788676]">{readable(date, { weekday: "short" })}</p><p className="mt-1 font-serif text-2xl text-[#263327]">{readable(date, { day: "numeric" })}</p></div>{item && <span className="rounded-full bg-[#edf4e9] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#557447]">{item.lifecycleStatus}</span>}</div>{item ? <button onClick={() => select(item)} className="mt-6 text-left"><h2 className="font-serif text-lg leading-tight text-[#263327]">{item.title}</h2><p className="mt-3 line-clamp-3 text-xs leading-5 text-[#6d786b]">{item.brief}</p>{item.requiresProduct && <p className="mt-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#4d793d]"><Package className="h-3 w-3" />Prepare product</p>}</button> : <button onClick={create} className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#5b7258]"><Plus className="h-4 w-4" />Add a post</button>}</article>; })}</div><div className="mt-5 rounded-2xl border border-[#e1e8dc] bg-white p-4 text-sm leading-6 text-[#6c776b]"><strong className="text-[#334b32]">How this works:</strong> planned posts hold the idea, ready posts have their written content, and product-prep markers appear only where tomorrow’s post genuinely needs real product information.</div></section>;
}

export function WorkspaceShell({ onEditProfile }: { onEditProfile: () => void }) {
  const [view, setView] = useState<View>("today");
  const [selected, setSelected] = useState<Item | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const today = useMemo(() => iso(), []);
  const dates = useMemo(() => weekDates(), []);
  const workspace = trpc.virasquare.workspace.useQuery({ today, weekStart: dates[0], weekEnd: dates[6] });
  const reminder = trpc.virasquare.preparationReminder.useQuery({ date: today });
  const library = trpc.virasquare.library.useQuery(undefined, { enabled: view === "library" });
  const visuals = trpc.virasquare.visuals.useQuery(undefined, { enabled: view === "library" });
  const activity = trpc.virasquare.activity.useQuery(undefined, { enabled: view === "library" });
  const profile = trpc.virasquare.profile.useQuery();
  if (workspace.isLoading) return <div className="grid min-h-screen place-items-center bg-[#f7f7f2]"><Loader2 className="h-6 w-6 animate-spin text-[#75965f]" /></div>;
  if (!workspace.data?.profile) return null;
  const current = workspace.data.todayContent as Item | null;
  const plan = workspace.data.weeklyPlan as Item[];
  const selectCreated = (item: Item) => { setView("calendar"); setSelected(item); };
  const nav = (mobile = false) => <nav className={cn(mobile ? "grid grid-cols-5 gap-1" : "mt-5 grid gap-1")}>{views.map(entry => { const Icon = entry.icon; const mobileLabel = entry.id === "calendar" ? "Plan" : entry.id === "products" ? "Products" : entry.label; return <button key={entry.id} onClick={() => setView(entry.id)} className={cn("group flex shrink-0 items-center gap-3 rounded-xl text-left transition", mobile ? "flex-col justify-center gap-1 px-1 py-2 text-[9px] font-semibold" : "px-3 py-3", view === entry.id ? "bg-[#263327] text-[#f7faed] shadow-sm" : "text-[#687466] hover:bg-[#eef4ea]")}><Icon className={cn("h-4 w-4", view === entry.id ? "text-[#eaf2ca]" : "text-[#789176]")} /><span><span className="block font-semibold">{mobile ? mobileLabel : entry.label}</span>{!mobile && <span className="mt-0.5 block text-[11px] font-normal opacity-75">{entry.hint}</span>}</span></button>; })}</nav>;
  return <main className="min-h-screen bg-[#f7f7f2] text-[#263327]"><div className="mx-auto max-w-[1440px] px-3 py-3 sm:px-5 sm:py-5 lg:px-7"><div className="lg:grid lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-7"><aside className="hidden min-h-[calc(100vh-2.5rem)] flex-col rounded-[2rem] border border-white bg-[#fffefa] p-4 shadow-sm lg:flex"><div className="flex items-center gap-3 px-2 py-2"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#263327] font-serif text-lg italic text-[#ecf8c5]">v</div><div><p className="font-semibold tracking-[-.04em] text-[#263327]">virasquare</p><p className="text-[10px] uppercase tracking-[.14em] text-[#789176]">Content system</p></div></div><Button onClick={() => setCreatorOpen(true)} className="mt-7 h-11 rounded-xl bg-[#263327] text-sm hover:bg-[#3b4b3b]"><PenLine className="mr-2 h-4 w-4" />Create a post</Button>{nav()}<div className="mt-auto rounded-2xl bg-[#edf4e9] p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#527542]">YOUR CURRENT FOCUS</p><p className="mt-2 font-serif text-lg leading-tight text-[#334b32]">{current?.objective || "Your next useful post"}</p><button onClick={() => current && setSelected(current)} className="mt-3 text-xs font-semibold text-[#4f7448]">Open today’s post <ChevronRight className="inline h-3.5 w-3.5" /></button></div></aside><section className="min-w-0"><header className="flex items-center justify-between rounded-2xl border border-white bg-[#fffefa]/95 px-3 py-3 shadow-sm lg:hidden"><div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-xl bg-[#263327] font-serif italic text-[#ecf8c5]">v</div><span className="font-semibold tracking-[-.04em]">virasquare</span></div><Button onClick={() => setCreatorOpen(true)} size="sm" className="rounded-xl bg-[#263327] hover:bg-[#3b4b3b]"><Plus className="mr-1 h-4 w-4" />Post</Button></header><div className="mt-3 rounded-2xl border border-white bg-[#fffefa] px-2 py-1 shadow-sm lg:hidden">{nav(true)}</div>{reminder.data && <button onClick={() => setSelected(reminder.data?.item as Item)} className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-[#cfe0c7] bg-[#eef7e9] p-4 text-left text-sm text-[#45623e]"><span><strong>Prepare for tomorrow.</strong> {reminder.data.note}</span><Package className="h-5 w-5 shrink-0" /></button>}
        <div className="pt-5 lg:pt-0">{view === "today" && <section><div className="rounded-[2rem] bg-[#263327] p-6 text-[#f7faed] shadow-lg sm:p-9"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#cce1b8]">{readable(today, { weekday: "long", month: "long", day: "numeric" })}</p><p className="mt-7 text-sm text-[#c7d4c1]">Today’s content focus</p><h1 className="mt-1 max-w-4xl font-serif text-4xl leading-[.95] sm:text-5xl lg:text-6xl">{current?.objective || "Finding your focus"}</h1></div><Button onClick={() => setCreatorOpen(true)} variant="secondary" className="shrink-0 rounded-xl bg-[#eaf2ca] text-[#263327] hover:bg-[#f4f8da]"><Plus className="mr-2 h-4 w-4" />Another post</Button></div>{current ? <button onClick={() => setSelected(current)} className="mt-8 w-full max-w-4xl rounded-2xl bg-white/10 p-5 text-left transition hover:bg-white/15"><p className="text-[10px] font-bold uppercase tracking-wider text-[#cce1b8]">Your recommended post · {current.lifecycleStatus}</p><h2 className="mt-2 font-serif text-2xl sm:text-3xl">{current.title}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-[#d6e0d1]">{current.brief}</p><p className="mt-4 text-xs font-semibold text-[#eaf2ca]">Open and create content <ChevronRight className="inline h-3.5 w-3.5" /></p></button> : <p className="mt-7">Your first recommendation is being prepared.</p>}</div><div className="mt-7 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">THIS WEEK</p><h2 className="mt-1 font-serif text-2xl">Your content rhythm</h2></div><button onClick={() => setView("calendar")} className="text-sm font-semibold text-[#527542]">Open calendar <ChevronRight className="inline h-4 w-4" /></button></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">{dates.map(date => { const item = plan.find(value => value.plannedFor === date); return <button key={date} onClick={() => item ? setSelected(item) : setCreatorOpen(true)} className={cn("min-h-40 rounded-2xl border p-3 text-left", item ? "border-[#e2e8de] bg-[#fffefa]" : "border-dashed border-[#dce5d8] bg-[#fbfcf9]")}><p className="text-[10px] font-bold uppercase tracking-wider text-[#788676]">{readable(date, { weekday: "short" })}</p><p className="mt-1 font-serif text-xl">{readable(date, { day: "numeric" })}</p>{item ? <><p className="mt-5 line-clamp-3 text-xs font-medium leading-5 text-[#475347]">{item.title}</p><p className="mt-2 text-[10px] font-bold uppercase text-[#75965f]">{item.lifecycleStatus}</p></> : <p className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#6f866b]"><Plus className="h-3.5 w-3.5" />Add post</p>}</button>; })}</div></section>}{view === "calendar" && <CalendarPanel plan={plan} dates={dates} select={setSelected} create={() => setCreatorOpen(true)} />}{view === "products" && <ProductManager />}{view === "library" && <section><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">YOUR WORK</p><h1 className="mt-1 font-serif text-3xl text-[#263327]">Library</h1><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-[#eaf3e4] p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#527542]">Generated</p><p className="mt-2 font-serif text-3xl text-[#334b32]">{activity.data?.filter(event => event.eventType === "generated").length || 0}</p></div><div className="rounded-2xl bg-[#fff2d6] p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#806531]">Downloaded</p><p className="mt-2 font-serif text-3xl text-[#68552e]">{activity.data?.filter(event => event.eventType === "downloaded").length || 0}</p></div><div className="rounded-2xl bg-[#edf0ff] p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#55639a]">Posted</p><p className="mt-2 font-serif text-3xl text-[#394979]">{activity.data?.filter(event => event.eventType === "posted").length || 0}</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{library.data?.map((entry: any) => <button key={entry.id} onClick={() => setSelected({ ...entry, hashtags: [], carouselSlides: [] } as Item)} className="rounded-2xl border border-[#e2e8de] bg-[#fffefa] p-4 text-left"><p className="text-[10px] font-bold uppercase tracking-wide text-[#75965f]">{entry.lifecycleStatus}</p><h2 className="mt-3 font-serif text-xl text-[#263327]">{entry.title}</h2><p className="mt-2 line-clamp-2 text-sm text-[#6c776b]">{entry.brief}</p></button>)}</div><p className="mt-7 text-sm text-[#6c776b]">{visuals.data?.filter(Boolean).length || 0} visual set(s) saved in your library.</p></section>}{view === "brand" && profile.data && <BrandSettings profile={profile.data} onEditProfile={onEditProfile} />}</div>
      </section></div></div>{selected && <ContentDetail item={selected} close={() => setSelected(null)} />}{creatorOpen && <PostCreator close={() => setCreatorOpen(false)} onCreated={selectCreated} />}</main>;
}
