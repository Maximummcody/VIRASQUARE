import { Check, ChevronsUpDown, Package, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { searchSavedProducts, type SearchableProduct } from "@/lib/productPicker";

type ProductPickerProps = {
  products: SearchableProduct[];
  value?: number;
  onChange: (productId: number | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
};

export function ProductPicker({ products, value, onChange, disabled = false, placeholder = "Choose a saved product", label = "Search saved products" }: ProductPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = useMemo(() => products.find(product => product.id === value), [products, value]);
  const matches = useMemo(() => searchSavedProducts(products, query), [products, query]);
  const selectProduct = (productId: number) => {
    onChange(productId);
    setQuery("");
    setOpen(false);
  };

  return <Popover open={open} onOpenChange={nextOpen => { setOpen(nextOpen); if (!nextOpen) setQuery(""); }}>
    <PopoverTrigger asChild>
      <Button type="button" variant="outline" disabled={disabled} role="combobox" aria-expanded={open} aria-label={label} className="mt-2 h-11 w-full justify-between rounded-xl border-[#d5e1d0] bg-white px-3 text-left font-normal text-[#334b32] hover:bg-[#f6faf2]">
        <span className="flex min-w-0 items-center gap-2">
          {selected?.imageUrl ? <img src={selected.imageUrl} alt="" className="h-6 w-6 shrink-0 rounded-md bg-[#eef4ea] object-contain" /> : <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#eef4ea] text-[#597852]"><Package className="h-3.5 w-3.5" /></span>}
          <span className={cn("truncate text-sm", !selected && "text-[#788477]")}>{selected ? selected.name : placeholder}</span>
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-[#6d8069]" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[17rem] rounded-2xl border-[#dce7d7] bg-[#fffefa] p-0 shadow-xl">
      <Command shouldFilter={false} className="rounded-2xl bg-transparent text-[#334b32]">
        <CommandInput value={query} onValueChange={setQuery} placeholder="Search product name or price…" className="text-[#334b32]" />
        <CommandList className="max-h-64">
          <CommandEmpty className="px-4 text-[#6e7c6c]">No saved product matches that search.</CommandEmpty>
          <CommandGroup heading={query ? "Matching products" : "Saved products"}>
            {matches.map(product => <CommandItem key={product.id} value={`${product.id}-${product.name}`} onSelect={() => selectProduct(product.id)} className="min-h-12 cursor-pointer rounded-xl px-3 py-2 text-[#334b32] aria-selected:bg-[#eef5e9]">
              {product.imageUrl ? <img src={product.imageUrl} alt="" className="h-8 w-8 rounded-lg bg-[#eef4ea] object-contain" /> : <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eef4ea] text-[#597852]"><Package className="h-4 w-4" /></span>}
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{product.name}</span><span className="block truncate text-xs text-[#738071]">{product.price ? `₦${product.price}` : "No price added"}</span></span>
              {value === product.id && <Check className="h-4 w-4 text-[#537a45]" />}
            </CommandItem>)}
          </CommandGroup>
        </CommandList>
      </Command>
      {selected && <button type="button" onClick={() => { onChange(undefined); setOpen(false); }} className="flex w-full items-center gap-2 border-t border-[#e1eadc] px-4 py-3 text-left text-xs font-semibold text-[#587052] hover:bg-[#f6faf2]"><Search className="h-3.5 w-3.5" />Choose a different product</button>}
    </PopoverContent>
  </Popover>;
}
