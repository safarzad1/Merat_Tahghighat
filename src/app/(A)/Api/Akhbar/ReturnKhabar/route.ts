import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { getConnection } from "@/Lib/db";
import { verifyToken } from "@/Lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });
  try { verifyToken(token); } catch { return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 }); }

  try {
    const { shomareKhabar, userId, tozihat, eshkalatIds = "" } = await req.json();
    if (!shomareKhabar || !userId || !String(tozihat || "").trim()) {
      return NextResponse.json({ error: "شماره خبر، کاربر و توضیح برگشت الزامی است." }, { status: 400 });
    }
    const pool = await getConnection();
    const result = await pool.request()
      .input("ShomareKhabar", sql.BigInt, shomareKhabar)
      .input("UserId", sql.BigInt, userId)
      .input("Tozihat", sql.NVarChar(2000), String(tozihat).trim())
      .input("EshkalatIds", sql.NVarChar(500), String(eshkalatIds || "").trim() || null)
      .execute("[Akhbar].[SP_ReturnKhabar]");
    return NextResponse.json({ status: 200, data: result.recordset?.[0] || null });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
