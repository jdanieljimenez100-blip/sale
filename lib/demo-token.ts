export const DEMO_TOKEN_STORAGE_KEY = "sale_demo_token";

export function getStoredDemoToken(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(DEMO_TOKEN_STORAGE_KEY) ?? "";
}

export function storeDemoToken(token: string): void {
  window.localStorage.setItem(DEMO_TOKEN_STORAGE_KEY, token);
}
