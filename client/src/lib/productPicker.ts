export type SearchableProduct = {
  id: number;
  name: string;
  price?: string | number | null;
  imageUrl?: string | null;
};

export function searchSavedProducts(products: SearchableProduct[], query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return products;
  return products.filter(product => `${product.name} ${product.price ?? ""}`.toLocaleLowerCase().includes(normalized));
}
