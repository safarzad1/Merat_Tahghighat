import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { getConnection } from "@/Lib/db";
import { verifyToken } from "@/Lib/auth";

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

    const pool = await getConnection();
    const result = await pool
      .request()
      .input("UserId", sql.BigInt, userId)
      .execute("Dashboard.SP_MainOverview");

    return NextResponse.json({ status: 200, data: result.recordset?.[0] || {} });
  } catch (err) {
    return NextResponse.json(
      { status: 500, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
