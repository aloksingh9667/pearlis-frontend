import { useEffect, useState } from "react";

const KEY = "pearlis_recently_viewed";
const MAX = 10;

export interface RecentProduct {
  id: number;
  name: string;
  price: number;
  discountPrice?: number | null;
  images: string[];
  category?: string | null;
}

export function load(): RecentProduct[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function save(items: RecentProduct[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}

export function useRecentlyViewed(currentId?: number) {
  const [items, setItems] = useState<RecentProduct[]>(() =>
    load().filter((p) => p.id !== currentId)
  );

  return items;
}

export function recordView(product: RecentProduct) {
  const existing = load();
  const filtered = existing.filter((p) => p.id !== product.id);
  const updated = [product, ...filtered].slice(0, MAX);
  save(updated);
}
