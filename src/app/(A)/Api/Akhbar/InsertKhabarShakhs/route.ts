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
      .input("ShomarehParvandeh", sql.BigInt, body.shomarehParvandeh)
      .input("CreateUserId", sql.BigInt, body.createUserId)
      .execute("[Akhbar].[SP_InsertKhabarShakhs]");

    return NextResponse.json({ status: 200, data: result.recordset?.[0] || null });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
