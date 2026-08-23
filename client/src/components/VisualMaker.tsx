import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Download, ImagePlus, Layers3, Loader2, RefreshCw, Sparkles, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type ContentItem = {
  id: number;
  title: string;
  caption: string | null;
  requiresProduct: boolean;
  preparationNote: string | null;
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

export function VisualMaker({ item }: { item: ContentItem }) {
  const utils = trpc.useUtils();
  const products = trpc.virasquare.products.useQuery();
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>();
  const [isAdding, setIsAdding] = useState(false);
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [details, setDetails] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [deliverable, setDeliverable] = useState<any>(null);
  const [problem, setProblem] = useState<string | null>(null);

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
      toast.success("Your complete visual is ready to review.");
    },
    onError: error => {
      setProblem(error.message);
      toast.error(error.message);
    },
  });

  const regenerate = trpc.virasquare.regenerateVisualSlide.useMutation({
    onSuccess: value => {
      setDeliverable(value);
      toast.success("That slide has been refreshed.");
    },
    onError: error => {
      setProblem(error.message);
      toast.error(error.message);
    },
  });

  const exportVisualSet = trpc.virasquare.exportVisualSet.useMutation({
    onSuccess: archive => {
      window.open(archive.url, "_blank", "noopener,noreferrer");
      toast.success(`Your ${archive.slideCount}-slide visual set is ready to download.`);
    },
    onError: error => {
      setProblem(error.message);
      toast.error(error.message);
    },
  });

  const selected = useMemo(() => products.data?.find(product => product.id === selectedProductId), [products.data, selectedProductId]);
  const canMakeProductPost = Boolean(item.requiresProduct && selectedProductId && item.caption);
  const canMakeCarousel = Boolean(item.caption && (!item.requiresProduct || selectedProductId));

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
    makeVisual.mutate({ itemId: item.id, productId: selectedProductId, type });
  };

  return <section className="mt-5 rounded-2xl border border-[#dce8d5] bg-[#f8fbf5] p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="eyebrow">MAKE MY VISUAL</p>
        <h3 className="mt-1 font-serif text-2xl text-[#2d3c2e]">A complete post, not just a prompt.</h3>
        <p className="mt-1 max-w-xl text-sm leading-6 text-[#6b786b]">Use a real product when accuracy matters, or make a full carousel with relevant visual scenes for each slide.</p>
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
        <div className="grid gap-2 sm:col-span-2"><Label>Verified details <span className="font-normal text-[#879187]">(optional)</span></Label><Textarea value={details} onChange={event => setDetails(event.target.value)} placeholder="Only add facts you know are correct, such as colour, material, size, or order information." className="min-h-20 resize-none" /></div>
        <div className="sm:col-span-2"><Button onClick={addProduct} disabled={createProduct.isPending} className="rounded-xl bg-[#263327] hover:bg-[#3a4d3b]">{createProduct.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Save real product</Button></div>
      </div>}
    </div> : <div className="mt-5 rounded-xl border border-[#e0e9da] bg-white p-4"><p className="text-sm font-semibold text-[#3d4c3e]">This is a rich branded card set.</p><p className="mt-1 text-sm leading-6 text-[#788477]">No product image is needed. ViraSquare will turn the full structured content into complete, ready-to-post cards.</p></div>}

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {item.requiresProduct && <button type="button" disabled={!canMakeProductPost || makeVisual.isPending} onClick={() => beginVisual("single_post")} className={cn("rounded-xl border p-4 text-left transition-colors", canMakeProductPost ? "border-[#a8c493] bg-white hover:border-[#789c67]" : "cursor-not-allowed border-[#e2e8df] bg-[#f5f7f4] opacity-65")}><p className="text-sm font-semibold text-[#344738]">Make product post</p><p className="mt-1 text-xs leading-5 text-[#748174]">{selected ? `Use ${selected.name} with the facts you saved.` : item.preparationNote || "Choose a real product above first."}</p></button>}
      <button type="button" disabled={!canMakeCarousel || makeVisual.isPending} onClick={() => beginVisual("carousel")} className={cn("rounded-xl border p-4 text-left transition-colors", canMakeCarousel ? "border-[#a8c493] bg-white hover:border-[#789c67]" : "cursor-not-allowed border-[#e2e8df] bg-[#f5f7f4] opacity-65", !item.requiresProduct && "sm:col-span-2")}><p className="flex items-center gap-2 text-sm font-semibold text-[#344738]"><Layers3 className="h-4 w-4 text-[#71975f]" />Make complete card set</p><p className="mt-1 text-xs leading-5 text-[#748174]">Every card is structured, branded, and ready to review.</p></button>
    </div>
    {makeVisual.isPending && <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#eaf3e4] p-3 text-sm text-[#4e6b45]"><Loader2 className="h-4 w-4 animate-spin" />Making your complete visual set. This can take a short moment.</div>}
    {problem && <div role="alert" className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-[#efd4c6] bg-[#fff5f0] p-3 text-sm text-[#834e3d]"><p>{problem} You can try again, use a smaller image, or choose a different saved product.</p><button onClick={() => setProblem(null)} className="font-semibold underline">Dismiss</button></div>}

    {deliverable?.slides?.length > 0 && <div className="mt-5 border-t border-[#dfe9d9] pt-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div><p className="eyebrow">YOUR READY-TO-POST VISUALS</p><h4 className="mt-1 font-serif text-xl text-[#2e3c2e]">Review each slide before you post.</h4></div>
        <div className="flex items-center gap-2"><Button onClick={() => { setProblem(null); exportVisualSet.mutate({ deliverableId: deliverable.id }); }} disabled={exportVisualSet.isPending} variant="outline" className="rounded-xl border-[#b7cda9] bg-white text-[#43663a] hover:bg-[#eef6e9]">{exportVisualSet.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Download full set</Button><Sparkles className="h-5 w-5 text-[#71975f]" /></div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{deliverable.slides.map((slide: any) => <article key={slide.id ?? slide.slideNumber} className="overflow-hidden rounded-2xl border border-[#e0e8dd] bg-white"><div className="aspect-[4/5] bg-[#edf2e8]">{slide.assetUrl ? <img src={slide.assetUrl} alt={`Visual slide ${slide.slideNumber}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-[#789075]">Preparing slide…</div>}</div><div className="flex items-center justify-between gap-2 p-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#759166]">Slide {slide.slideNumber}</p><p className="mt-1 line-clamp-1 text-sm font-semibold text-[#405142]">{slide.heading}</p></div><div className="flex gap-1"><Button title="Refresh this slide" onClick={() => { setProblem(null); regenerate.mutate({ deliverableId: deliverable.id, slideNumber: slide.slideNumber }); }} disabled={regenerate.isPending} size="icon" variant="ghost" className="h-8 w-8 text-[#537a45]"><RefreshCw className={cn("h-4 w-4", regenerate.isPending && "animate-spin")} /></Button>{slide.assetUrl && <Button asChild title="Download slide" size="icon" variant="ghost" className="h-8 w-8 text-[#537a45]"><a href={slide.assetUrl} download={`virasquare-${slide.slideNumber}.png`}><Download className="h-4 w-4" /></a></Button>}</div></div></article>)}</div>
    </div>}
  </section>;
}
