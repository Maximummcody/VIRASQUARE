import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductPicker } from "@/components/ProductPicker";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { filterLibraryContent, filterLibraryWork, getLibraryWorkTab, libraryWorkCount, paginateLibraryWork, searchLibraryWork, sortLibraryWork, type LibraryContentFilter, type LibrarySort, type LibraryWorkTab } from "@/lib/libraryWork";
import { getDailyBriefState, getWeeklyDateState, getWeeklyMomentum, mobileWeeklyDates, shouldShowJumpToToday } from "@/lib/dailyBrief";
import { cn } from "@/lib/utils";
import { emptyDayCopy, todayProgressCopy } from "./workspaceCopy";
import { VisualMaker } from "./VisualMaker";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Eye,
  Info,
  Instagram,
  Library,
  Loader2,
  Package,
  Palette,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type View = "today" | "brief" | "calendar" | "products" | "library" | "brand";
type IdeaFormat = "caption" | "carousel" | "tip" | "promo" | "story";
type Item = {
  id: number;
  title: string;
  objective: string;
  format: IdeaFormat;
  brief: string;
  plannedFor: string;
  caption: string | null;
  hashtags: string[];
  carouselSlides: Array<{ cardType?: string; eyebrow?: string; heading: string; body: string; footer?: string }>;
  requiresProduct: boolean;
  preparationNote: string | null;
  lifecycleStatus: string;
  feedbackOutcome?: "not_set" | "conversations" | "orders" | "engagement" | "saved_for_later";
  productId?: number | null;
  entryType?: "calendar" | "product_education";
  sourceContentItemId?: number | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  status?: "planned" | "completed";
};
type LibraryEntry = Omit<Item, "hashtags" | "carouselSlides"> & { hashtags: string | null; carouselSlides: string | null };

type BusinessContext = {
  differentiator: string;
  buyerHesitations: string;
  firstTimeUnderstanding: string;
  currentPriority: string;
  neverSay: string;
};

function parseSavedSlides(value: string | null | undefined): Item["carouselSlides"] {
  try {
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter(slide => slide && typeof slide.heading === "string" && typeof slide.body === "string") : [];
  } catch {
    return [];
  }
}

const views: Array<{ id: View; label: string; mobileLabel: string; icon: typeof Target }> = [
  { id: "brief", label: "Today", mobileLabel: "Today", icon: Target },
  { id: "calendar", label: "Calendar", mobileLabel: "Plan", icon: CalendarDays },
  { id: "products", label: "My Products", mobileLabel: "Products", icon: Package },
  { id: "library", label: "Library", mobileLabel: "Library", icon: Library },
  { id: "brand", label: "Brand", mobileLabel: "Brand", icon: Palette },
];

const objectives = ["Education", "Engagement", "Build trust", "Feature a product"];
const formats: Array<{ value: IdeaFormat; label: string; description: string }> = [
  { value: "carousel", label: "Rich cards", description: "A useful organised card set." },
  { value: "caption", label: "Caption", description: "A focused written post." },
  { value: "tip", label: "Quick tip", description: "One clear useful thought." },
  { value: "promo", label: "Product post", description: "A truthful product-led post." },
  { value: "story", label: "Story", description: "A short conversational update." },
];

const categories = [
  { value: "fashion", label: "Fashion" },
  { value: "accessories", label: "Accessories" },
  { value: "beauty", label: "Beauty" },
  { value: "personal_care", label: "Personal care" },
  { value: "other", label: "Other" },
];

function iso(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
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

function emptyBusinessContext(initial?: Partial<BusinessContext>): BusinessContext {
  return {
    differentiator: initial?.differentiator || "",
    buyerHesitations: initial?.buyerHesitations || "",
    firstTimeUnderstanding: initial?.firstTimeUnderstanding || "",
    currentPriority: initial?.currentPriority || "",
    neverSay: initial?.neverSay || "",
  };
}

function BusinessContextFields({ value, onChange, compact = false, guided = false }: { value: BusinessContext; onChange: (next: BusinessContext) => void; compact?: boolean; guided?: boolean }) {
  const field = (key: keyof BusinessContext, label: string, helper: string, placeholder: string, number?: string) => (
    <div className={cn("grid gap-2", guided && "rounded-xl border border-[#dce7d7] bg-white p-4")} key={key}>
      {guided ? <div className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e8f1e2] text-[10px] font-bold text-[#48653f]">{number}</span><div><Label className="text-sm font-semibold text-[#334b32]">{label}</Label><p className="mt-1 text-xs leading-5 text-[#718071]">{helper}</p></div></div> : <><Label className="text-sm font-semibold text-[#334b32]">{label}</Label><p className="-mt-1 text-xs leading-5 text-[#718071]">{helper}</p></>}
      <Textarea
        value={value[key]}
        onChange={event => onChange({ ...value, [key]: event.target.value })}
        placeholder={placeholder}
        className={cn("resize-none bg-[#fffefa]", compact || guided ? "min-h-20" : "min-h-24")}
      />
    </div>
  );
  const groupTitle = (number: string, title: string, detail: string) => <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">{number} · {title}</p><p className="mt-1 text-xs leading-5 text-[#718071]">{detail}</p></div>;
  const completed = Object.values(value).filter(answer => answer.trim().length > 0).length;

  if (guided || compact) return <div className="grid gap-5"><aside className="flex flex-col justify-between gap-3 rounded-xl border border-[#d5e4cf] bg-[#f3f8ef] p-4 sm:flex-row sm:items-center"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#557447]">WHAT THESE ANSWERS CHANGE</p><p className="mt-1 text-sm leading-5 text-[#445b43]">They give ViraSquare more relevant ideas, clearer customer concerns, and safer wording for your business.</p></div><div className="shrink-0 rounded-lg border border-[#c5d8bc] bg-white px-3 py-2 text-center"><p className="font-serif text-xl text-[#334b32]">{completed}<span className="text-sm text-[#6f806d]">/5</span></p><p className="text-[9px] font-bold uppercase tracking-[.1em] text-[#668160]">answers added</p></div></aside>
    <section className="grid gap-3">{groupTitle("01", "YOUR DIFFERENCE", "The real reasons people choose, return to, or recommend you.")}{field("differentiator", "What makes you different?", "Why do customers choose you, return to you, or recommend you?", "For example: careful styling help, made-to-order options, or clear honest guidance.", "1")}</section>
    <section className="grid gap-3">{groupTitle("02", "YOUR CUSTOMERS", "The questions and expectations your content should address clearly.")}<div className="grid gap-3">{field("buyerHesitations", "What do customers usually ask or worry about before buying?", "For example: price, fit, authenticity, how to use it, delivery, or whether it is right for them.", "Share the questions you hear most often.", "2")}{field("firstTimeUnderstanding", "What should a first-time customer understand before choosing from you?", "This helps ViraSquare guide people without creating the wrong expectation.", "What would help a new customer choose well?", "3")}</div></section>
    <section className="grid gap-3">{groupTitle("03", "RIGHT NOW", "What to focus on and what ViraSquare must avoid saying.")}<div className="grid gap-3">{field("currentPriority", "What are you focusing on right now?", "A product, service, offer, season, goal, or customer type.", "For example: everyday jewellery for gifting, or a back-to-school offer.", "4")}{field("neverSay", "What must we never say or promise?", "Include claims, prices, availability, results, or wording you cannot stand behind.", "For example: do not promise delivery times or results.", "5")}</div></section>
  </div>;

  return <div className="grid gap-5">
    {field("differentiator", "What makes you different?", "Why do customers choose you, return to you, or recommend you?", "For example: careful styling help, made-to-order options, or clear honest guidance.")}
    {field("buyerHesitations", "What do customers usually ask or worry about before buying?", "For example: price, fit, authenticity, how to use it, delivery, or whether it is right for them.", "Share the questions you hear most often.")}
    {field("firstTimeUnderstanding", "What should a first-time customer understand before choosing from you?", "This helps ViraSquare guide people without creating the wrong expectation.", "What would help a new customer choose well?")}
    {field("currentPriority", "What are you focusing on right now?", "A product, service, offer, season, goal, or customer type.", "For example: everyday jewellery for gifting, or a back-to-school offer.")}
    {field("neverSay", "What must we never say or promise?", "Include claims, prices, availability, results, or wording you cannot stand behind.", "For example: do not promise delivery times or results.")}
  </div>;
}

function BusinessContextModal({ initial, onFinished }: { initial?: Partial<BusinessContext>; onFinished: () => void }) {
  const utils = trpc.useUtils();
  const [context, setContext] = useState(() => emptyBusinessContext(initial));
  const save = trpc.virasquare.saveBusinessContext.useMutation({
    onSuccess: () => {
      utils.virasquare.workspace.invalidate();
      utils.virasquare.profile.invalidate();
      toast.success("Your business context is saved.");
      onFinished();
    },
    onError: error => toast.error(error.message),
  });
  const dismiss = trpc.virasquare.dismissBusinessContext.useMutation({
    onSuccess: () => {
      utils.virasquare.workspace.invalidate();
      utils.virasquare.profile.invalidate();
      onFinished();
    },
    onError: error => toast.error(error.message),
  });

  return <div className="fixed inset-0 z-50 flex items-end bg-[#172017]/45 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6">
    <section role="dialog" aria-modal="true" aria-label="Add business context" className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-[#fffefa] p-5 shadow-2xl sm:rounded-[2rem] sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">MAKE VIRASQUARE MORE USEFUL</p>
          <h2 className="mt-2 font-serif text-3xl leading-tight text-[#263327]">A little context helps every idea feel more like your business.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#647063]">These are optional, but the answers give ViraSquare real direction instead of letting it make assumptions. You can edit them later in Brand.</p>
        </div>
        <button onClick={() => dismiss.mutate()} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eef4ea] text-[#4f674f]" aria-label="Not now"><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-7"><BusinessContextFields value={context} onChange={setContext} guided /></div>
      <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={() => dismiss.mutate()} disabled={dismiss.isPending || save.isPending} className="rounded-xl">Not now</Button>
        <Button onClick={() => save.mutate(context)} disabled={dismiss.isPending || save.isPending} className="rounded-xl bg-[#263327] hover:bg-[#3b4b3b]">{save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save this context</Button>
      </div>
    </section>
  </div>;
}

function ProductInvite({ onAdd, onDismiss }: { onAdd: () => void; onDismiss: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end bg-[#172017]/45 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6">
    <section role="dialog" aria-modal="true" aria-label="Add your first product" className="w-full max-w-lg rounded-t-[2rem] bg-[#fffefa] p-6 shadow-2xl sm:rounded-[2rem] sm:p-8">
      <Package className="h-8 w-8 text-[#719761]" />
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">WHEN YOU ARE READY</p>
      <h2 className="mt-2 font-serif text-3xl leading-tight text-[#263327]">One product can become a selling set.</h2>
      <p className="mt-3 text-sm leading-6 text-[#647063]">Products are only needed when you choose product-led content. Add one when you are ready and ViraSquare can use your real image and facts, rather than guess.</p>
      <div className="mt-5 overflow-hidden rounded-2xl border border-[#d8e5d1] bg-[#f6faf2] p-3">
        <p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#66845d]">WHAT THIS UNLOCKS</p>
        <div className="mt-3 overflow-hidden rounded-xl bg-[#263327] p-4 text-[#f7faed]"><p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#cce1b8]">YOUR REAL PRODUCT</p><p className="mt-5 font-serif text-2xl leading-tight">A ready-to-post flyer, matching caption, and buyer reply.</p><div className="mt-5 flex items-center justify-between border-t border-white/15 pt-3 text-[10px] font-bold uppercase tracking-wide text-[#eaf2ca]"><span>Your brand</span><span>Send a message to order</span></div></div>
        <p className="mt-3 text-xs leading-5 text-[#6a7869]">This is a preview only. Nothing is generated until you choose a real product and start a post.</p>
      </div>
      <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onDismiss} className="rounded-xl">Not now</Button>
        <Button onClick={onAdd} className="rounded-xl bg-[#263327] hover:bg-[#3b4b3b]"><Plus className="mr-2 h-4 w-4" />Add a product when ready</Button>
      </div>
    </section>
  </div>;
}

function ProgressivePrompts({ profile, current, productCount, onOpenProducts }: { profile: any; current: Item | null; productCount: number; onOpenProducts: () => void }) {
  const utils = trpc.useUtils();
  const [showInvite, setShowInvite] = useState(false);
  const hasReceivedValue = Boolean(current?.caption);
  const shouldAskContext = hasReceivedValue && profile.businessContextStatus === "not_started";
  const canInvite = hasReceivedValue && productCount === 0 && profile.productInviteStatus === "not_started";
  const setInvite = trpc.virasquare.setProductInviteStatus.useMutation({
    onSuccess: () => {
      utils.virasquare.workspace.invalidate();
      utils.virasquare.profile.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (!shouldAskContext && canInvite) setShowInvite(true);
  }, [shouldAskContext, canInvite]);

  if (shouldAskContext) return <BusinessContextModal initial={profile.businessContext} onFinished={() => setShowInvite(true)} />;
  if (!showInvite || !canInvite) {
    return null;
  }
  return <ProductInvite onAdd={() => { setInvite.mutate({ status: "dismissed" }); setShowInvite(false); onOpenProducts(); }} onDismiss={() => { setInvite.mutate({ status: "dismissed" }); setShowInvite(false); }} />;
}

function AlternativeIdeaGenerator({ date, onSelected, onNeedProduct, productStarter }: { date: string; onSelected: (item: Item) => void; onNeedProduct: () => void; productStarter?: { productId: number; key: number } | null }) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [objective, setObjective] = useState("Education");
  const [format, setFormat] = useState<IdeaFormat>("carousel");
  const [topic, setTopic] = useState("");
  const [productId, setProductId] = useState<number | undefined>();
  const [ideas, setIdeas] = useState<Array<{ title: string; objective: string; format: IdeaFormat; brief: string }>>([]);
  const products = trpc.virasquare.products.useQuery(undefined, { enabled: open });
  const isProductLed = objective === "Feature a product" || format === "promo";
  const suggest = trpc.virasquare.generateIdeas.useMutation({ onSuccess: value => setIdeas(value), onError: error => toast.error(error.message) });
  const useIdea = trpc.virasquare.saveIdea.useMutation({
    onSuccess: value => {
      utils.virasquare.workspace.invalidate();
      utils.virasquare.library.invalidate();
      toast.success("Your selected idea is ready for you.");
      onSelected(value as Item);
    },
    onError: error => toast.error(error.message),
  });
  useEffect(() => {
    if (!productStarter) return;
    setOpen(true);
    setObjective("Feature a product");
    setFormat("promo");
    setProductId(productStarter.productId);
    setIdeas([]);
  }, [productStarter?.key]);
  const showIdeas = () => {
    if (isProductLed && !productId) {
      if (!products.data?.length) onNeedProduct();
      else toast.error("Choose the product this post is about first.");
      return;
    }
    suggest.mutate({ objective, format, topic: topic.trim() || undefined, productId: isProductLed ? productId : undefined });
  };

  return <section className="mt-6 rounded-2xl border border-[#dfe8d9] bg-[#fffefa] p-4 shadow-sm sm:p-5">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">YOUR ALTERNATIVE</p><h2 className="mt-1 font-serif text-xl text-[#263327] sm:text-2xl">Need a different direction?</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-[#697568]">If today’s planned post is not right, choose what you want to make instead. ViraSquare will suggest a few directions for you to choose from.</p></div>
      <Button onClick={() => setOpen(value => !value)} variant={open ? "outline" : "default"} className={cn("rounded-xl", open ? "" : "bg-[#263327] hover:bg-[#3b4b3b]")}>{open ? "Close options" : "Choose what to make"}</Button>
    </div>
    {open && <div className="mt-6 border-t border-[#e5ebe0] pt-6">
      <p className="text-xs leading-5 text-[#738071]">Your current recommendation stays above until you choose one of these alternatives.</p>
      <div className="mt-5 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <section><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">WHAT SHOULD THIS POST DO?</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{objectives.map(value => <button key={value} onClick={() => { setObjective(value); if (value !== "Feature a product" && format !== "promo") setProductId(undefined); }} className={cn("rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition", objective === value ? "border-[#263327] bg-[#edf4e9] text-[#263327]" : "border-[#dde5d8] bg-white text-[#667265] hover:border-[#aebfa5]")}>{value}</button>)}</div><Label className="mt-5 block">Anything specific?</Label><Textarea value={topic} onChange={event => setTopic(event.target.value)} className="mt-2 min-h-24" placeholder="Optional: describe the question, offer, or topic you want to talk about." /></section>
        <section><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">WHAT DO YOU WANT TO MAKE?</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{formats.map(option => <button key={option.value} onClick={() => { setFormat(option.value); if (option.value !== "promo" && objective !== "Feature a product") setProductId(undefined); }} className={cn("rounded-2xl border p-3 text-left transition", format === option.value ? "border-[#263327] bg-[#edf4e9] shadow-sm" : "border-[#dde5d8] bg-white hover:border-[#aebfa5]")}><p className="text-sm font-semibold text-[#263327]">{objective === "Feature a product" && option.value === "carousel" ? "Product explainer carousel" : option.label}</p><p className="mt-1 text-xs leading-5 text-[#6e796c]">{objective === "Feature a product" && option.value === "carousel" ? "Optional: teach something useful about this saved product." : option.description}</p></button>)}</div>
          {isProductLed && <div className="mt-5 rounded-2xl border border-[#d8e6d1] bg-[#f6faf2] p-4"><Label>Which product is this about?</Label>{products.data?.length ? <ProductPicker products={products.data} value={productId} onChange={setProductId} /> : <div className="mt-2"><p className="text-sm leading-6 text-[#5f6f5c]">Add a product first so ViraSquare can use facts you have confirmed, not guess.</p><Button onClick={onNeedProduct} variant="outline" className="mt-3 rounded-xl">Add your first product</Button></div>}<p className="mt-2 text-xs leading-5 text-[#738071]">ViraSquare will use only the details saved for this product.</p></div>}
          <Button disabled={suggest.isPending} onClick={showIdeas} className="mt-5 w-full rounded-xl bg-[#263327] hover:bg-[#3b4b3b]">{suggest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Show me content ideas</Button>
        </section>
      </div>
      {ideas.length > 0 && <section className="mt-7"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">CHOOSE A DIRECTION</p><h3 className="mt-1 font-serif text-2xl text-[#263327]">Which one feels right today?</h3><div className="mt-4 grid gap-3 md:grid-cols-2">{ideas.map((idea, index) => <article key={`${idea.title}-${index}`} className="flex flex-col rounded-2xl border border-[#e1e8dc] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#75965f]">{idea.objective} · {idea.format}</p><h4 className="mt-3 font-serif text-xl leading-tight text-[#263327]">{idea.title}</h4><p className="mt-3 flex-1 text-sm leading-6 text-[#6a7568]">{idea.brief}</p><Button disabled={useIdea.isPending} onClick={() => useIdea.mutate({ date, title: idea.title, objective: idea.objective, format: idea.format, brief: idea.brief, productId: isProductLed ? productId : undefined })} variant="outline" className="mt-5 w-full rounded-xl">Choose this idea <ChevronRight className="ml-1 h-4 w-4" /></Button></article>)}</div></section>}
    </div>}
  </section>;
}

function ContentDetail({ item, close }: { item: Item; close: () => void }) {
  const utils = trpc.useUtils();
  const [content, setContent] = useState(item);
  const linkedProduct = trpc.virasquare.product.useQuery({ productId: content.productId || 0 }, { enabled: Boolean(content.productId) });
  const availableProducts = trpc.virasquare.products.useQuery(undefined, { enabled: Boolean(content.requiresProduct && !content.productId) });
  useEffect(() => setContent(item), [item]);
  const generate = trpc.virasquare.generateContent.useMutation({ onSuccess: result => { setContent(result as Item); utils.virasquare.workspace.invalidate(); utils.virasquare.library.invalidate(); toast.success("Your rich content is ready."); }, onError: error => toast.error(error.message) });
  const lifecycle = trpc.virasquare.setLifecycle.useMutation({ onSuccess: result => { setContent(result as Item); utils.virasquare.workspace.invalidate(); utils.virasquare.library.invalidate(); toast.success(result.feedbackOutcome === "saved_for_later" ? "Saved to Drafts. Your post and its saved work are in Library." : "Content status updated."); }, onError: error => toast.error(error.message) });
  const attachProduct = trpc.virasquare.attachProductToContent.useMutation({ onSuccess: result => { setContent(result as Item); utils.virasquare.workspace.invalidate(); utils.virasquare.library.invalidate(); toast.success("Your saved product is attached. You can now create the product post."); }, onError: error => toast.error(error.message) });

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#172017]/35 backdrop-blur-sm sm:items-center sm:p-6"><div role="dialog" aria-modal="true" aria-label="Content options" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] bg-[#fffefa] shadow-2xl sm:rounded-[2rem]"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e8ece5] bg-[#fffefa]/95 px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">{content.entryType === "product_education" ? "SEPARATE PRODUCT EDUCATION" : content.format} · {content.feedbackOutcome === "saved_for_later" ? "SAVED DRAFT" : content.lifecycleStatus}</p><h2 className="mt-1 font-serif text-2xl text-[#263327]">{content.entryType === "product_education" ? "Your educational carousel" : "Your selected post"}</h2></div><button onClick={close} className="grid h-9 w-9 place-items-center rounded-full bg-[#f0f4ed]" aria-label="Close content options"><X className="h-4 w-4" /></button></header><div className="p-5 pb-8"><h3 className="font-serif text-3xl leading-tight text-[#263327]">{content.title}</h3><p className="mt-3 leading-6 text-[#667165]">{content.brief}</p>
    {linkedProduct.data && <div className="mt-5 flex gap-3 rounded-2xl border border-[#dce8d5] bg-[#f6faf2] p-3"><img src={linkedProduct.data.imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover"/><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#5d8054]">SELECTED PRODUCT</p><p className="mt-1 text-sm font-semibold text-[#334b32]">{linkedProduct.data.name}</p><p className="mt-1 text-xs leading-5 text-[#667565]">ViraSquare will use its saved facts only.</p></div></div>}
    {content.requiresProduct && !content.productId && <div className="mt-5 rounded-2xl border border-[#cfe0c7] bg-[#f1f8ed] p-4"><p className="text-sm font-semibold leading-6 text-[#496643]">Choose the real product for this selling post.</p><p className="mt-1 text-xs leading-5 text-[#647863]">{content.preparationNote || "ViraSquare will use its saved image and facts only after you choose one."}</p>{availableProducts.data?.length ? <div className="mt-3"><ProductPicker products={availableProducts.data} onChange={productId => { if (productId) attachProduct.mutate({ itemId: content.id, productId }); }} disabled={attachProduct.isPending} placeholder="Choose the product for this post" /></div> : <p className="mt-3 text-xs font-semibold text-[#647863]">Add a product in My Products first, then return here.</p>}</div>}
    {!content.caption && content.lifecycleStatus !== "posted" && <section className="mt-7 rounded-2xl border border-dashed border-[#c9d9c1] bg-[#f6faf2] p-5"><Sparkles className="h-6 w-6 text-[#719761]"/><h4 className="mt-3 font-serif text-2xl text-[#263327]">What do you want to do with this idea?</h4><p className="mt-2 text-sm leading-6 text-[#748073]">Make the rich writing and card plan, or simply mark it as a post you used outside ViraSquare.</p><div className="mt-5 flex flex-col gap-2 sm:flex-row"><Button disabled={generate.isPending || (content.requiresProduct && !content.productId)} onClick={() => generate.mutate({ itemId: content.id })} className="rounded-xl bg-[#263327] hover:bg-[#3b4b3b]">{generate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{content.requiresProduct ? "Create product post" : "Make rich cards"}</Button><Button disabled={lifecycle.isPending} onClick={() => lifecycle.mutate({ itemId: content.id, lifecycleStatus: "posted" })} variant="outline" className="rounded-xl"><CheckCircle2 className="mr-2 h-4 w-4"/>Mark as posted</Button></div></section>}
    {!content.caption && content.lifecycleStatus === "posted" && <section className="mt-7 rounded-2xl border border-[#cfe0c7] bg-[#f1f8ed] p-5"><CheckCircle2 className="h-6 w-6 text-[#547a48]"/><h4 className="mt-3 font-serif text-2xl text-[#263327]">Marked as posted</h4><p className="mt-2 text-sm leading-6 text-[#667165]">ViraSquare has recorded this as a post you chose to use. You can return to it from Library whenever you need it.</p></section>}
    {content.caption && <><section className="mt-7 rounded-2xl border border-[#e4e9e0] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">CAPTION</p><p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-[#39453a]">{content.caption}</p></section>{content.format === "carousel" && content.carouselSlides.length > 0 && <section className="mt-5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">RICH CARD SET</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{content.carouselSlides.map((slide, index) => <article key={`${slide.heading}-${index}`} className="min-h-44 rounded-2xl bg-[#263327] p-4 text-[#f7f9ee]"><p className="text-[10px] font-bold uppercase tracking-wider text-[#c9dfb4]">{slide.cardType || "guide"} · {slide.eyebrow || `Card ${index + 1}`}</p><h4 className="mt-4 font-serif text-xl leading-tight">{slide.heading}</h4><p className="mt-3 text-xs leading-5 text-[#d5e0ce]">{slide.body}</p><p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#eaf2ca]">{slide.footer}</p></article>)}</div></section>}<VisualMaker item={content} onOpenProductEducation={nextItem => setContent(nextItem as Item)}/><section className="mt-6 rounded-2xl border border-[#e2e8de] bg-[#fbfcf8] p-4"><p className="text-sm font-semibold text-[#405142]">What happened after you posted?</p><p className="mt-1 text-xs leading-5 text-[#738072]">This is your own feedback, not assumed social data, and helps ViraSquare learn what you return to.</p><div className="mt-3 flex flex-wrap gap-2">{content.lifecycleStatus !== "posted" && content.lifecycleStatus !== "archived" && <Button onClick={() => lifecycle.mutate({ itemId: content.id, lifecycleStatus: "reviewed", outcome: "saved_for_later" })} disabled={lifecycle.isPending || content.feedbackOutcome === "saved_for_later"} variant="outline" className="rounded-xl border-[#9cbd8c] bg-white text-[#41653a] hover:bg-[#edf5e8]"><Library className="mr-2 h-4 w-4"/>{content.feedbackOutcome === "saved_for_later" ? "Saved to Drafts" : "Save to Drafts"}</Button>}<Button onClick={() => lifecycle.mutate({ itemId: content.id, lifecycleStatus: "posted" })} className="rounded-xl bg-[#263327] hover:bg-[#3b4b3b]"><CheckCircle2 className="mr-2 h-4 w-4"/>Mark as posted</Button><Button onClick={() => lifecycle.mutate({ itemId: content.id, lifecycleStatus: "posted", outcome: "conversations" })} variant="outline" className="rounded-xl">Started conversations</Button><Button onClick={() => lifecycle.mutate({ itemId: content.id, lifecycleStatus: "posted", outcome: "orders" })} variant="outline" className="rounded-xl">Helped an order</Button><Button onClick={() => lifecycle.mutate({ itemId: content.id, lifecycleStatus: "posted", outcome: "engagement" })} variant="outline" className="rounded-xl">Useful engagement</Button><Button onClick={() => lifecycle.mutate({ itemId: content.id, lifecycleStatus: "archived" })} variant="ghost" className="rounded-xl text-[#8b514a]"><Archive className="mr-2 h-4 w-4"/>Archive</Button></div></section></>}
  </div></div></div>;
}

function ProductFlyerPreview({ product }: { product: any }) {
  const [open, setOpen] = useState(false);
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button type="button" size="sm" variant="outline" className="h-8 rounded-lg border-[#d5e1d0] bg-white px-2.5 text-xs text-[#587052] hover:bg-[#f3f8ef]"><Eye className="mr-1.5 h-3.5 w-3.5"/>Preview</Button></PopoverTrigger><PopoverContent align="start" className="w-64 rounded-2xl border-[#d5e1d0] bg-[#fffefa] p-3 shadow-xl"><div className="overflow-hidden rounded-xl border border-[#e1e8dc] bg-[#263327]"><div className="grid aspect-[4/3] place-items-center bg-[#eff5ea] p-3"><img src={product.imageUrl} alt="" className="h-full w-full object-contain"/></div><div className="px-3 py-3 text-[#f6faed]"><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#cfe1c3]">EXAMPLE FLYER</p><p className="mt-1 font-serif text-lg leading-tight">{product.name}</p></div><button type="button" onClick={() => setOpen(false)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/20 text-[#f6faed] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eaf2ca]" aria-label="Close flyer preview"><X className="h-3.5 w-3.5"/></button></div><p className="mt-1 text-xs text-[#d7e4d1]">{product.price ? `₦${product.price}` : "Ask for price"}</p></div></div><p className="mt-2 text-xs leading-5 text-[#687568]">Static preview only. A real flyer is created only after you choose to make one.</p></PopoverContent></Popover>;
}

function ProductCatalogue({ products, usage, onEdit, onRemove, onStartProductPost }: { products: any[] | undefined; usage: Array<{ productId: number; visualCount: number; postedCount: number }> | undefined; onEdit: (product: any) => void; onRemove: (productId: number) => void; onStartProductPost: (product: any) => void }) {
  return <>
    <div className="mt-6 space-y-2 sm:hidden">{products?.map(product => {
      const insight = usage?.find(entry => entry.productId === product.id);
      return <article key={product.id} className="rounded-2xl border border-[#e1e8dc] bg-white p-3 shadow-sm"><div className="flex items-center gap-3"><button onClick={() => onEdit(product)} className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#89aa7b]"><div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#e3eadf] bg-[#f5f8f2]"><img src={product.imageUrl} alt="" className="h-full w-full object-contain"/></div><div className="min-w-0 flex-1"><p className="line-clamp-2 font-serif text-lg leading-tight text-[#263327]">{product.name}</p><p className="mt-1 text-sm font-semibold text-[#61745f]">{product.price ? `₦${product.price}` : "Price on request"}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#71836c]">{insight?.visualCount || 0} visuals · {insight?.postedCount || 0} posted</p></div><ChevronRight className="h-4 w-4 shrink-0 text-[#789176]"/></button><Button onClick={() => onRemove(product.id)} size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-[#a25f55]" aria-label={`Remove ${product.name}`}><Trash2 className="h-4 w-4"/></Button></div><div className="mt-3 flex items-center gap-2 border-t border-[#edf2ea] pt-2"><Button type="button" size="sm" onClick={() => onStartProductPost(product)} className="h-8 rounded-lg bg-[#263327] px-2.5 text-xs hover:bg-[#3b4b3b] motion-safe:animate-[pulse_2.8s_ease-in-out_2]">Make product post</Button><ProductFlyerPreview product={product}/></div></article>;
    })}</div>
    <div className="mt-6 hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-3">{products?.map(product => {
      const insight = usage?.find(entry => entry.productId === product.id);
      return <article key={product.id} className="flex min-h-36 gap-3 rounded-2xl border border-[#e1e8dc] bg-white p-3 shadow-sm"><button type="button" onClick={() => onEdit(product)} className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#e3eadf] bg-[#f5f8f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#89aa7b]"><img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain"/></button><div className="flex min-w-0 flex-1 flex-col"><div className="flex items-start justify-between gap-2"><button type="button" onClick={() => onEdit(product)} className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#89aa7b]"><h2 className="line-clamp-2 font-serif text-lg leading-tight text-[#263327]">{product.name}</h2><p className="mt-1 text-sm font-semibold text-[#61745f]">{product.price ? `₦${product.price}` : "Price on request"}</p></button><Button onClick={() => onRemove(product.id)} size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-[#a25f55]" aria-label={`Remove ${product.name}`}><Trash2 className="h-4 w-4"/></Button></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-[#738072]">{product.details || "Add product facts to strengthen future product content."}</p><div className="mt-auto flex flex-wrap items-center gap-2 pt-2"><Button type="button" size="sm" onClick={() => onStartProductPost(product)} className="h-8 rounded-lg bg-[#263327] px-2.5 text-xs hover:bg-[#3b4b3b] motion-safe:animate-[pulse_2.8s_ease-in-out_2]">Make product post</Button><ProductFlyerPreview product={product}/><span className="text-[10px] font-bold uppercase tracking-wide text-[#71836c]">{insight?.visualCount || 0} visuals · {insight?.postedCount || 0} posted</span></div></div></article>;
    })}</div>
  </>;
}

function ProductManager() {
  const utils = trpc.useUtils();
  const products = trpc.virasquare.products.useQuery();
  const usage = trpc.virasquare.productUsage.useQuery();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [productPostStarter, setProductPostStarter] = useState<any>(null);
  const [startedProductItem, setStartedProductItem] = useState<Item | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("fashion");
  const [price, setPrice] = useState("");
  const [askPrice, setAskPrice] = useState(true);
  const [details, setDetails] = useState("");
  const [bestFor, setBestFor] = useState("");
  const [choiceReasons, setChoiceReasons] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const reset = () => { setOpen(false); setEditing(null); setName(""); setCategory("fashion"); setPrice(""); setAskPrice(true); setDetails(""); setBestFor(""); setChoiceReasons(""); setFile(null); };
  const invalidateProducts = () => { utils.virasquare.products.invalidate(); utils.virasquare.productUsage.invalidate(); utils.virasquare.workspace.invalidate(); };
  const create = trpc.virasquare.createProduct.useMutation({ onSuccess: () => { reset(); invalidateProducts(); toast.success("Product saved to My Products."); }, onError: error => toast.error(error.message) });
  const update = trpc.virasquare.updateProduct.useMutation({ onSuccess: () => { reset(); invalidateProducts(); toast.success("Product details updated."); }, onError: error => toast.error(error.message) });
  const remove = trpc.virasquare.deleteProduct.useMutation({ onSuccess: () => { invalidateProducts(); toast.success("Product removed."); }, onError: error => toast.error(error.message) });
  const startEdit = (product: any) => { setEditing(product); setOpen(true); setName(product.name || ""); setCategory(product.productCategory || "other"); setPrice(product.price || ""); setAskPrice(!product.price); setDetails(product.details || ""); setBestFor(product.bestFor || ""); setChoiceReasons(product.choiceReasons || ""); setFile(null); };
  const save = async () => {
    if (name.trim().length < 2) return toast.error("Add a product name first.");
    const values = { name: name.trim(), price: askPrice ? "" : price.trim(), details: details.trim() || undefined, productCategory: category, bestFor: bestFor.trim() || undefined, choiceReasons: choiceReasons.trim() || undefined };
    if (editing) { update.mutate({ productId: editing.id, ...values }); return; }
    if (!file) return toast.error("Add one real product image first.");
    try { create.mutate({ ...values, image: { dataUrl: await readFile(file), fileName: file.name } }); } catch { toast.error("The image could not be read."); }
  };
  const pending = create.isPending || update.isPending;

  return <section><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">YOUR CATALOGUE</p><h1 className="mt-1 font-serif text-3xl text-[#263327]">My Products</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#6c776b]">Keep real product information ready for the content that actually needs it.</p></div><Button type="button" onClick={() => open ? reset() : setOpen(true)} aria-expanded={open} className={cn("rounded-xl", open ? "border border-[#b9cdb0] bg-white text-[#476543] hover:bg-[#f2f7ee]" : "bg-[#263327] hover:bg-[#3b4b3b]")}>{open ? <><X className="mr-2 h-4 w-4"/>Close form</> : <><Plus className="mr-2 h-4 w-4"/>Add product</>}</Button></div>
    {!products.data?.length && !open && <div className="mt-5 rounded-2xl border border-dashed border-[#cbd9c4] bg-[#fbfcf8] p-6"><Package className="h-6 w-6 text-[#719761]"/><h2 className="mt-3 font-serif text-2xl text-[#263327]">Add your first product when you are ready.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#6f7b6f]">You never need a product for educational content. For a product-led post, ViraSquare needs a real image and the facts you are sure of.</p><Button onClick={() => setOpen(true)} className="mt-4 rounded-xl bg-[#263327] hover:bg-[#3b4b3b]">Add a product</Button></div>}
    {open && <section className="mt-5 rounded-2xl border border-[#dce8d5] bg-[#f8fbf5] p-4 sm:p-5"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">{editing ? "UPDATE PRODUCT" : "QUICK PRODUCT ADD"}</p><h2 className="mt-2 font-serif text-2xl text-[#263327]">{editing ? `Update ${editing.name}` : "Start with the essentials."}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#697568]">{editing ? "Keep the facts accurate as your product changes." : "Add a name, category, price or ask-for-price, and one real image. The extra questions are optional, but strongly recommended for stronger product content."}</p></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label>Product name</Label><Input value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Everyday gold hoop earrings"/></div><div className="grid gap-2"><Label>Category</Label><select value={category} onChange={event => setCategory(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="fashion">Fashion</option><option value="accessories">Accessories</option><option value="beauty">Beauty</option><option value="personal_care">Personal care</option><option value="other">Other</option></select></div><div className="grid gap-2"><Label>Price</Label><Input disabled={askPrice} value={price} onChange={event => setPrice(event.target.value)} placeholder="e.g. 18,500"/><label className="flex items-center gap-2 text-xs text-[#687568]"><input type="checkbox" checked={askPrice} onChange={event => setAskPrice(event.target.checked)}/> Ask for price instead</label></div>{!editing && <div className="grid gap-2"><Label>Real product image</Label><label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#b9cdb0] bg-white px-3 text-sm text-[#5d7558]"><Upload className="h-4 w-4"/><span className="truncate">{file ? file.name : "Choose PNG, JPEG, or WebP"}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={event => setFile(event.target.files?.[0] ?? null)}/></label></div>}<div className="grid gap-2 sm:col-span-2"><Label>Help us understand this product</Label><p className="-mt-1 text-xs leading-5 text-[#718071]">Share facts you are sure of. ViraSquare will use them to make product content accurate and useful.</p><Textarea value={details} onChange={event => setDetails(event.target.value)} placeholder="For example: gold-plated, lightweight, available in two sizes, or made after order confirmation." className="min-h-24 resize-none"/></div></div>
      <section className="mt-5 overflow-hidden rounded-2xl border border-[#cbdcc4] bg-white"><div className="border-b border-[#dce8d6] bg-[#eef6e9] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#557445]">OPTIONAL, STRONGLY RECOMMENDED</p><h3 className="mt-1 font-serif text-xl text-[#263327]">Two answers that make product content much stronger.</h3><p className="mt-1 text-xs leading-5 text-[#637261]">They are not required to save a product. Add them when you can so ViraSquare understands the product beyond its basic facts.</p></div><div className="grid gap-4 p-4 lg:grid-cols-2"><div className="rounded-xl border border-[#dde9d7] bg-[#fbfdf9] p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#5b7f50]">WHO IT HELPS</p><Label className="mt-2 block text-[15px]">Who is this for, or when would they use it?</Label><Textarea value={bestFor} onChange={event => setBestFor(event.target.value)} placeholder="For example: people who want a simple everyday option, or a gift for a birthday." className="mt-3 min-h-24 resize-none bg-white"/></div><div className="rounded-xl border border-[#e8dfbf] bg-[#fffdf4] p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#877037]">WHY CHOOSE IT</p><Label className="mt-2 block text-[15px]">What makes this worth choosing?</Label><Textarea value={choiceReasons} onChange={event => setChoiceReasons(event.target.value)} placeholder="Share only reasons you can stand behind, such as a material, process, convenience, or finish." className="mt-3 min-h-24 resize-none bg-white"/></div></div></section>
      <div className="mt-6 flex flex-wrap gap-2"><Button onClick={save} disabled={pending} className="rounded-xl bg-[#263327] hover:bg-[#3b4b3b]">{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{editing ? "Save product details" : "Save product"}</Button><Button variant="outline" onClick={reset} className="rounded-xl">Cancel</Button></div>
      {editing && <aside className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#d6e4ce] bg-[#f3f8ef] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#557447]">PRODUCT POST SUGGESTION</p><p className="mt-1 text-sm leading-5 text-[#445b43]">Ready to turn {editing.name} into a flyer, matching caption, and selling package?</p></div><div className="flex flex-wrap gap-2"><ProductFlyerPreview product={editing}/><Button type="button" onClick={() => setProductPostStarter({ ...editing, key: Date.now() })} variant="outline" className="shrink-0 rounded-xl border-[#9cbd8c] bg-white text-[#41653a] hover:bg-[#edf5e8] motion-safe:animate-[pulse_2.8s_ease-in-out_2]">Start product post<ChevronRight className="ml-1 h-4 w-4" /></Button></div></aside>}
    </section>}
    <ProductCatalogue products={products.data} usage={usage.data} onEdit={startEdit} onRemove={productId => remove.mutate({ productId })} onStartProductPost={product => setProductPostStarter({ ...product, key: Date.now() })}/>
    {productPostStarter && <section className="mt-6 rounded-2xl border border-[#d8e6d1] bg-[#f8fbf5] p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">PRODUCT POST</p><h2 className="mt-1 font-serif text-2xl text-[#263327]">Choose a direction for {productPostStarter.name}</h2><p className="mt-2 text-sm leading-6 text-[#687568]">Nothing is generated yet. Pick the content direction first, then ViraSquare will use this saved product in the existing post flow.</p><AlternativeIdeaGenerator date={iso()} onSelected={item => setStartedProductItem(item)} onNeedProduct={() => undefined} productStarter={{ productId: productPostStarter.id, key: productPostStarter.key }} /></section>}
    {startedProductItem && <ContentDetail item={startedProductItem} close={() => setStartedProductItem(null)} />}
  </section>;
}

function BrandSettings({ profile, onEditProfile }: { profile: any; onEditProfile: () => void }) {
  const utils = trpc.useUtils();
  const [primary, setPrimary] = useState(profile.brandPrimaryColor || "#263327");
  const [accent, setAccent] = useState(profile.brandAccentColor || "#EAF2CA");
  const [cta, setCta] = useState(profile.defaultCta || "Send us a message to order.");
  const [handle, setHandle] = useState(profile.instagramHandle || "");
  const [signature, setSignature] = useState(profile.closingSignature || "");
  const [logo, setLogo] = useState<File | null>(null);
  const [context, setContext] = useState<BusinessContext>(() => emptyBusinessContext(profile.businessContext));
  useEffect(() => { setPrimary(profile.brandPrimaryColor || "#263327"); setAccent(profile.brandAccentColor || "#EAF2CA"); setCta(profile.defaultCta || "Send us a message to order."); setHandle(profile.instagramHandle || ""); setSignature(profile.closingSignature || ""); setContext(emptyBusinessContext(profile.businessContext)); }, [profile]);
  const saveStyle = trpc.virasquare.saveProfile.useMutation({ onSuccess: () => { utils.virasquare.profile.invalidate(); utils.virasquare.workspace.invalidate(); toast.success("Your card style is saved."); }, onError: error => toast.error(error.message) });
  const saveIdentity = trpc.virasquare.saveBrandIdentity.useMutation({ onSuccess: () => { setLogo(null); utils.virasquare.profile.invalidate(); utils.virasquare.workspace.invalidate(); toast.success("Your card identity is saved."); }, onError: error => toast.error(error.message) });
  const saveContext = trpc.virasquare.saveBusinessContext.useMutation({ onSuccess: () => { utils.virasquare.profile.invalidate(); utils.virasquare.workspace.invalidate(); toast.success("Your business context is saved."); }, onError: error => toast.error(error.message) });
  const submitStyle = () => saveStyle.mutate({ businessName: profile.businessName, businessType: profile.businessType, businessCategory: profile.businessCategory, targetAudience: profile.targetAudience, customerMarket: profile.customerMarket || "Nigeria", contentPillars: profile.contentPillars, postingGoal: profile.postingGoal, weeklyPostGoal: profile.weeklyPostGoal, brandVoice: profile.brandVoice, brandPrimaryColor: primary, brandAccentColor: accent, defaultCta: cta });
  const submitIdentity = async () => { try { saveIdentity.mutate({ instagramHandle: handle.trim() || undefined, closingSignature: signature.trim() || undefined, logo: logo ? { dataUrl: await readFile(logo), fileName: logo.name } : undefined }); } catch { toast.error("The logo could not be read."); } };

  return <section className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">YOUR FOUNDATION</p><h1 className="mt-1 font-serif text-3xl text-[#263327]">Brand</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c776b]">Keep the information that helps ViraSquare sound recognisably like your business and make cards feel yours.</p>
    <section className="mt-6 rounded-2xl border border-[#e2e8de] bg-[#fffefa] p-5"><div className="flex items-center gap-3">{profile.brandLogoUrl ? <img src={profile.brandLogoUrl} alt="Your brand logo" className="h-12 w-12 rounded-xl border border-[#e1e8dc] object-contain"/> : <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#263327] font-serif text-xl text-[#eaf2ca]">{profile.businessName.slice(0, 1).toUpperCase()}</div>}<div><p className="font-serif text-2xl text-[#263327]">{profile.businessName}</p><p className="mt-1 text-sm text-[#6c776b]">{profile.brandVoice}</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label>Primary card colour</Label><div className="flex items-center gap-2"><Input type="color" value={primary} onChange={event => setPrimary(event.target.value)} className="h-10 w-14 p-1"/><Input value={primary} onChange={event => setPrimary(event.target.value)}/></div></div><div className="grid gap-2"><Label>Accent colour</Label><div className="flex items-center gap-2"><Input type="color" value={accent} onChange={event => setAccent(event.target.value)} className="h-10 w-14 p-1"/><Input value={accent} onChange={event => setAccent(event.target.value)}/></div></div><div className="grid gap-2 sm:col-span-2"><Label>Default call to action</Label><Input value={cta} onChange={event => setCta(event.target.value)} placeholder="e.g. Send us a message to order."/></div></div><div className="mt-6 flex flex-wrap gap-2"><Button onClick={submitStyle} disabled={saveStyle.isPending} className="rounded-xl bg-[#263327] hover:bg-[#3b4b3b]">{saveStyle.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save card style</Button><Button onClick={onEditProfile} variant="outline" className="rounded-xl">Edit business profile</Button></div></section>
    <section className="mt-5 rounded-2xl border border-[#e2e8de] bg-[#fffefa] p-5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">CARD IDENTITY</p><h2 className="mt-2 font-serif text-2xl text-[#263327]">Make your cards recognisably yours.</h2><p className="mt-2 text-sm leading-6 text-[#6c776b]">A logo and Instagram handle are optional, but strongly recommended. Cards use your logo with your brand name at the top, then show your Instagram handle clearly in the footer.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="grid gap-2 sm:col-span-2"><Label>Brand logo <span className="font-normal text-[#879187]">(optional, strongly recommended)</span></Label><label className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#b9cdb0] bg-[#f8fbf6] px-3 text-sm text-[#5d7558]"><Upload className="h-4 w-4"/><span className="truncate">{logo ? logo.name : profile.brandLogoUrl ? "Choose a new logo to replace the current one" : "Choose PNG, JPEG, or WebP"}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={event => setLogo(event.target.files?.[0] ?? null)}/></label></div><div className="grid gap-2"><Label>Instagram username <span className="font-normal text-[#879187]">(optional, strongly recommended)</span></Label><div className="relative"><Instagram className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#75965f]"/><Input value={handle} onChange={event => setHandle(event.target.value.replace(/^@+/, ""))} className="pl-9" placeholder="yourbusiness"/></div></div><div className="grid gap-2"><Label>Closing card signature <span className="font-normal text-[#879187]">(optional)</span></Label><Input value={signature} onChange={event => setSignature(event.target.value)} placeholder="A line used only on closing cards"/></div></div><p className="mt-3 text-xs leading-5 text-[#738071]">Your signature is a short line ViraSquare can use only on closing cards to make content feel more like yours.</p><Button onClick={submitIdentity} disabled={saveIdentity.isPending} className="mt-5 rounded-xl bg-[#263327] hover:bg-[#3b4b3b]">{saveIdentity.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save card identity</Button></section>
    <section className="mt-5 rounded-2xl border border-[#e2e8de] bg-[#fffefa] p-5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">BUSINESS CONTEXT</p><h2 className="mt-2 font-serif text-2xl text-[#263327]">Help ViraSquare understand your business.</h2><p className="mt-2 text-sm leading-6 text-[#6c776b]">These answers are optional. They help ViraSquare make useful choices and avoid claims you would not stand behind.</p><div className="mt-5"><BusinessContextFields value={context} onChange={setContext} compact/></div><Button onClick={() => saveContext.mutate(context)} disabled={saveContext.isPending} className="mt-5 rounded-xl bg-[#263327] hover:bg-[#3b4b3b]">{saveContext.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save business context</Button></section>
  </section>;
}

function CalendarPanel({ plan, dates, select, makePlan, planning, weeklyPostGoal }: { plan: Item[]; dates: string[]; select: (item: Item) => void; makePlan: () => void; planning: boolean; weeklyPostGoal: number }) {
  const ready = plan.filter(item => Boolean(item.caption)).length;
  const productPrep = plan.filter(item => item.requiresProduct).length;
  const hasActivePlan = plan.length >= Math.max(1, weeklyPostGoal);
  const emptyDay = emptyDayCopy(hasActivePlan);
  const today = iso();
  const todayRef = useRef<HTMLElement | null>(null);
  const [isTodayVisible, setIsTodayVisible] = useState(true);
  useEffect(() => {
    const currentDay = todayRef.current;
    if (!currentDay || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setIsTodayVisible(Boolean(entry?.isIntersecting)), { threshold: 0.6 });
    observer.observe(currentDay);
    return () => observer.disconnect();
  }, []);
  const jumpToToday = () => {
    todayRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    todayRef.current?.focus({ preventScroll: true });
  };
  return <section><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">YOUR CONTENT PLAN</p><h1 className="mt-1 font-serif text-3xl text-[#263327]">Calendar</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c776b]">This is the plan ViraSquare maps around your business and posting rhythm. Open a scheduled post when you are ready to use it.</p></div><Button onClick={makePlan} disabled={planning} className="rounded-xl bg-[#263327] hover:bg-[#3b4b3b]">{planning ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}{hasActivePlan ? "Refresh this week" : "Prepare my week"}</Button></div><section className="mt-5 overflow-hidden rounded-2xl border border-[#d6e2d0] bg-[#f1f6ee]"><div className="grid sm:grid-cols-3"><div className="flex items-center gap-3 border-b border-[#dbe6d6] px-4 py-4 sm:border-b-0 sm:border-r"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e0efd8] text-[#4e7745]"><CalendarDays className="h-4 w-4"/></span><div><p className="text-[10px] font-bold uppercase tracking-wide text-[#53764b]">PLANNED THIS WEEK</p><p className="mt-0.5 font-serif text-2xl text-[#334b32]">{plan.length}</p></div></div><div className="flex items-center gap-3 border-b border-[#dbe6d6] px-4 py-4 sm:border-b-0 sm:border-r"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff0d0] text-[#806531]"><CheckCircle2 className="h-4 w-4"/></span><div><p className="text-[10px] font-bold uppercase tracking-wide text-[#806531]">READY TO USE</p><p className="mt-0.5 font-serif text-2xl text-[#68552e]">{ready}</p></div></div><div className="flex items-center gap-3 px-4 py-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e8ebfb] text-[#55639a]"><Package className="h-4 w-4"/></span><div><p className="text-[10px] font-bold uppercase tracking-wide text-[#55639a]">PREP NEEDED</p><p className="mt-0.5 font-serif text-2xl text-[#394979]">{productPrep}</p></div></div></div></section><section className="mt-5 rounded-2xl border border-[#dfe8da] bg-[#edf3e9] p-3"><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-7">{dates.map(date => { const item = plan.find(value => value.plannedFor === date); const isToday = date === today; return <article key={date} ref={isToday ? todayRef : undefined} tabIndex={isToday ? -1 : undefined} className={cn("min-h-44 rounded-xl border p-3", item ? "border-[#cedec7] bg-[#fffefa] shadow-sm" : hasActivePlan ? "border-[#d5e2cf] bg-[#f8fbf6]" : "border-dashed border-[#d5e0d0] bg-white/55", isToday && "scroll-mt-24")}><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wide text-[#788676]">{readable(date, { weekday: "short" })}</p><p className="mt-0.5 font-serif text-xl text-[#263327]">{readable(date, { day: "numeric" })}</p></div>{item && <span className="rounded-full bg-[#e7f1e1] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#557447]">{item.lifecycleStatus}</span>}</div>{item ? <button onClick={() => select(item)} className="mt-4 text-left"><span className="block h-0.5 w-7 bg-[#9ab78e]"/><h2 className="mt-3 font-serif text-base leading-tight text-[#263327]">{item.title}</h2><p className="mt-2 line-clamp-3 text-xs leading-5 text-[#6d786b]">{item.brief}</p>{item.requiresProduct && <p className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#4d793d]"><Package className="h-3 w-3"/>Prepare product</p>}</button> : <div className="mt-7 flex flex-col items-start"><span className="mb-3 h-0.5 w-6 bg-[#c7d6c1]"/><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#5d8152]">{emptyDay.eyebrow}</p><p className="mt-1 text-xs font-semibold leading-5 text-[#40513f]">{emptyDay.title}</p>{hasActivePlan && <p className="mt-1 text-[11px] leading-4 text-[#748071]">{emptyDay.detail}</p>}</div>}</article>; })}</div></section>{shouldShowJumpToToday(isTodayVisible) && <Button type="button" onClick={jumpToToday} className="fixed bottom-20 right-4 z-30 rounded-full bg-[#263327] px-4 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#3b4b3b] active:translate-y-0 active:scale-[.98] lg:bottom-6"><CalendarDays className="mr-2 h-4 w-4"/>Jump to today</Button>}<div className="mt-4 border-l-2 border-[#b7cfab] pl-3 text-sm leading-6 text-[#6c776b]"><strong className="text-[#334b32]">A simple rule:</strong> Calendar shows ViraSquare’s plan. If you need a different idea for today, choose it from Today rather than building a post from the calendar.</div></section>;
}

function DailyBriefPanel({ current, plan, dates, weeklyPostGoal, onOpenItem, onPrepareWeek, onViewWeek, onNeedProduct }: { current: Item | null; plan: Item[]; dates: string[]; weeklyPostGoal: number; onOpenItem: (item: Item) => void; onPrepareWeek: () => void; onViewWeek: () => void; onNeedProduct: () => void }) {
  const hasActivePlan = plan.length >= Math.max(1, weeklyPostGoal);
  const completedCount = plan.filter(item => item.status === "completed").length;
  const momentum = getWeeklyMomentum({ hasActivePlan, completedCount, weeklyGoal: weeklyPostGoal });
  const todayMove = getDailyBriefState({ hasActivePlan, current });
  const today = iso();
  const visibleOnMobile = mobileWeeklyDates(dates, today);
  const [showMomentum, setShowMomentum] = useState(false);
  useEffect(() => {
    setShowMomentum(false);
    const frame = requestAnimationFrame(() => setShowMomentum(true));
    return () => cancelAnimationFrame(frame);
  }, [momentum.percentage]);
  const runPrimaryAction = () => {
    if (todayMove.action === "prepare_week") onPrepareWeek();
    else if (todayMove.action === "view_week") onViewWeek();
    else if (current) onOpenItem(current);
  };

  return <section className="space-y-5"><section className="overflow-hidden rounded-[1.5rem] border border-[#d4e3cc] bg-[#fffefa] shadow-sm"><div className="bg-[#263327] p-5 text-[#f7faed] sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#cce1b8]">DAILY BRIEF · {readable(today, { weekday: "long", month: "long", day: "numeric" })}</p><h1 className="mt-3 max-w-3xl font-serif text-3xl leading-[1.02] sm:text-4xl">{todayMove.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#d6e0d1]">{todayMove.detail}</p></div><Button type="button" onClick={runPrimaryAction} className="group w-full rounded-xl bg-[#eaf2ca] text-[#263327] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f6fadf] hover:shadow-lg active:translate-y-0 active:scale-[.98] focus-visible:ring-2 focus-visible:ring-[#f4f8cf] focus-visible:ring-offset-2 focus-visible:ring-offset-[#263327] sm:w-auto">{todayMove.action === "prepare_product" && <Package className="mr-2 h-4 w-4" />}{todayMove.action === "prepare_week" && <Sparkles className="mr-2 h-4 w-4" />}{todayMove.action === "open_ready" && <CheckCircle2 className="mr-2 h-4 w-4" />}{todayMove.action === "create_today" && <Target className="mr-2 h-4 w-4" />}{todayMove.action === "view_week" && <CalendarDays className="mr-2 h-4 w-4" />}{todayMove.actionLabel}<ChevronRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" /></Button></div></div><div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(290px,.8fr)] lg:items-center"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">WEEKLY MOMENTUM</p><h2 className="mt-1 font-serif text-2xl leading-tight text-[#263327]">{momentum.title}</h2><p className="mt-2 text-sm leading-6 text-[#697669]">{momentum.detail}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e7eee2]"><div className="h-full rounded-full bg-[#6f9560] transition-[width] duration-700 ease-out motion-reduce:transition-none" style={{ width: `${showMomentum ? momentum.percentage : 0}%` }} /></div><p className="mt-2 text-xs font-semibold text-[#587052]">{hasActivePlan ? `${momentum.completedCount} of ${momentum.goal} planned posts completed` : "A focused plan gives your week a clear rhythm."}</p></div><div className="rounded-2xl border border-[#dbe8d5] bg-[#f5faf1] p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#5d8152]">CHOOSE YOUR PATH</p><p className="mt-2 text-sm leading-6 text-[#405142]">Follow today’s move, or create something different if your business needs another direction.</p><Button type="button" variant="outline" onClick={() => document.getElementById("alternative-ideas")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="mt-4 w-full rounded-xl border-[#b8cdaa] bg-white text-[#45663d] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#edf5e8] hover:shadow-sm active:translate-y-0 active:scale-[.98]">Make something different<ChevronRight className="ml-1 h-4 w-4" /></Button></div></div></section><section><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">THIS WEEK AT A GLANCE</p><h2 className="mt-1 font-serif text-2xl text-[#263327]">Your planned rhythm</h2></div><button onClick={onViewWeek} className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-[#527542] transition-colors hover:bg-[#eef5e9] hover:text-[#365d31] focus-visible:ring-2 focus-visible:ring-[#89aa7b]">View calendar <ChevronRight className="inline h-4 w-4" /></button></div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">{dates.map(date => { const item = plan.find(value => value.plannedFor === date); const dateState = getWeeklyDateState(date, today); const isToday = dateState === "today"; const visibleOnPhone = visibleOnMobile.includes(date); const emptyDayDetail = dateState === "past" ? "This day was left clear." : dateState === "future" ? "No post planned." : "No post needed today."; return <article key={date} className={cn("relative min-h-32 rounded-xl border p-3 transition-[transform,box-shadow,border-color,background-color,opacity] duration-200", !visibleOnPhone && "hidden sm:block", item ? "border-[#e2e8de] bg-[#fffefa]" : hasActivePlan ? "border-[#d4e3cc] bg-[#f4f8f1]" : "border-dashed border-[#dce5d8] bg-[#fbfcf9]", dateState === "past" && "opacity-65 saturate-50", dateState === "future" && "bg-[#fbfcf9]", isToday && "border-[#6f9560] bg-[#f1f8ed] shadow-[0_10px_24px_rgba(68,100,59,0.14)] ring-1 ring-[#d9e9d0] lg:-translate-y-1")}><div className="flex items-center justify-between gap-2"><p className={cn("text-[10px] font-bold uppercase tracking-wider text-[#788676]", isToday && "text-[#45663d]")}>{isToday ? `Today · ${readable(date, { weekday: "short" })}` : readable(date, { weekday: "short" })}</p>{item && <span className={cn("rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide", dateState === "past" ? "bg-[#f1f3ef] text-[#82907e]" : "bg-[#eef5e9] text-[#5b814d]")}>{item.lifecycleStatus}</span>}</div><p className="mt-1 font-serif text-lg">{readable(date, { day: "numeric" })}</p>{item ? <button onClick={() => onOpenItem(item)} className="mt-3 w-full rounded-lg text-left transition-colors hover:bg-[#eef5e9] focus-visible:ring-2 focus-visible:ring-[#89aa7b]"><p className="line-clamp-3 text-xs font-medium leading-5 text-[#475347]">{item.title}</p><p className={cn("mt-2 text-[10px] font-bold uppercase", dateState === "past" ? "text-[#879484]" : "text-[#75965f]")}>{item.requiresProduct ? "Prepare product" : "Open post"}</p></button> : <div className="mt-3"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#5d8152]">{hasActivePlan ? "REST DAY" : "YOUR PLAN"}</p><p className="mt-1 text-xs font-semibold leading-5 text-[#4b5c49]">{hasActivePlan ? emptyDayDetail : "Prepare your week when ready."}</p></div>}</article>; })}</div></section>{hasActivePlan && <p className="rounded-xl border-l-2 border-[#b7cfab] bg-[#f5f9f2] px-4 py-3 text-sm leading-6 text-[#5f715e]">{momentum.completedCount > 0 ? `You have completed ${momentum.completedCount} planned ${momentum.completedCount === 1 ? "post" : "posts"} this week.` : "Your next planned move is ready when you are."}</p>}<div id="alternative-ideas"><AlternativeIdeaGenerator date={today} onSelected={onOpenItem} onNeedProduct={onNeedProduct}/></div></section>;
}

export function WorkspaceShell({ onEditProfile }: { onEditProfile: () => void }) {
  const [view, setView] = useState<View>("brief");
  const [selected, setSelected] = useState<Item | null>(null);
  const [libraryTab, setLibraryTab] = useState<LibraryWorkTab>("drafts");
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryFilter, setLibraryFilter] = useState<LibraryContentFilter>("all");
  const [librarySort, setLibrarySort] = useState<LibrarySort>("recent");
  const [libraryPage, setLibraryPage] = useState(1);
  const today = useMemo(() => iso(), []);
  const dates = useMemo(() => weekDates(), []);
  const workspace = trpc.virasquare.workspace.useQuery({ today, weekStart: dates[0], weekEnd: dates[6] });
  const reminder = trpc.virasquare.preparationReminder.useQuery({ date: today });
  const library = trpc.virasquare.library.useQuery(undefined, { enabled: view === "library" });
  const visuals = trpc.virasquare.visuals.useQuery(undefined, { enabled: view === "library" });
  const profile = trpc.virasquare.profile.useQuery();
  const makePlan = trpc.virasquare.generateWeeklyPlan.useMutation({ onSuccess: () => { workspace.refetch(); toast.success("Your week is planned."); }, onError: error => toast.error(error.message) });
  if (workspace.isLoading) return <div className="grid min-h-screen place-items-center bg-[#f7f7f2]"><Loader2 className="h-6 w-6 animate-spin text-[#75965f]"/></div>;
  if (!workspace.data?.profile) return null;
  const current = workspace.data.todayContent as Item | null;
  const plan = workspace.data.weeklyPlan as Item[];
  const libraryEntries = (library.data ?? []) as LibraryEntry[];
  const libraryTabs: Array<{ id: LibraryWorkTab; label: string; count: number; description: string }> = [
    { id: "drafts", label: "Drafts", count: libraryWorkCount(libraryEntries, "drafts"), description: "Posts you deliberately saved to return to later. They stay separate from active ready-to-post work." },
    { id: "ready", label: "Ready to post", count: libraryWorkCount(libraryEntries, "ready"), description: "Generated posts that are ready to use but have not been saved as drafts, posted, or archived." },
    { id: "posted", label: "Posted", count: libraryWorkCount(libraryEntries, "posted"), description: "Posts you marked as shared or used. This records only what you confirm, not social-platform data." },
    { id: "archived", label: "Archived", count: libraryWorkCount(libraryEntries, "archived"), description: "Work you put away for reference so it does not clutter your active Library views." },
  ];
  const activeLibraryEntries = libraryEntries.filter(entry => getLibraryWorkTab(entry) !== null);
  const tabLibraryEntries = librarySearch.trim() ? searchLibraryWork(activeLibraryEntries, librarySearch) : filterLibraryWork(libraryEntries, libraryTab);
  const visibleLibraryEntries = sortLibraryWork(filterLibraryContent(tabLibraryEntries, libraryFilter), librarySort);
  const libraryPagination = paginateLibraryWork(visibleLibraryEntries, libraryPage);
  const hasActiveLibraryFilters = Boolean(librarySearch.trim()) || libraryFilter !== "all";
  const libraryEmptyCopy: Record<LibraryWorkTab, { title: string; detail: string }> = {
    drafts: { title: "No saved drafts yet", detail: "When a post is ready but you want to return to it later, choose Save to Drafts at the bottom of its review." },
    ready: { title: "Nothing ready to post yet", detail: "Generated work that is not saved as a draft will appear here when it is ready to use." },
    posted: { title: "No posted work recorded yet", detail: "Use the post outcome actions when you share a post, and it will appear here." },
    archived: { title: "No archived work", detail: "Archived posts stay here for reference without cluttering your active work." },
  };
  const hasActivePlan = plan.length >= Math.max(1, workspace.data.profile.weeklyPostGoal);
  const emptyDay = emptyDayCopy(hasActivePlan);
  const todayProgress = todayProgressCopy(current?.lifecycleStatus);
  const navigate = (destination: View) => setView(destination === "today" ? "brief" : destination);
  const nav = (mobile = false) => <nav className={cn(mobile ? "grid grid-cols-5 gap-1" : "hidden items-center gap-1.5 lg:flex")}>{views.map(entry => { const Icon = entry.icon; return <button key={entry.id} onClick={() => navigate(entry.id)} className={cn("flex items-center justify-center gap-2 rounded-xl transition", mobile ? "min-h-12 flex-col px-1 py-1.5 text-[10px] font-semibold" : "px-3.5 py-2 text-sm font-semibold", view === entry.id ? "bg-[#263327] text-[#f7faed] shadow-sm" : "text-[#687466] hover:bg-[#eef4ea]")}><Icon className={cn(mobile ? "h-[18px] w-[18px]" : "h-4 w-4", view === entry.id ? "text-[#eaf2ca]" : "text-[#789176]")}/><span>{mobile ? entry.mobileLabel : entry.label}</span></button>; })}</nav>;

  return <main className="min-h-screen bg-[#f7f7f2] pb-28 text-[#263327] lg:pb-10"><div className="mx-auto max-w-[1180px] px-3 py-3 sm:px-5 sm:py-4"><header className="rounded-xl border border-white bg-[#fffefa]/95 px-3 py-2.5 shadow-sm sm:px-4"><div className="flex items-center justify-between gap-3"><button onClick={() => navigate("today")} className="flex shrink-0 items-center gap-2.5 text-left"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#263327] font-serif text-lg italic text-[#ecf8c5]">v</div><span className="font-semibold tracking-[-.04em] text-[#263327]">virasquare</span></button>{nav()}<button onClick={() => navigate("brand")} className="hidden rounded-xl px-3.5 py-2 text-xs font-semibold text-[#667265] hover:bg-[#eef4ea] sm:block">{workspace.data.profile.businessName}</button><button onClick={() => navigate("brand")} className="grid h-8 w-8 place-items-center rounded-full bg-[#e5efdf] text-xs font-bold text-[#537344] sm:hidden">{workspace.data.profile.businessName.slice(0, 1).toUpperCase()}</button></div></header><div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dfe8da] bg-[#fffefa]/95 shadow-[0_-8px_24px_rgba(38,51,39,0.08)] backdrop-blur lg:hidden"><div className="mx-auto max-w-[680px] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">{nav(true)}</div></div>
    {reminder.data && <button onClick={() => setSelected(reminder.data?.item as Item)} className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-[#cfe0c7] bg-[#eef7e9] p-4 text-left text-sm text-[#45623e]"><span><strong>Prepare for tomorrow.</strong> {reminder.data.note}</span><Package className="h-5 w-5 shrink-0"/></button>}
    <section className="pt-5">{view === "brief" && <DailyBriefPanel current={current} plan={plan} dates={dates} weeklyPostGoal={workspace.data.profile.weeklyPostGoal} onOpenItem={setSelected} onPrepareWeek={() => makePlan.mutate({ dates })} onViewWeek={() => navigate("calendar")} onNeedProduct={() => { navigate("products"); toast.message("Add a product first, then come back to create product-led content."); }}/>} {view === "today" && <section><div className="rounded-[1.5rem] bg-[#263327] p-5 text-[#f7faed] shadow-md sm:p-6"><div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,.65fr)] lg:items-end"><div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#cce1b8]">{readable(today, { weekday: "long", month: "long", day: "numeric" })}</p><p className="mt-4 text-sm text-[#c7d4c1]">Today’s planned content</p><h1 className="mt-1 max-w-3xl font-serif text-3xl leading-[1.02] sm:text-4xl lg:text-5xl">{current?.objective || "Finding your focus"}</h1></div>{current && <div className={cn("flex items-center gap-3 rounded-xl border px-3 py-3", current.lifecycleStatus === "posted" ? "border-[#c9dfb4]/50 bg-[#4a6845]" : "border-white/15 bg-white/8")}><CheckCircle2 className={cn("h-4 w-4", current.lifecycleStatus === "posted" ? "text-[#eaf2ca]" : "text-[#cce1b8]")}/><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#cce1b8]">{todayProgress.label}</p><p className="mt-0.5 text-xs leading-5 text-[#e3ecdc]">{todayProgress.detail}</p></div></div>}</div>{current ? <button onClick={() => setSelected(current)} className="group mt-5 w-full rounded-xl border border-white/10 bg-white/10 p-4 text-left transition hover:border-[#eaf2ca]/40 hover:bg-white/15"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#cce1b8]">Your planned post · {current.lifecycleStatus}</p><h2 className="mt-2 max-w-3xl font-serif text-xl leading-tight sm:text-2xl">{current.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#d6e0d1]">{current.brief}</p></div><span className="inline-flex shrink-0 items-center self-start rounded-lg bg-[#eaf2ca] px-3 py-2 text-xs font-bold text-[#263327] shadow-sm transition group-hover:bg-[#f6fadf] sm:self-auto">Open today’s post <ChevronRight className="ml-1 h-3.5 w-3.5"/></span></div></button> : <p className="mt-5 text-sm text-[#d6e0d1]">Your first recommendation is being prepared.</p>}</div><div className="mt-6 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">THIS WEEK</p><h2 className="mt-1 font-serif text-xl">Your planned rhythm</h2></div><button onClick={() => navigate("calendar")} className="text-sm font-semibold text-[#527542]">View calendar <ChevronRight className="inline h-4 w-4"/></button></div><div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">{dates.map(date => { const item = plan.find(value => value.plannedFor === date); return <article key={date} className={cn("min-h-32 rounded-xl border p-3", item ? "border-[#e2e8de] bg-[#fffefa]" : hasActivePlan ? "border-[#d4e3cc] bg-[#f4f8f1]" : "border-dashed border-[#dce5d8] bg-[#fbfcf9]")}><p className="text-[10px] font-bold uppercase tracking-wider text-[#788676]">{readable(date, { weekday: "short" })}</p><p className="mt-0.5 font-serif text-lg">{readable(date, { day: "numeric" })}</p>{item ? <button onClick={() => setSelected(item)} className="mt-3 text-left"><p className="line-clamp-3 text-xs font-medium leading-5 text-[#475347]">{item.title}</p><p className="mt-2 text-[10px] font-bold uppercase text-[#75965f]">{item.lifecycleStatus}</p></button> : <div className="mt-3"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#5d8152]">{emptyDay.eyebrow}</p><p className="mt-1 text-xs font-semibold leading-5 text-[#4b5c49]">{emptyDay.title}</p><p className="mt-1 text-[11px] leading-4 text-[#788475]">{emptyDay.detail}</p></div>}</article>; })}</div><AlternativeIdeaGenerator date={today} onSelected={setSelected} onNeedProduct={() => { navigate("products"); toast.message("Add a product first, then come back to create product-led content."); }}/></section>}
      {view === "calendar" && <CalendarPanel plan={plan} dates={dates} select={setSelected} makePlan={() => makePlan.mutate({ dates })} planning={makePlan.isPending} weeklyPostGoal={workspace.data.profile.weeklyPostGoal}/>} {view === "products" && <ProductManager/>} {view === "library" && <section><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">YOUR WORK</p><h1 className="mt-1 font-serif text-3xl text-[#263327]">Library</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c776b]">Keep active work easy to find. Choose a view to return to saved drafts, prepare a post, or look back at what you have used.</p></div><div className="flex flex-wrap items-center gap-2"><Popover><PopoverTrigger asChild><Button type="button" size="sm" variant="outline" className="rounded-xl border-[#d7e3d2] bg-white text-[#587052] hover:bg-[#eef5e9]"><Info className="mr-1.5 h-3.5 w-3.5"/>How Library works</Button></PopoverTrigger><PopoverContent align="end" className="w-80 rounded-2xl border-[#dce7d7] bg-[#fffefa] p-4 text-[#405142]"><p className="text-sm font-semibold">Your work, organised simply.</p><div className="mt-3 grid gap-3">{libraryTabs.map(tab => <div key={tab.id}><p className="text-xs font-bold uppercase tracking-wide text-[#5b7853]">{tab.label}</p><p className="mt-1 text-xs leading-5 text-[#697669]">{tab.description}</p></div>)}</div></PopoverContent></Popover><p className="rounded-xl border border-[#dce7d7] bg-[#fffefa] px-3 py-2 text-xs font-semibold text-[#527542]">{visuals.data?.filter(Boolean).length || 0} visual set(s) saved</p></div></div><div className="mt-6 border-b border-[#e0e8dc] pb-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap gap-2">{libraryTabs.map(tab => <Button key={tab.id} type="button" size="sm" variant={libraryTab === tab.id ? "default" : "outline"} onClick={() => { setLibraryTab(tab.id); setLibrarySearch(""); setLibraryPage(1); }} className={cn("rounded-full", libraryTab === tab.id ? "bg-[#263327] hover:bg-[#3a4d3b]" : "border-[#d7e3d2] bg-white text-[#587052] hover:bg-[#eef5e9]")}>{tab.label}<span className={cn("ml-1 rounded-full px-1.5 py-0.5 text-[10px]", libraryTab === tab.id ? "bg-white/15 text-[#eff8e8]" : "bg-[#edf4e9] text-[#5b7853]")}>{tab.count}</span></Button>)}</div><div className="flex w-full flex-col gap-2 lg:max-w-[640px]"><div className="flex gap-2"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#789176]"/><Input value={librarySearch} onChange={event => { setLibrarySearch(event.target.value); setLibraryPage(1); }} className="h-10 border-[#d7e3d2] bg-white pl-9 pr-3 text-sm" placeholder="Search all saved work" aria-label="Search all saved work"/></div><Popover><PopoverTrigger asChild><Button type="button" variant="outline" className={cn("h-10 shrink-0 rounded-xl border-[#d7e3d2] bg-white px-3 text-[#587052] hover:bg-[#eef5e9]", libraryFilter !== "all" && "border-[#9cbd8c] bg-[#eef5e9] text-[#41653a]")}><SlidersHorizontal className="mr-1.5 h-4 w-4"/>Organise{libraryFilter !== "all" && <span className="ml-1.5 rounded-full bg-[#537a45] px-1.5 py-0.5 text-[10px] text-white">1</span>}</Button></PopoverTrigger><PopoverContent align="end" className="w-72 rounded-2xl border-[#dce7d7] bg-[#fffefa] p-4 text-[#405142]"><p className="text-sm font-semibold">Organise this view</p><div className="mt-4 grid gap-4"><div><p className="mb-2 text-xs font-semibold text-[#5b7853]">Content type</p><Select value={libraryFilter} onValueChange={value => { setLibraryFilter(value as LibraryContentFilter); setLibraryPage(1); }}><SelectTrigger className="h-10 w-full border-[#d7e3d2] bg-white text-sm text-[#587052]"><SelectValue placeholder="All content"/></SelectTrigger><SelectContent><SelectItem value="all">All content</SelectItem><SelectItem value="product">Product posts</SelectItem><SelectItem value="education">Product education</SelectItem><SelectItem value="carousel">Carousels</SelectItem><SelectItem value="caption">Captions</SelectItem></SelectContent></Select></div><div><p className="mb-2 text-xs font-semibold text-[#5b7853]">Sort by</p><Select value={librarySort} onValueChange={value => { setLibrarySort(value as LibrarySort); setLibraryPage(1); }}><SelectTrigger className="h-10 w-full border-[#d7e3d2] bg-white text-sm text-[#587052]"><SelectValue placeholder="Newest first"/></SelectTrigger><SelectContent><SelectItem value="recent">Newest first</SelectItem><SelectItem value="oldest">Oldest first</SelectItem><SelectItem value="title_asc">Title A to Z</SelectItem><SelectItem value="title_desc">Title Z to A</SelectItem></SelectContent></Select></div></div></PopoverContent></Popover></div>{hasActiveLibraryFilters && <button type="button" onClick={() => { setLibrarySearch(""); setLibraryFilter("all"); setLibraryPage(1); }} className="self-end text-xs font-semibold text-[#527542] underline-offset-4 hover:underline">Clear filters</button>}</div></div></div><div className="mt-5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#75965f]">{librarySearch.trim() ? `SEARCH RESULTS · ${visibleLibraryEntries.length}` : libraryTab === "drafts" ? "SAVED FOR LATER" : libraryTab === "ready" ? "READY TO USE" : libraryTab === "posted" ? "POST HISTORY" : "ARCHIVED WORK"}</p>{visibleLibraryEntries.length > 0 ? <><div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{libraryPagination.items.map(entry => <button key={entry.id} onClick={() => setSelected({ ...entry, hashtags: [], carouselSlides: parseSavedSlides(entry.carouselSlides) } as Item)} className="rounded-2xl border border-[#e2e8de] bg-[#fffefa] p-4 text-left transition hover:border-[#b9cdb0] hover:bg-white"><p className="text-[10px] font-bold uppercase tracking-wide text-[#75965f]">{entry.entryType === "product_education" ? "product education · " : ""}{entry.feedbackOutcome === "saved_for_later" ? "saved draft" : entry.lifecycleStatus}</p><h2 className="mt-3 font-serif text-xl leading-tight text-[#263327]">{entry.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6c776b]">{entry.brief}</p></button>)}</div>{libraryPagination.totalPages > 1 && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e0e8dc] bg-[#fffefa] px-3 py-2"><p className="text-xs text-[#6c776b]">Showing {(libraryPagination.currentPage - 1) * 9 + 1} to {Math.min(libraryPagination.currentPage * 9, libraryPagination.totalItems)} of {libraryPagination.totalItems}</p><div className="flex items-center gap-2"><Button type="button" size="sm" variant="outline" disabled={libraryPagination.currentPage === 1} onClick={() => setLibraryPage(libraryPagination.currentPage - 1)} className="h-8 border-[#d7e3d2] bg-white px-2 text-[#587052]"><ChevronLeft className="h-4 w-4"/><span className="sr-only">Previous page</span></Button><span className="text-xs font-semibold text-[#527542]">Page {libraryPagination.currentPage} of {libraryPagination.totalPages}</span><Button type="button" size="sm" variant="outline" disabled={libraryPagination.currentPage === libraryPagination.totalPages} onClick={() => setLibraryPage(libraryPagination.currentPage + 1)} className="h-8 border-[#d7e3d2] bg-white px-2 text-[#587052]"><ChevronRight className="h-4 w-4"/><span className="sr-only">Next page</span></Button></div></div>}</> : <div className="mt-3 rounded-2xl border border-dashed border-[#d5e1d0] bg-[#fbfcf9] px-5 py-8"><h2 className="font-serif text-2xl text-[#334b32]">{librarySearch.trim() ? "No posts match that search" : libraryFilter !== "all" ? "No posts match this filter" : libraryEmptyCopy[libraryTab].title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#6c776b]">{librarySearch.trim() ? "Try a different product name, post title, or a word from the post description. Search looks across every active Library view." : libraryFilter !== "all" ? "Try another content type, switch Library views, or clear the filter to see every saved item in this view." : libraryEmptyCopy[libraryTab].detail}</p></div>}</div></section>}{view === "brand" && profile.data && <BrandSettings profile={profile.data} onEditProfile={onEditProfile}/>}</section></div><ProgressivePrompts profile={workspace.data.profile} current={current} productCount={workspace.data.productCount} onOpenProducts={() => navigate("products")}/>{selected && <ContentDetail item={selected} close={() => setSelected(null)}/>}</main>;
}
