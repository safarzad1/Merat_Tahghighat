import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { getConnection } from "@/Lib/db";
import { verifyToken } from "@/Lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });

  try { verifyToken(token); }
  catch { return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 }); }

  try {
    const { shomareKhabar, userId, tozihat, expectedToUserId } = await req.json();
    if (!shomareKhabar || !userId) {
      return NextResponse.json({ error: "parameters required" }, { status: 400 });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input("ShomareKhabar", sql.BigInt, shomareKhabar)
      .input("UserId", sql.BigInt, userId)
      .input("Tozihat", sql.NVarChar(2000), String(tozihat || "").trim() || null)
      .input("ExpectedToUserId", sql.BigInt, Number(expectedToUserId || 0) || null)
      .execute("[Akhbar].[SP_SendKhabar]");

    return NextResponse.json({ status: 200, data: result.recordset?.[0] || null });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
