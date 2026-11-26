"use client";

import { useState } from "react";
import { ShieldCheck, CreditCard, Lock, CheckCircle2, Loader2, X } from "lucide-react";
import { formatToman } from "@/lib/constants";

interface PaymentGatewayModalProps {
  open: boolean;
  title: string;
  subtitle: string;
  planName: string;
  amountToman: number;
  loading: boolean;
  onClose: () => void;
  onConfirmPayment: () => Promise<void>;
}

export function PaymentGatewayModal({
  open,
  title,
  subtitle,
  planName,
  amountToman,
  loading,
  onClose,
  onConfirmPayment,
}: PaymentGatewayModalProps) {
  const [cardNumber, setCardNumber] = useState("6037 - 9974 - 1284 - 5509");
  const [cvv2, setCvv2] = useState("482");
  const [expiry, setExpiry] = useState("08/06");
  const [otp, setOtp] = useState("749215");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Gateway Bar */}
        <div className="bg-gradient-to-l from-indigo-900 to-indigo-700 text-white p-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
              <span>درگاه پرداخت امن شاپرک / زرین‌پال (شبیه‌ساز)</span>
            </div>
            <h3 className="text-lg font-extrabold">{title}</h3>
            <p className="text-xs text-indigo-100">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white/75 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Summary */}
        <div className="p-6 space-y-5">
          <div className="rounded-2xl bg-[#FAF9F6] border border-[#E7E5DE] p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">خدمت انتخابی</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{planName}</div>
            </div>
            <div className="text-left">
              <div className="text-xs text-slate-500">مبلغ قابل پرداخت</div>
              <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
                {formatToman(amountToman)}
              </div>
            </div>
          </div>

          {/* Card Form (Pre-filled for instant testing) */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                شماره کارت بانکی (کارت آزمایشی آماده پرداخت)
              </label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pl-10 text-sm font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                />
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  CVV2
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={cvv2}
                  onChange={(e) => setCvv2(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono text-center focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  انقضا
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono text-center focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  رمز پویا
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono text-center focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              این درگاه برای تست کامل فرایند پرداخت، صدور کد رهگیری در دیتابیس و فعال‌سازی
              فوری ایده یا عضویت سرمایه‌گذار شبیه‌سازی شده است.
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onConfirmPayment}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm transition-colors shadow-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال تأیید تراکنش و پردازش AI...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>پرداخت و تکمیل آنی ({formatToman(amountToman)})</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold cursor-pointer"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
