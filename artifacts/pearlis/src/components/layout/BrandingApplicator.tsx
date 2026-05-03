import { useEffect } from "react";
import { useGetSettings } from "@/lib/adminApi";

export function BrandingApplicator() {
  const { data: settings } = useGetSettings();

  useEffect(() => {
    const b = settings?.branding;
    const g = settings?.general;

    const name = b?.siteName || g?.siteName || "Pearlis";
    const tagline = b?.tagline || g?.tagline || "Fine Jewellery";

    document.title = `${name} — ${tagline}`;

    if (b?.faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = b.faviconUrl;
    }
  }, [settings]);

  return null;
}
