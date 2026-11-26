"use client";

import { useEffect, useState } from "react";
import { Store, X } from "lucide-react";

export function PrestaShopBanner() {
  const [visible, setVisible] = useState(false);
  const [refCode, setRefCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("source");
    const ref = params.get("ref") || params.get("product");
    if (source === "prestashop") {
      setVisible(true);
      if (ref) setRefCode(ref);
      try {
        sessionStorage.setItem("idehpol_source", "prestashop");
        if (ref) sessionStorage.setItem("idehpol_ps_ref", ref);
      } catch {}
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-indigo-950 text-white text-xs sm:text-sm py-2.5 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Store className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            خوش آمدید! شما از طریق فروشگاه <strong>پرستاشاپ</strong> به پلتفرم هوشمند ایده‌پل متصل شدید.
            {refCode && (
              <span className="mr-2 px-2 py-0.5 rounded bg-white/10 text-emerald-300 font-mono text-xs" dir="ltr">
                Ref: {refCode}
              </span>
            )}
          </span>
        </div>
        <button
          onClick={() => setVisible(false)}
          aria-label="بستن"
          className="text-white/70 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
