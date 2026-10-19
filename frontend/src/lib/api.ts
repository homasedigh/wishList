export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export type WishlistItem = {
  id: number; title: string; productUrl: string; imageUrl?: string | null; price?: number | null;
  currency: string; note?: string | null; reserved: boolean; createdAt?: string;
};
export type Wishlist = {
  id: number; title: string; description?: string | null; shareToken: string;
  visibility: "PRIVATE" | "LINK" | "PUBLIC"; giftList: boolean; items: WishlistItem[]; createdAt?: string;
};
export type User = { id: number; name: string; email: string };

export async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    cache: "no-store"
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { const body = await response.json(); message = body.message || body.error || message; } catch {}
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
