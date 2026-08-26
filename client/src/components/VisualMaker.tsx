import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { requestAttachmentDownload } from "@/lib/downloads";
import { Copy, Download, ImagePlus, Layers3, Loader2, MessageCircleMore, RefreshCw, Sparkles, TrendingUp, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ContentItem = {
  id: number;
  title: string;
  format: "caption" | "carousel" | "tip" | "promo" | "story";
  caption: string | null;
  requiresProduct: boolean;
  preparationNote: string | null;
  productId?: number | null;
  entryType?: "calendar" | "product_education";
  carouselSlides: Array<{ cardType?: string; eyebrow?: string; heading: string; body: string; footer?: string }>;
};

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("This image could not be read."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function VisualMaker({ item, onOpenProductEducation }: { item: ContentItem; onOpenProductEducation?: (item: ContentItem) => void }) {
  const utils = trpc.useUtils();
  const products = trpc.virasquare.products.useQuery();
  const savedVisuals = trpc.virasquare.visuals.useQuery();
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>();
  const [isAdding, setIsAdding] = useState(false);
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [details, setDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [deliverable, setDeliverable] = useState<any>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [stylishGeneration, setStylishGeneration] = useState(false);
  const [correction, setCorrection] = useState("");
  const [educationOpen, setEducationOpen] = useState(false);
  const [educationTopic, setEducationTopic] = useState("");
  const [educationIdeas, setEducationIdeas] = useState<Array<{ title: string; objective: string; format: "caption" | "carousel" | "tip" | "promo" | "story"; brief: string }>>([]);
  const sellingPackage = trpc.virasquare.productSellingPackage.useQuery({ deliverableId: deliverable?.id || 0 }, { enabled: Boolean(deliverable?.id && deliverable.type === "single_post") });
  const sellingPackageData = sellingPackage.data;

  const createSellingPackage = trpc.virasquare.generateProductSellingPackage.useMutation({
    onSuccess: async () => {
      await utils.virasquare.productSellingPackage.invalidate({ deliverableId: deliverable?.id || 0 });
      toast.success("Your product selling package is ready to review.");
    },
    onError: error => {
      setProblem(error.message);
      toast.error(error.message);
    },
  });
  const suggestProductEducation = trpc.virasquare.generateIdeas.useMutation({
    onSuccess: value => setEducationIdeas(value as Array<{ title: string; objective: string; format: "caption" | "carousel" | "tip" | "promo" | "story"; brief: string }>),
    onError: error => toast.error(error.message),
  });
  const saveProductEducation = trpc.virasquare.saveProductEducationIdea.useMutation({
    onSuccess: value => {
      setEducationOpen(false);
      setEducationIdeas([]);
      setEducationTopic("");
      toast.success("Your separate educational carousel is ready to develop.");
      onOpenProductEducation?.(value as ContentItem);
      utils.virasquare.library.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (item.productId) setSelectedProductId(item.productId);
  }, [item.productId]);

  useEffect(() => {
    setDeliverable(null);
    setProblem(null);
    setCorrection("");
  }, [item.id]);

  useEffect(() => {
    if (deliverable || !savedVisuals.data) return;
    const saved = savedVisuals.data.find(visual => visual?.contentItemId === item.id && visual.status === "ready" && (item.requiresProduct ? visual.type === "single_post" : visual.type === "carousel"));
    if (saved) setDeliverable(saved);
  }, [deliverable, item.id, item.requiresProduct, savedVisuals.data]);

  const createProduct = trpc.virasquare.createProduct.useMutation({
    onSuccess: product => {
      setSelectedProductId(product.id);
      setIsAdding(false);
      setProductName("");
      setPrice("");
      setDetails("");
      setFile(null);
      utils.virasquare.products.invalidate();
      toast.success("Your real product is ready to use in a visual.");
    },
    onError: error => {
      setProblem(error.message);
      toast.error(error.message);
    },
  });

  const makeVisual = trpc.virasquare.makeVisual.useMutation({
    onSuccess: value => {
      setDeliverable(value);
      utils.virasquare.visuals.invalidate();
      toast.success(value.slides?.[0]?.sourceMode === "product" ? "Your original product photo was kept in the finished card." : "Your product card is ready to review.");
    },
    onError: error => {
      setProblem(error.message);
      toast.error(error.message);
    },
  });

  const regenerate = trpc.virasquare.regenerateVisualSlide.useMutation({
    onSuccess: value => {
      setDeliverable(value);
      setCorrection("");
      toast.success("Your product flyer has been regenerated.");
    },
    onError: error => {
      setProblem(error.message);
      toast.error(error.message);
    },
  });

  const exportVisualSet = trpc.virasquare.exportVisualSet.useMutation({
    onSuccess: archive => {
      requestAttachmentDownload(archive.url, "virasquare-visual-set.zip");
      toast.success(`Your ${archive.slideCount}-slide visual set is ready to download.`);
    },
    onError: error => {
      setProblem(error.message);
      toast.error(error.message);
    },
  });

  const selected = useMemo(() => products.data?.find(product => product.id === selectedProductId), [products.data, selectedProductId]);
  const canMakeProductPost = Boolean(item.requiresProduct && selectedProductId && item.caption);

  const addProduct = async () => {
    if (!file || productName.trim().length < 2) {
      setProblem("Add a product name and one real product photo first.");
      return;
    }
    try {
      const dataUrl = await readFile(file);
      setProblem(null);
      createProduct.mutate({
        name: productName.trim(),
        price: price.trim() || undefined,
        details: details.trim() || undefined,
        image: { dataUrl, fileName: file.name },
      });
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "This product photo could not be used.");
    }
  };

  const beginVisual = (type: "single_post" | "carousel") => {
    setProblem(null);
    makeVisual.mutate({ itemId: item.id, productId: selectedProductId, type, visualMode: type === "single_post" && stylishGeneration ? "stylish" : "standard" });
  };

  const copyPackageText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error("Copy was not available. Please select the text and copy it yourself.");
    }
  };
  const openEducationIdeas = () => {
    if (!item.productId) return;
    suggestProductEducation.mutate({ format: "carousel", objective: "Education", topic: educationTopic.trim() || undefined, productId: item.productId });
  };

  return <section className="mt-5 rounded-2xl border border-[#dce8d5] bg-[#f8fbf5] p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="eyebrow">MAKE MY VISUAL</p>
        <h3 className="mt-1 font-serif text-2xl text-[#2d3c2e]">A complete post, not just a prompt.</h3>
        <p className="mt-1 max-w-xl text-sm leading-6 text-[#6b786b]">Product posts keep your real saved product at the centre. Educational posts remain rich branded card sets.</p>
      </div>
      <ImagePlus className="h-6 w-6 shrink-0 text-[#71975f]" />
    </div>

    {item.requiresProduct ? <div className="mt-5 rounded-xl border border-[#e0e9da] bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#3d4c3e]">Your real products</p>
          <p className="text-xs text-[#788477]">We use your image and the details you provide—never an invented product.</p>
        </div>
        <Button onClick={() => setIsAdding(value => !value)} variant="ghost" className="h-9 text-[#557b45] hover:bg-[#edf5e9]">{isAdding ? "Cancel" : "Add product"}</Button>
      </div>
      {products.isLoading ? <div className="mt-4 flex items-center gap-2 text-sm text-[#718071]"><Loader2 className="h-4 w-4 animate-spin" />Loading your products…</div> : <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {products.data?.map(product => <button key={product.id} type="button" onClick={() => setSelectedProductId(product.id)} className={cn("flex min-w-36 items-center gap-2 rounded-xl border p-2 text-left transition-colors", selectedProductId === product.id ? "border-[#789b67] bg-[#eff7ea]" : "border-[#e1e8dc] bg-[#fffefa] hover:border-[#bdd0b1]")}>
          <img src={product.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
          <span className="min-w-0"><span className="block truncate text-xs font-semibold text-[#3d4b3e]">{product.name}</span><span className="block truncate text-[11px] text-[#789075]">{product.price ? `₦${product.price}` : "No price added"}</span></span>
        </button>)}
        {!products.data?.length && <p className="py-2 text-sm text-[#7a8679]">Add your first real product photo to make a verified product post.</p>}
      </div>}
      {isAdding && <div className="mt-4 grid gap-3 border-t border-[#e8eee4] pt-4 sm:grid-cols-2">
        <div className="grid gap-2"><Label>Product name</Label><Input value={productName} onChange={event => setProductName(event.target.value)} placeholder="e.g. Classic everyday watch" /></div>
        <div className="grid gap-2"><Label>Verified price <span className="font-normal text-[#879187]">(optional)</span></Label><Input value={price} onChange={event => setPrice(event.target.value)} placeholder="e.g. 50,000" /></div>
        <div className="grid gap-2 sm:col-span-2"><Label>Product photo</Label><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#b9cdb0] bg-[#f8fbf6] px-3 py-3 text-sm text-[#5d7558] hover:bg-[#eff6eb]"><Upload className="h-4 w-4" /><span className="truncate">{file ? file.name : "Choose a PNG, JPEG, or WebP image"}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={event => setFile(event.target.files?.[0] ?? null)} /></label></div>
        <div className="grid gap-2 sm:col-span-2"><Label>Help us understand this product <span className="font-normal text-[#879187]">(optional)</span></Label><Textarea value={details} onChange={event => setDetails(event.target.value)} placeholder="Share facts you are sure of, such as colour, material, size, or order information." className="min-h-20 resize-none" /></div>
        <div className="sm:col-span-2"><Button onClick={addProduct} disabled={createProduct.isPending} className="rounded-xl bg-[#263327] hover:bg-[#3a4d3b]">{createProduct.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Save real product</Button></div>
      </div>}
    </div> : <div className="mt-5 rounded-xl border border-[#e0e9da] bg-white p-4"><p className="text-sm font-semibold text-[#3d4c3e]">{item.entryType === "product_education" ? "This is a separate educational carousel." : "This is a rich branded card set."}</p><p className="mt-1 text-sm leading-6 text-[#788477]">{item.entryType === "product_education" ? "It is linked to your saved product facts, but it is separate from the product flyer and its selling package." : "No product image is needed. ViraSquare will turn the full structured content into complete, ready-to-post cards."}</p></div>}

    {item.requiresProduct ? <div className="mt-4 rounded-2xl border border-[#cfe0c4] bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#344738]">Generate product-post card</p>
          <p className="mt-1 max-w-xl text-xs leading-5 text-[#748174]">{selected ? `ViraSquare will use ${selected.name}, your saved facts, and your brand details to create one complete ready-to-post flyer.` : item.preparationNote || "Choose a real product above first."}</p>
        </div>
        <Button type="button" disabled={!canMakeProductPost || makeVisual.isPending} onClick={() => beginVisual("single_post")} className="shrink-0 rounded-xl bg-[#263327] hover:bg-[#3a4d3b]">{makeVisual.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}{stylishGeneration ? "Generate stylish card" : "Generate product card"}</Button>
      </div>
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[#e2eadc] bg-[#f8fbf5] p-3">
        <Checkbox checked={stylishGeneration} onCheckedChange={value => setStylishGeneration(value === true)} className="mt-0.5 border-[#839e77] data-[state=checked]:bg-[#557b45]" />
        <span><span className="text-sm font-semibold text-[#405142]">Stylish generation <span className="font-normal text-[#738071]">(optional)</span></span><span className="mt-1 block text-xs leading-5 text-[#748174]">Create a more campaign-style visual. It may change the background, lighting, crop, and small visual details. Use this when you want a creative look rather than an exact photo match.</span></span>
      </label>
    </div> : <div className="mt-4"><button type="button" disabled={!item.caption || makeVisual.isPending} onClick={() => beginVisual("carousel")} className={cn("w-full rounded-xl border p-4 text-left transition-colors", item.caption ? "border-[#a8c493] bg-white hover:border-[#789c67]" : "cursor-not-allowed border-[#e2e8df] bg-[#f5f7f4] opacity-65")}><p className="flex items-center gap-2 text-sm font-semibold text-[#344738]"><Layers3 className="h-4 w-4 text-[#71975f]" />Make complete card set</p><p className="mt-1 text-xs leading-5 text-[#748174]">Every card is structured, branded, and ready to review.</p></button></div>}
    {makeVisual.isPending && <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#eaf3e4] p-3 text-sm text-[#4e6b45]"><Loader2 className="h-4 w-4 animate-spin" />Making your complete visual set. This can take a short moment.</div>}
    {problem && <div role="alert" className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-[#efd4c6] bg-[#fff5f0] p-3 text-sm text-[#834e3d]"><p>{problem} You can try again, use a smaller image, or choose a different saved product.</p><button onClick={() => setProblem(null)} className="font-semibold underline">Dismiss</button></div>}

    {deliverable?.slides?.length > 0 && <div className="mt-5 border-t border-[#dfe9d9] pt-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div><p className="eyebrow">YOUR READY-TO-POST VISUALS</p><h4 className="mt-1 font-serif text-xl text-[#2e3c2e]">Review each slide before you post.</h4></div>
        <div className="flex items-center gap-2"><Button onClick={() => { setProblem(null); exportVisualSet.mutate({ deliverableId: deliverable.id }); }} disabled={exportVisualSet.isPending} variant="outline" className="rounded-xl border-[#b7cda9] bg-white text-[#43663a] hover:bg-[#eef6e9]">{exportVisualSet.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Download full set</Button><Sparkles className="h-5 w-5 text-[#71975f]" /></div>
      </div>
      {deliverable.type === "single_post" && <div className={cn("mt-4 rounded-xl border p-3 text-xs leading-5", deliverable.slides[0]?.sourceMode === "product" ? "border-[#d4e5c9] bg-[#f4faef] text-[#527044]" : "border-[#e2eadc] bg-[#f8fbf5] text-[#657563]")}>{deliverable.slides[0]?.sourceMode === "product" ? "ViraSquare kept your original uploaded product photo in this card because the AI flyer was not available. You can try again or make a different version." : deliverable.generationMode === "stylish" ? "Stylish generation was used for this complete product flyer. Review the product, wording, price, and brand details before you post." : "Your complete product flyer was made from your saved product, brand, and product facts. Review every important detail before you post."}</div>}
      {deliverable.type === "single_post" && <div className="mt-4 grid gap-4 sm:grid-cols-2">{deliverable.slides.map((slide: any) => <article key={slide.id ?? slide.slideNumber} className="overflow-hidden rounded-2xl border border-[#e0e8dd] bg-white"><div className="aspect-[4/5] bg-[#edf2e8]">{slide.assetUrl ? <img src={slide.assetUrl} alt={`Visual slide ${slide.slideNumber}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-[#789075]">Preparing slide…</div>}</div><div className="flex items-center justify-between gap-2 p-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#759166]">PRODUCT POST</p><p className="mt-1 line-clamp-1 text-sm font-semibold text-[#405142]">{slide.heading}</p></div><div className="flex gap-1"><Button title="Generate another version" onClick={() => { setProblem(null); regenerate.mutate({ deliverableId: deliverable.id, slideNumber: slide.slideNumber }); }} disabled={regenerate.isPending} size="icon" variant="ghost" className="h-8 w-8 text-[#537a45]"><RefreshCw className={cn("h-4 w-4", regenerate.isPending && "animate-spin")} /></Button>{slide.assetUrl && <Button type="button" title="Download slide" onClick={() => requestAttachmentDownload(slide.assetUrl, "virasquare-product-flyer.png")} size="icon" variant="ghost" className="h-8 w-8 text-[#537a45]"><Download className="h-4 w-4" /></Button>}</div></div></article>)}</div>}
      {deliverable.type === "single_post" && <div className="mt-4 rounded-xl border border-[#dce8d5] bg-white p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="min-w-0 flex-1"><Label htmlFor="flyer-correction" className="text-sm font-semibold text-[#405142]">Need something corrected?</Label><p className="mt-1 text-xs leading-5 text-[#748174]">Tell ViraSquare one clear issue, such as a misspelt name, wrong price, missing Instagram, or product detail that must stay true.</p><Textarea id="flyer-correction" value={correction} onChange={event => setCorrection(event.target.value)} placeholder="For example: Keep the price exactly as ₦35,000 and spell the product name correctly." className="mt-2 min-h-20 resize-none" /></div><Button onClick={() => { const firstSlide = deliverable.slides[0]; if (!correction.trim()) { setProblem("Tell ViraSquare what needs correcting first."); return; } setProblem(null); regenerate.mutate({ deliverableId: deliverable.id, slideNumber: firstSlide.slideNumber, correction: correction.trim() }); }} disabled={regenerate.isPending || correction.trim().length < 3} className="shrink-0 rounded-xl bg-[#263327] hover:bg-[#3a4d3b]">{regenerate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Fix and regenerate</Button></div></div>}
      {deliverable.type === "single_post" && <section className="mt-4 overflow-hidden rounded-2xl border border-[#cfe0c5] bg-[#f7fbf4]">
        <div className="border-b border-[#dce9d6] bg-[#edf5e8] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="eyebrow">PRODUCT SELLING PACKAGE</p><h5 className="mt-1 font-serif text-2xl text-[#2d3c2e]">Turn this flyer into a fuller selling set.</h5><p className="mt-2 max-w-2xl text-xs leading-5 text-[#667565]">Get a matching caption, a short buyer reply, and a different future selling angle. ViraSquare uses your saved product and brand facts only. Nothing is posted or sent for you.</p></div>{!sellingPackageData && <Button onClick={() => createSellingPackage.mutate({ deliverableId: deliverable.id })} disabled={createSellingPackage.isPending} className="shrink-0 rounded-xl bg-[#263327] hover:bg-[#3a4d3b]">{createSellingPackage.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Prepare selling package</Button>}</div></div>
        {sellingPackage.isLoading && <div className="flex items-center gap-2 p-4 text-sm text-[#667565]"><Loader2 className="h-4 w-4 animate-spin" />Loading your saved selling package…</div>}
        {sellingPackageData && <div className="grid gap-3 p-4 lg:grid-cols-3">
          <article className="rounded-xl border border-[#dfe8db] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#5f8256]">MATCHING CAPTION</p><h6 className="mt-1 text-sm font-semibold text-[#405142]">Ready to post</h6></div><Button type="button" size="icon" variant="ghost" title="Copy caption" onClick={() => copyPackageText(sellingPackageData.caption, "Caption")} className="h-8 w-8 text-[#557b45]"><Copy className="h-4 w-4" /></Button></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#495848]">{sellingPackageData.caption}</p></article>
          <article className="rounded-xl border border-[#dfe8db] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#5f8256]">BUYER REPLY</p><h6 className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#405142]"><MessageCircleMore className="h-4 w-4" />For WhatsApp or DM</h6></div><Button type="button" size="icon" variant="ghost" title="Copy buyer reply" onClick={() => copyPackageText(sellingPackageData.buyerReply, "Buyer reply")} className="h-8 w-8 text-[#557b45]"><Copy className="h-4 w-4" /></Button></div><p className="mt-3 text-sm leading-6 text-[#495848]">{sellingPackageData.buyerReply}</p></article>
          <article className="rounded-xl border border-[#dfe8db] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#5f8256]">NEXT PRODUCT ANGLE</p><h6 className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#405142]"><TrendingUp className="h-4 w-4" />{sellingPackageData.nextAngleTitle}</h6></div><Button type="button" size="icon" variant="ghost" title="Copy next angle" onClick={() => copyPackageText(`${sellingPackageData.nextAngleTitle}\n\n${sellingPackageData.nextAngleDescription}`, "Next product angle")} className="h-8 w-8 text-[#557b45]"><Copy className="h-4 w-4" /></Button></div><p className="mt-3 text-sm leading-6 text-[#495848]">{sellingPackageData.nextAngleDescription}</p></article>
        </div>}
        {item.entryType !== "product_education" && <div className="border-t border-[#dce9d6] bg-white px-4 py-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-[#405142]">Want to teach, not just sell?</p><p className="mt-1 text-xs leading-5 text-[#738072]">Create a separate educational carousel about this product. It will not change this flyer, caption, or selling package.</p></div><Button type="button" variant="outline" onClick={() => setEducationOpen(true)} className="shrink-0 rounded-xl border-[#b8cdaa] text-[#45663d] hover:bg-[#edf5e8]"><Layers3 className="mr-2 h-4 w-4" />Create educational carousel</Button></div></div>}
      </section>}
      {deliverable.type !== "single_post" && <div className="mt-4 grid gap-4 sm:grid-cols-2">{deliverable.slides.map((slide: any) => <article key={slide.id ?? slide.slideNumber} className="overflow-hidden rounded-2xl border border-[#e0e8dd] bg-white"><div className="aspect-[4/5] bg-[#edf2e8]">{slide.assetUrl ? <img src={slide.assetUrl} alt={`Visual slide ${slide.slideNumber}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-[#789075]">Preparing slide…</div>}</div><div className="flex items-center justify-between gap-2 p-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#759166]">{`Slide ${slide.slideNumber}`}</p><p className="mt-1 line-clamp-1 text-sm font-semibold text-[#405142]">{slide.heading}</p></div><div className="flex gap-1"><Button title="Refresh this slide" onClick={() => { setProblem(null); regenerate.mutate({ deliverableId: deliverable.id, slideNumber: slide.slideNumber }); }} disabled={regenerate.isPending} size="icon" variant="ghost" className="h-8 w-8 text-[#537a45]"><RefreshCw className={cn("h-4 w-4", regenerate.isPending && "animate-spin")} /></Button>{slide.assetUrl && <Button type="button" title="Download slide" onClick={() => requestAttachmentDownload(slide.assetUrl, `virasquare-slide-${slide.slideNumber}.png`)} size="icon" variant="ghost" className="h-8 w-8 text-[#537a45]"><Download className="h-4 w-4" /></Button>}</div></div></article>)}</div>}
    </div>}
    {educationOpen && <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#172017]/45 p-3 backdrop-blur-sm sm:items-center sm:p-6"><div role="dialog" aria-modal="true" aria-label="Create an educational carousel about this product" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-[#fffefa] shadow-2xl"><header className="sticky top-0 flex items-start justify-between gap-4 border-b border-[#e3eadf] bg-[#fffefa]/95 px-5 py-4"><div><p className="eyebrow">SEPARATE PRODUCT EDUCATION</p><h4 className="mt-1 font-serif text-2xl text-[#2d3c2e]">Teach customers about {selected?.name || "this product"}.</h4><p className="mt-2 max-w-2xl text-xs leading-5 text-[#6c786b]">This will be a new educational carousel, separate from the product flyer you just made. ViraSquare will use saved product facts only.</p></div><Button type="button" size="icon" variant="ghost" title="Close educational carousel ideas" onClick={() => setEducationOpen(false)} className="shrink-0 rounded-full text-lg">×</Button></header><div className="p-5"><Label htmlFor="product-education-topic">What should customers learn? <span className="font-normal text-[#738072]">(optional)</span></Label><Textarea id="product-education-topic" value={educationTopic} onChange={event => setEducationTopic(event.target.value)} placeholder="For example: How to choose an everyday handbag, or what to consider before buying." className="mt-2 min-h-24 resize-none"/><div className="mt-4 flex justify-end"><Button type="button" onClick={openEducationIdeas} disabled={suggestProductEducation.isPending} className="rounded-xl bg-[#263327] hover:bg-[#3a4d3b]">{suggestProductEducation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Suggest educational angles</Button></div>{educationIdeas.length > 0 && <section className="mt-6 border-t border-[#e5ebe1] pt-5"><p className="eyebrow">CHOOSE AN EDUCATIONAL ANGLE</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{educationIdeas.map((idea, index) => <article key={`${idea.title}-${index}`} className="flex flex-col rounded-2xl border border-[#dfe8db] bg-white p-4"><h5 className="font-serif text-xl leading-tight text-[#334336]">{idea.title}</h5><p className="mt-3 flex-1 text-sm leading-6 text-[#697669]">{idea.brief}</p><Button type="button" variant="outline" disabled={saveProductEducation.isPending} onClick={() => saveProductEducation.mutate({ sourceItemId: item.id, title: idea.title, brief: idea.brief })} className="mt-5 rounded-xl">Choose this educational carousel</Button></article>)}</div></section>}</div></div></div>}
  </section>;
}
