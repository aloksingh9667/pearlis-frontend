/**
 * Custom React Query hooks for admin-specific API endpoints
 * (settings, page-content, contact-messages) that are not in the
 * generated OpenAPI client.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "./apiUrl";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(`/api${path}`), {
    ...options,
    headers: { ...getAuthHeaders(), ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

export type PriceRange = { label: string; minINR: number; maxINR: number };
export type RingRow = { in: string; us: string; mm: string; inch: string };
export type BraceletRow = { label: string; wrist: string; fit: string };
export type NecklaceRow = { length: string; style: string; description: string };

export type SiteSettings = {
  branding: { siteName: string; tagline: string; logoUrl: string; faviconUrl: string };
  general: { siteName: string; tagline: string; currency: string; currencySymbol: string; conversionRate: number };
  announcement: { enabled: boolean; text: string; link: string };
  payment: {
    codEnabled: boolean;
    razorpayEnabled: boolean;
    razorpayMode: "test" | "live";
    razorpayKeyId: string;
    razorpayTestKeyId: string;
  };
  keepAlive: { enabled: boolean; intervalMinutes: number; pingUrl: string };
  lowStockAlert: { enabled: boolean; threshold: number; email: string };
  contact: { email: string; phone: string; address: string; hours: string; whatsapp: string };
  social: { instagram: string; facebook: string; twitter: string; pinterest: string; youtube: string };
  instagram: { enabled: boolean; username: string; posts: string[] };
  videos: Array<{ title: string; url: string; thumbnail: string }>;
  atelierVideo: string;
  flashSale: {
    enabled: boolean;
    title: string;
    subtitle: string;
    promoText: string;
    endsAt: string;
    code: string;
    ctaText: string;
    ctaLink: string;
  };
  homeSale: {
    enabled: boolean;
    badge: string;
    offerLine: string;
    subtitle: string;
    promoText: string;
    code: string;
    ctaText: string;
    ctaLink: string;
    endsAt: string;
  };
  shopFilters: {
    priceRanges: PriceRange[];
    materials: string[];
  };
  navbarCategories: {
    excludedSlugs: string[];
  };
  sizeGuide: {
    ringTip: string;
    ringWarnTip: string;
    braceletTip: string;
    braceletWarnTip: string;
    necklaceTip: string;
    ringRows: RingRow[];
    braceletRows: BraceletRow[];
    necklaceRows: NecklaceRow[];
  };
  emailNotifications: {
    orderConfirmation: boolean;
    orderStatusUpdate: boolean;
    returnStatusUpdate: boolean;
    stockAlert: boolean;
    otpVerification: boolean;
    passwordReset: boolean;
  };
  shipping: {
    freeCities: string;
    freeStates: string;
    minOrderFreeShipping: number;
    defaultCharge: number;
    freeCityDays: string;
    freeStateDays: string;
    paidDays: string;
    paidMessage: string;
  };
  newUserOffer: {
    enabled: boolean;
    discountType: "flat" | "percent" | "free_shipping";
    discountValue: number;
    message: string;
    validDays: number;
  };
};

export function useGetSettings() {
  return useQuery<SiteSettings>({
    queryKey: ["settings"],
    queryFn: () => apiFetch<SiteSettings>("/settings"),
    staleTime: 30_000,
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      apiFetch(`/settings/${key}`, { method: "PUT", body: JSON.stringify({ value }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

// ─── PAGE CONTENT ─────────────────────────────────────────────────────────────

export function useGetPageContent(page: string) {
  return useQuery<{ page: string; content: any }>({
    queryKey: ["page-content", page],
    queryFn: () => apiFetch(`/page-content/${page}`),
    staleTime: 30_000,
  });
}

export function useUpdatePageContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ page, content }: { page: string; content: any }) =>
      apiFetch(`/page-content/${page}`, { method: "PUT", body: JSON.stringify({ content }) }),
    onSuccess: (_data, { page }) => qc.invalidateQueries({ queryKey: ["page-content", page] }),
  });
}

// ─── CONTACT MESSAGES ─────────────────────────────────────────────────────────

export type ContactMessage = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  replied: boolean;
  repliedAt: string | null;
  adminReply: string | null;
  createdAt: string;
};

export type ContactMessagesResponse = {
  messages: ContactMessage[];
  total: number;
  unread: number;
  page: number;
  limit: number;
};

export function useGetContactMessages(params?: { page?: number; limit?: number }) {
  const qs = new URLSearchParams({
    page: String(params?.page || 1),
    limit: String(params?.limit || 50),
  }).toString();
  return useQuery<ContactMessagesResponse>({
    queryKey: ["contact-messages", params],
    queryFn: () => apiFetch<ContactMessagesResponse>(`/contact-messages?${qs}`),
  });
}

export function useSendContactMessage() {
  return useMutation({
    mutationFn: (data: { firstName: string; lastName: string; email: string; subject: string; message: string }) =>
      apiFetch("/contact-messages", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useMarkMessageRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isRead }: { id: number; isRead: boolean }) =>
      apiFetch(`/contact-messages/${id}`, { method: "PUT", body: JSON.stringify({ isRead }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact-messages"] }),
  });
}

export function useReplyToMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, replyText }: { id: number; replyText: string }) =>
      apiFetch(`/contact-messages/${id}/reply`, { method: "POST", body: JSON.stringify({ replyText }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact-messages"] }),
  });
}

export function useBulkReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, replyText }: { ids: number[]; replyText: string }) =>
      apiFetch("/contact-messages/bulk-reply", { method: "POST", body: JSON.stringify({ ids, replyText }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact-messages"] }),
  });
}
