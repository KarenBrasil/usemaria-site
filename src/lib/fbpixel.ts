declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "907187875503640";

export function fbEvent(name: string, params?: Record<string, unknown>) {
  window.fbq?.("track", name, params);
}
