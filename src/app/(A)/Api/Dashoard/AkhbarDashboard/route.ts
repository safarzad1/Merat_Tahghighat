import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { getConnection } from "@/Lib/db";
import { verifyToken } from "@/Lib/auth";

function localGregorianDate(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function makeUtcDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function addDays(date: Date, days: number) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function persianDate(date: Date) {
  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  return `${get("year")}/${get("month")}/${get("day")}`;
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });

  try {
    verifyToken(token);
  } catch {
    return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ status: 400, error: "userId required" }, { status: 400 });

    const localYmd = localGregorianDate("Asia/Tehran");
    const todayDate = makeUtcDate(localYmd);
    const yesterdayDate = addDays(todayDate, -1);
    const dayOfWeek = todayDate.getUTCDay();
    const daysFromSaturday = (dayOfWeek + 1) % 7;
    const weekStartDate = addDays(todayDate, -daysFromSaturday);

    const today = persianDate(todayDate);
    const yesterday = persianDate(yesterdayDate);
    const weekStart = persianDate(weekStartDate);

    const pool = await getConnection();
    const result = await pool
      .request()
      .input("UserId", sql.BigInt, userId)
      .input("Today", sql.NChar(10), today)
      .input("Yesterday", sql.NChar(10), yesterday)
      .input("WeekStart", sql.NChar(10), weekStart)
      .execute("Dashboard.SP_AkhbarDashboard");

    const sets = (result.recordsets || []) as any[];
    return NextResponse.json({
      status: 200,
      dates: { today, yesterday, weekStart },
      summary: sets[0]?.[0] || {},
      stats: sets[1] || [],
      trend: sets[2] || [],
      todayNews: sets[3] || [],
      yesterdayNews: sets[4] || [],
      weekNews: sets[5] || [],
    });
  } catch (err) {
    return NextResponse.json(
      { status: 500, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
