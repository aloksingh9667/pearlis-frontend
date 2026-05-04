const API_ORIGIN = import.meta.env.VITE_API_URL ?? "";

export function apiUrl(path: string): string {
  return `${API_ORIGIN}${path}`;
}

export function adminHeaders(extra: Record<string, string> = {}): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}
