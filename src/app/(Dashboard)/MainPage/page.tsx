"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { AkhbarDashboard, MainDashboardOverview } from "@/Lib/ApiServiceDahboard";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Clipboard,
  FileCheck2,
  Newspaper,
  RefreshCw,
  RotateCcw,
  SearchCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Summary = {
  ScopeTitle?: string;
  AccessLevel?: string;
  TotalCount?: number;
  TodayCount?: number;
  YesterdayCount?: number;
  WeekCount?: number;
  ReturnedCount?: number;
};

type Overview = {
  AccessLevel?: string;
  NewsCount?: number;
  ResearchCount?: number;
  CandidateCount?: number;
  CoworkerCount?: number;
  QualificationCount?: number;
};

type StatRow = {
  Mahal: number;
  MahalName: string;
  TotalCount: number;
  TodayCount: number;
  YesterdayCount: number;
  WeekCount: number;
};

type TrendRow = { Tarikh: string; CountKhabar: number };

type NewsRow = {
  ShomareKhabar: number;
  OnvanKhabar: string;
  CreateDateTime: string;
  MahalName: string;
  CreateUserName: string;
  TabaqehBandiName: string;
  CurrentStatusName: string;
};

type TabKey = "akhbar" | "tahghighat" | "davtalaban" | "hamkaran" | "salahiyat";

type Tone = {
  border: string;
  soft: string;
  softHover: string;
  icon: string;
  iconActive: string;
  text: string;
  active: string;
  dot: string;
};

const toFa = (value: number | string | null | undefined) =>
  Number(value || 0).toLocaleString("fa-IR");

const tones: Record<TabKey, Tone> = {
  akhbar: {
    border: "border-blue-200",
    soft: "bg-blue-50",
    softHover: "hover:bg-blue-50/70",
    icon: "bg-blue-50 text-blue-700 ring-blue-100",
    iconActive: "bg-blue-600 text-white ring-blue-500/20",
    text: "text-blue-700",
    active: "border-blue-300 bg-blue-50 shadow-[0_6px_18px_rgba(37,99,235,0.10)]",
    dot: "bg-blue-500",
  },
  tahghighat: {
    border: "border-violet-200",
    soft: "bg-violet-50",
    softHover: "hover:bg-violet-50/70",
    icon: "bg-violet-50 text-violet-700 ring-violet-100",
    iconActive: "bg-violet-600 text-white ring-violet-500/20",
    text: "text-violet-700",
    active: "border-violet-300 bg-violet-50 shadow-[0_6px_18px_rgba(124,58,237,0.10)]",
    dot: "bg-violet-500",
  },
  davtalaban: {
    border: "border-amber-200",
    soft: "bg-amber-50",
    softHover: "hover:bg-amber-50/70",
    icon: "bg-amber-50 text-amber-700 ring-amber-100",
    iconActive: "bg-amber-500 text-white ring-amber-500/20",
    text: "text-amber-700",
    active: "border-amber-300 bg-amber-50 shadow-[0_6px_18px_rgba(245,158,11,0.10)]",
    dot: "bg-amber-500",
  },
  hamkaran: {
    border: "border-cyan-200",
    soft: "bg-cyan-50",
    softHover: "hover:bg-cyan-50/70",
    icon: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    iconActive: "bg-cyan-600 text-white ring-cyan-500/20",
    text: "text-cyan-700",
    active: "border-cyan-300 bg-cyan-50 shadow-[0_6px_18px_rgba(8,145,178,0.10)]",
    dot: "bg-cyan-500",
  },
  salahiyat: {
    border: "border-emerald-200",
    soft: "bg-emerald-50",
    softHover: "hover:bg-emerald-50/70",
    icon: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    iconActive: "bg-emerald-600 text-white ring-emerald-500/20",
    text: "text-emerald-700",
    active: "border-emerald-300 bg-emerald-50 shadow-[0_6px_18px_rgba(5,150,105,0.10)]",
    dot: "bg-emerald-500",
  },
};

function OverviewCard({
  tabKey,
  title,
  value,
  icon,
  active,
  onClick,
}: {
  tabKey: TabKey;
  title: string;
  value: number;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  const tone = tones[tabKey];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-xl border px-3 py-2 text-right transition-all duration-200 cursor-pointer min-h-[58px] ${
        active ? tone.active : `border-slate-200 bg-white ${tone.softHover} hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-sm`
      }`}
    >
      <span className={`absolute inset-y-0 right-0 w-1 ${tone.dot}`} />
      <div className="flex items-center gap-2.5 pr-1">
        <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ring-1 transition ${active ? tone.iconActive : tone.icon}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] leading-4 text-slate-500 truncate">{title}</div>
          <div className={`text-[19px] leading-5 mt-0.5 ${active ? tone.text : "text-slate-800"}`}>{toFa(value)}</div>
        </div>
      </div>
    </button>
  );
}

function NewsStatCard({
  title,
  value,
  icon,
  hint,
  tone,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  hint?: string;
  tone: "blue" | "emerald" | "slate" | "violet" | "rose";
}) {
  const palette = {
    blue: {
      card: "border-blue-200 bg-gradient-to-l from-blue-50/90 to-white",
      icon: "bg-blue-100 text-blue-700",
      value: "text-blue-700",
      line: "bg-blue-500",
    },
    emerald: {
      card: "border-emerald-200 bg-gradient-to-l from-emerald-50/90 to-white",
      icon: "bg-emerald-100 text-emerald-700",
      value: "text-emerald-700",
      line: "bg-emerald-500",
    },
    slate: {
      card: "border-slate-200 bg-gradient-to-l from-slate-100/80 to-white",
      icon: "bg-slate-200 text-slate-700",
      value: "text-slate-700",
      line: "bg-slate-500",
    },
    violet: {
      card: "border-violet-200 bg-gradient-to-l from-violet-50/90 to-white",
      icon: "bg-violet-100 text-violet-700",
      value: "text-violet-700",
      line: "bg-violet-500",
    },
    rose: {
      card: "border-rose-200 bg-gradient-to-l from-rose-50/90 to-white",
      icon: "bg-rose-100 text-rose-700",
      value: "text-rose-700",
      line: "bg-rose-500",
    },
  }[tone];

  return (
    <div className={`relative overflow-hidden rounded-xl border px-3 py-2 min-h-[58px] ${palette.card}`}>
      <span className={`absolute inset-y-0 right-0 w-1 ${palette.line}`} />
      <div className="flex items-center justify-between gap-2 pr-1">
        <div className="min-w-0">
          <div className="text-[10px] text-slate-500 leading-4 truncate">{title}</div>
          <div className="flex items-end gap-2">
            <span className={`text-[19px] leading-5 ${palette.value}`}>{toFa(value)}</span>
            {hint && <span className="text-[8px] text-slate-400 pb-0.5 truncate">{hint}</span>}
          </div>
        </div>
        <div className={`h-7 w-7 shrink-0 rounded-lg flex items-center justify-center ${palette.icon}`}>{icon}</div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  tone = "blue",
}: {
  title: string;
  subtitle?: string;
  tone?: "blue" | "emerald" | "violet";
}) {
  const palette = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    violet: "bg-violet-500",
  }[tone];

  return (
    <div className="h-9 px-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/55">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`h-4 w-1 rounded-full ${palette}`} />
        <h2 className="text-[11px] text-slate-800 whitespace-nowrap">{title}</h2>
      </div>
      {subtitle && <span className="text-[8px] text-slate-400 truncate">{subtitle}</span>}
    </div>
  );
}

function NewsList({
  title,
  items,
  emptyText,
  tone,
}: {
  title: string;
  items: NewsRow[];
  emptyText: string;
  tone: "emerald" | "slate" | "violet";
}) {
  const palette = {
    emerald: {
      border: "border-emerald-200/80",
      header: "bg-emerald-50/65",
      dot: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    slate: {
      border: "border-slate-200",
      header: "bg-slate-50/80",
      dot: "bg-slate-500",
      badge: "bg-slate-100 text-slate-600 border-slate-200",
    },
    violet: {
      border: "border-violet-200/80",
      header: "bg-violet-50/65",
      dot: "bg-violet-500",
      badge: "bg-violet-50 text-violet-700 border-violet-100",
    },
  }[tone];

  return (
    <section className={`rounded-xl border ${palette.border} bg-white overflow-hidden min-h-[205px] shadow-[0_3px_14px_rgba(15,23,42,0.04)]`}>
      <div className={`h-9 px-3 border-b border-slate-100 flex items-center justify-between ${palette.header}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2 w-2 rounded-full ${palette.dot}`} />
          <h3 className="text-[11px] text-slate-800 truncate">{title}</h3>
        </div>
        <span className="text-[8px] text-slate-500">{toFa(items.length)} مورد اخیر</span>
      </div>
      <div className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <div className="h-[158px] flex items-center justify-center text-[9px] text-slate-400 px-4 text-center">{emptyText}</div>
        ) : (
          items.map((item) => (
            <div key={`${title}-${item.ShomareKhabar}`} className="px-3 py-1.5 hover:bg-slate-50/80 transition">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] leading-5 text-slate-800 truncate" title={item.OnvanKhabar}>{item.OnvanKhabar}</div>
                  <div className="flex gap-2 text-[8px] leading-4 text-slate-500 overflow-hidden">
                    <span className="shrink-0">خبر {toFa(item.ShomareKhabar)}</span>
                    <span className="truncate">{item.MahalName || "—"}</span>
                    <span className="shrink-0">{item.CreateDateTime || "—"}</span>
                  </div>
                </div>
                <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[7px] max-w-[118px] truncate ${palette.badge}`}>
                  {item.CurrentStatusName || "در حال گردش"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

const tabs: Array<{ key: TabKey; title: string; icon: React.ReactNode }> = [
  { key: "akhbar", title: "اخبار", icon: <Newspaper size={15} /> },
  { key: "tahghighat", title: "تحقیقات", icon: <Clipboard size={15} /> },
  { key: "davtalaban", title: "داوطلبان", icon: <UserRoundCheck size={15} /> },
  { key: "hamkaran", title: "اشخاص همکار", icon: <UsersRound size={15} /> },
  { key: "salahiyat", title: "خلاصه صلاحیت", icon: <BadgeCheck size={15} /> },
];

export default function MainPage() {
  const user = useSelector((state: RootState) => state.user);
  const rehydrated = useSelector((state: RootState) => state._persist?.rehydrated);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>("akhbar");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<Overview>({});
  const [summary, setSummary] = useState<Summary>({});
  const [stats, setStats] = useState<StatRow[]>([]);
  const [trend, setTrend] = useState<TrendRow[]>([]);
  const [todayNews, setTodayNews] = useState<NewsRow[]>([]);
  const [yesterdayNews, setYesterdayNews] = useState<NewsRow[]>([]);
  const [weekNews, setWeekNews] = useState<NewsRow[]>([]);
  const [dates, setDates] = useState({ today: "", yesterday: "", weekStart: "" });

  const loadDashboard = async () => {
    if (!user?.UserId) return;
    try {
      setLoading(true);
      setError("");

      const [newsRes, overviewRes] = await Promise.all([
        AkhbarDashboard(user.UserId),
        MainDashboardOverview(user.UserId),
      ]);

      if (newsRes?.status === 401 || overviewRes?.status === 401) {
        router.push("/Login");
        return;
      }
      if (newsRes?.status !== 200) throw new Error(newsRes?.error || "خطا در دریافت داشبورد اخبار");
      if (overviewRes?.status !== 200) throw new Error(overviewRes?.error || "خطا در دریافت نمای کلی داشبورد");

      setOverview(overviewRes.data || {});
      setSummary(newsRes.summary || {});
      setStats(newsRes.stats || []);
      setTrend(newsRes.trend || []);
      setTodayNews(newsRes.todayNews || []);
      setYesterdayNews(newsRes.yesterdayNews || []);
      setWeekNews(newsRes.weekNews || []);
      setDates(newsRes.dates || { today: "", yesterday: "", weekStart: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در دریافت اطلاعات داشبورد");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!rehydrated || !user?.UserId) return;
    loadDashboard();
  }, [rehydrated, user?.UserId]);

  const chartData = useMemo(
    () => trend.map((x) => ({ ...x, label: x.Tarikh?.slice(5) || x.Tarikh })),
    [trend]
  );

  const overviewCards = [
    { key: "akhbar" as TabKey, title: "اخبار", value: Number(overview.NewsCount || 0), icon: <Newspaper size={16} /> },
    { key: "tahghighat" as TabKey, title: "تحقیقات", value: Number(overview.ResearchCount || 0), icon: <SearchCheck size={16} /> },
    { key: "davtalaban" as TabKey, title: "داوطلبان", value: Number(overview.CandidateCount || 0), icon: <UserRoundCheck size={16} /> },
    { key: "hamkaran" as TabKey, title: "اشخاص همکار", value: Number(overview.CoworkerCount || 0), icon: <UsersRound size={16} /> },
    { key: "salahiyat" as TabKey, title: "خلاصه صلاحیت", value: Number(overview.QualificationCount || 0), icon: <FileCheck2 size={16} /> },
  ];

  if (!rehydrated || loading) {
    return (
      <div className="p-3 md:p-4 bg-slate-50 min-h-[calc(100vh-120px)]" dir="rtl">
        <div className="h-8 rounded-lg bg-slate-100 animate-pulse mb-2" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[58px] rounded-xl bg-white border border-slate-200 animate-pulse" />)}
        </div>
        <div className="flex gap-2">
          <div className="hidden xl:block w-[170px] h-72 rounded-xl bg-white border border-slate-200 animate-pulse" />
          <div className="flex-1 h-[410px] rounded-xl bg-white border border-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <main className="p-2.5 md:p-4 bg-[#f7f9fc] min-h-[calc(100vh-120px)]" dir="rtl">
      <div className="max-w-[1760px] mx-auto space-y-2.5">
        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[9px] text-rose-700">{error}</div>}

        <section>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 px-0.5">
            <div className="flex items-center gap-2 text-[9px] text-slate-500">
              <Activity size={11} className="text-blue-500" /> نمای کلی موضوعات در محدوده دسترسی شما
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={loadDashboard} className="h-7 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 text-[9px] flex items-center gap-1 cursor-pointer transition">
                <RefreshCw size={11} /> بروزرسانی
              </button>
              {activeTab === "akhbar" && (
                <Link href="/AkhbarManage" className="h-7 px-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-[9px] flex items-center gap-1 shadow-sm transition">
                  مدیریت اخبار <ArrowLeft size={11} />
                </Link>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
            {overviewCards.map((card) => (
              <OverviewCard
                key={card.key}
                tabKey={card.key}
                title={card.title}
                value={card.value}
                icon={card.icon}
                active={activeTab === card.key}
                onClick={() => setActiveTab(card.key)}
              />
            ))}
          </div>
        </section>

        <div className="flex flex-col xl:flex-row gap-2.5 items-start">
          <aside className="w-full xl:w-[170px] shrink-0 rounded-xl border border-slate-200 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)] p-1.5 xl:sticky xl:top-3">
            <div className="hidden xl:flex items-center gap-1.5 px-2 pb-1.5 pt-0.5 text-[8px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> موضوعات داشبورد
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 xl:grid-cols-1 gap-1">
              {tabs.map((tab) => {
                const active = activeTab === tab.key;
                const tone = tones[tab.key];
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative overflow-hidden h-9 rounded-lg px-2 flex items-center gap-2 text-[9px] border transition cursor-pointer ${
                      active ? `${tone.active} ${tone.text}` : `border-transparent text-slate-600 bg-white ${tone.softHover}`
                    }`}
                  >
                    <span className={`absolute inset-y-1 right-0 w-0.5 rounded-full ${active ? tone.dot : "bg-transparent"}`} />
                    <span className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${active ? tone.iconActive : tone.icon}`}>{tab.icon}</span>
                    <span className="truncate">{tab.title}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="min-w-0 flex-1 w-full">
            {activeTab === "akhbar" ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
                  <NewsStatCard title="کل اخبار" value={Number(summary.TotalCount || 0)} icon={<Newspaper size={14} />} tone="blue" />
                  <NewsStatCard title="امروز" value={Number(summary.TodayCount || 0)} hint={dates.today} icon={<CalendarDays size={14} />} tone="emerald" />
                  <NewsStatCard title="دیروز" value={Number(summary.YesterdayCount || 0)} hint={dates.yesterday} icon={<CalendarClock size={14} />} tone="slate" />
                  <NewsStatCard title="این هفته" value={Number(summary.WeekCount || 0)} hint={dates.weekStart ? `از ${dates.weekStart}` : undefined} icon={<CalendarRange size={14} />} tone="violet" />
                  <NewsStatCard title="برگشت برای اصلاح" value={Number(summary.ReturnedCount || 0)} icon={<RotateCcw size={14} />} tone="rose" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-2.5">
                  <section className="rounded-xl border border-blue-100 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)] overflow-hidden">
                    <SectionHeader title="آمار اخبار به تفکیک محدوده" subtitle="سطح شما و تمام زیرمجموعه‌های قابل مشاهده" tone="blue" />
                    <div className="max-h-[240px] overflow-auto">
                      <table className="w-full text-[9px] text-right border-collapse">
                        <thead className="sticky top-0 bg-blue-50/80 text-slate-500 z-10 backdrop-blur-sm">
                          <tr>
                            <th className="px-2.5 py-1.5 font-normal">محدوده</th>
                            <th className="px-2.5 py-1.5 font-normal text-center">کل</th>
                            <th className="px-2.5 py-1.5 font-normal text-center text-emerald-700">امروز</th>
                            <th className="px-2.5 py-1.5 font-normal text-center">دیروز</th>
                            <th className="px-2.5 py-1.5 font-normal text-center text-violet-700">این هفته</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {stats.length === 0 ? (
                            <tr><td colSpan={5} className="h-32 text-center text-slate-400">آماری برای نمایش وجود ندارد</td></tr>
                          ) : stats.map((row, index) => (
                            <tr key={`${row.Mahal}-${row.MahalName}`} className={`hover:bg-blue-50/45 h-7 transition ${index % 2 === 1 ? "bg-slate-50/35" : "bg-white"}`}>
                              <td className="px-2.5 py-1 text-slate-700 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" />{row.MahalName}</span>
                              </td>
                              <td className="px-2.5 py-1 text-center text-slate-700">{toFa(row.TotalCount)}</td>
                              <td className="px-2.5 py-1 text-center text-emerald-700 bg-emerald-50/35">{toFa(row.TodayCount)}</td>
                              <td className="px-2.5 py-1 text-center text-slate-600">{toFa(row.YesterdayCount)}</td>
                              <td className="px-2.5 py-1 text-center text-violet-700 bg-violet-50/30">{toFa(row.WeekCount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="rounded-xl border border-violet-100 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)] overflow-hidden">
                    <SectionHeader title="روند اخبار هفته جاری" subtitle="تعداد خبر بر اساس تاریخ ایجاد" tone="violet" />
                    <div className="h-[240px] p-2.5 bg-gradient-to-b from-violet-50/25 to-white">
                      {chartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-[9px] text-slate-400">در این هفته خبری ثبت نشده است</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 10, right: 2, left: 2, bottom: 2 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ede9fe" />
                            <XAxis dataKey="label" tick={{ fontSize: 8, fill: "#64748b" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 8, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                            <Tooltip
                              formatter={(value: any) => [toFa(Number(value)), "تعداد خبر"]}
                              labelFormatter={(label) => `تاریخ ${label}`}
                              contentStyle={{ fontFamily: "Shabnam", fontSize: 9, borderRadius: 10, borderColor: "#ddd6fe", boxShadow: "0 8px 24px rgba(15,23,42,.08)" }}
                            />
                            <Bar dataKey="CountKhabar" name="تعداد خبر" fill="#7c3aed" radius={[5, 5, 0, 0]} maxBarSize={38} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </section>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                  <NewsList title="اخبار امروز" items={todayNews} emptyText="امروز خبری در محدوده شما ثبت نشده است" tone="emerald" />
                  <NewsList title="اخبار دیروز" items={yesterdayNews} emptyText="دیروز خبری در محدوده شما ثبت نشده است" tone="slate" />
                  <NewsList title="اخبار این هفته" items={weekNews} emptyText="در هفته جاری خبری در محدوده شما ثبت نشده است" tone="violet" />
                </div>
              </div>
            ) : (
              <div className={`rounded-xl border min-h-[345px] flex items-center justify-center px-4 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)] ${tones[activeTab].border}`}>
                <div className="text-center">
                  <div className={`h-10 w-10 mx-auto rounded-xl flex items-center justify-center mb-2 ring-1 ${tones[activeTab].icon}`}>
                    {tabs.find((x) => x.key === activeTab)?.icon}
                  </div>
                  <div className={`text-sm ${tones[activeTab].text}`}>{tabs.find((x) => x.key === activeTab)?.title}</div>
                  <div className="text-[9px] text-slate-400 mt-1">تب آماده است؛ جزئیات این بخش در مرحله بعد تکمیل می‌شود.</div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
