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
    const body = await req.json();
    const pool = await getConnection();
    const result = await pool.request()
      .input("ShomareKhabar", sql.BigInt, body.shomareKhabar)
      .input("UserId", sql.BigInt, body.userId)
      .input("Search", sql.NVarChar(150), body.search || "")
      .input("Page", sql.Int, body.page || 1)
      .input("SizePage", sql.Int, body.sizePage || 10)
      .execute("[Akhbar].[SP_SearchAshkhas]");

    return NextResponse.json({ status: 200, data: result.recordset || [] });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
