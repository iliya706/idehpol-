export const IDEA_CATEGORIES = [
  "هوش مصنوعی و نرم‌افزار",
  "کشاورزی هوشمند",
  "سلامت و تجهیزات پزشکی",
  "فناوری آموزشی",
  "انرژی پاک و محیط زیست",
  "فین‌تک و تجارت الکترونیک",
  "سخت‌افزار و اینترنت اشیا",
] as const;

export type IdeaCategory = (typeof IDEA_CATEGORIES)[number];

export const STAGE_LABELS: Record<string, { label: string; description: string; badgeClass: string }> = {
  concept: {
    label: "ایده و طرح اولیه",
    description: "طرح تجاری آماده است و نیاز به ساخت نمونه اولیه دارد",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  prototype: {
    label: "نمونه اولیه (Prototype)",
    description: "نمونه فنی اولیه ساخته و تست آزمایشگاهی شده است",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  mvp: {
    label: "محصول کمینه (MVP)",
    description: "نسخه قابل استفاده آماده است و کاربران اولیه دارد",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  growth: {
    label: "آماده تولید انبوه و رشد",
    description: "فروش اولیه ثبت شده و آماده توسعه بازار است",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
};

export const FUNDING_STATUS_LABELS: Record<
  string,
  { label: string; dotClass: string; badgeClass: string }
> = {
  unfunded: {
    label: "بدون سرمایه‌گذار (آماده مچ)",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  negotiating: {
    label: "در حال مذاکره هوشمند",
    dotClass: "bg-indigo-500",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  funded: {
    label: "سرمایه‌گذار پیدا شد ✓",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
};

export const MATCH_STATUS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  suggested: {
    label: "پیشنهاد هوش مصنوعی",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  interested: {
    label: "علاقه‌مندی ثبت شده",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
  meeting_requested: {
    label: "درخواست جلسه مذاکره",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  funded: {
    label: "تأیید سرمایه‌گذاری ✓",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  declined: {
    label: "رد شده",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export const IDEA_LISTING_PLANS = [
  {
    id: "standard" as const,
    name: "ثبت ایده استاندارد",
    priceToman: 390_000,
    badge: "محبوب جوانان",
    description: "انتشار دائمی محصول در کاتالوگ ایده‌ها و ورود خودکار به موتور مچ هوش مصنوعی",
    features: [
      "انتشار صفحه اختصاصی محصول با لینک مستقیم",
      "ورود به صف تطبیق هوش مصنوعی با کارفرمایان عضو",
      "محاسبه امتیاز آمادگی سرمایه‌پذیری (AI Score)",
      "امکان اتصال مستقیم لینک محصول به پرستاشاپ",
    ],
  },
  {
    id: "featured" as const,
    name: "ثبت ویژه + معرفی اولویت‌دار AI",
    priceToman: 790_000,
    badge: "بیشترین نرخ جذب سرمایه",
    description: "نمایش در صدر کاتالوگ، گزارش جامع آمادگی و ارسال مستقیم به سرمایه‌گذاران هم‌تراز",
    features: [
      "تمام امکانات پلن استاندارد",
      "نشان «ایده برگزیده» و نمایش در صفحه نخست",
      "اولویت اول در پیشنهادهای موتور هوش مصنوعی",
      "گزارش تخصصی نقاط قوت و ریسک سرمایه‌گذاری",
    ],
  },
];

export const INVESTOR_MEMBERSHIP_PLANS = [
  {
    id: "starter" as const,
    name: "عضویت کارفرمای پایه",
    priceToman: 1_900_000,
    durationLabel: "۳ ماهه",
    badge: "شروع هوشمند",
    description: "مناسب کارفرمایان و سرمایه‌گذاران فرشته برای کشف ایده‌های نوآورانه",
    features: [
      "دسترسی کامل به جزئیات فنی و مالی تمام ایده‌ها",
      "تطبیق هوشمند AI تا ۱۰ ایده برتر در ماه",
      "مشاهده شماره تماس و ارسال درخواست جلسه",
      "پنل مدیریت مذاکرات و پیشنهادها",
    ],
  },
  {
    id: "pro" as const,
    name: "عضویت سرمایه‌گذار حرفه‌ای",
    priceToman: 4_500_000,
    durationLabel: "۶ ماهه",
    badge: "پیشنهاد ایده‌پل",
    description: "مناسب مدیران کسب‌وکار، شتاب‌دهنده‌ها و سرمایه‌گذاران فعال",
    features: [
      "تطبیق نامحدود هوش مصنوعی با الگوریتم چندمعیاره",
      "گزارش تحلیلی ریسک و هم‌افزایی برای هر ایده",
      "اولویت دسترسی به ایده‌های بدون سرمایه‌گذار جدید",
      "نشان «سرمایه‌گذار تأییدشده» برای افزایش اعتماد جوانان",
    ],
  },
  {
    id: "enterprise" as const,
    name: "عضویت سازمانی و هلدینگ‌ها",
    priceToman: 9_800_000,
    durationLabel: "سالانه",
    badge: "ویژه سازمان‌ها",
    description: "مناسب صندوق‌های VC، هلدینگ‌ها و فروشگاه‌های بزرگ پرستاشاپی",
    features: [
      "تمام امکانات پلن حرفه‌ای به‌صورت سالانه",
      "تعریف چندین حوزه و بودجه سرمایه‌گذاری اختصاصی",
      "پشتیبانی اتصال مستقیم به فروشگاه پرستاشاپ شما",
      "دسترسی زودهنگام به ایده‌های ثبت‌شده پیش از انتشار عمومی",
    ],
  },
];

export const COVER_IMAGE_PRESETS = [
  {
    label: "فناوری آموزشی و دیجیتال",
    url: "/images/idea-edtech.png",
  },
  {
    label: "انرژی پاک و سخت‌افزار مدرن",
    url: "/images/idea-cleantech.png",
  },
  {
    label: "کشاورزی هوشمند و گلخانه",
    url: "https://images.pexels.com/photos/40991862/pexels-photo-40991862.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  },
  {
    label: "سلامت دیجیتال و گجت پزشکی",
    url: "https://images.pexels.com/photos/19961776/pexels-photo-19961776.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  },
  {
    label: "سخت‌افزار، برد الکترونیکی و IoT",
    url: "https://images.pexels.com/photos/3912367/pexels-photo-3912367.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  },
  {
    label: "چاپ سه‌بعدی و تولید هوشمند",
    url: "https://images.pexels.com/photos/20552667/pexels-photo-20552667.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  },
];

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

export function formatToman(amount: number): string {
  const formatted = new Intl.NumberFormat("en-US").format(Math.round(amount));
  return `${toPersianDigits(formatted)} تومان`;
}

export function formatShortToman(amount: number): string {
  if (amount >= 1_000_000_000) {
    const billions = amount / 1_000_000_000;
    const str = Number.isInteger(billions) ? billions.toString() : billions.toFixed(1);
    return `${toPersianDigits(str)} میلیارد تومان`;
  }
  if (amount >= 1_000_000) {
    const millions = Math.round(amount / 1_000_000);
    return `${toPersianDigits(millions)} میلیون تومان`;
  }
  return formatToman(amount);
}

export function generateTrackingCode(prefix = "IDP"): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-1404-${rand}`;
}

export function generateSlug(title: string): string {
  const cleaned = title
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 48);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${cleaned || "idea"}-${suffix}`;
}
