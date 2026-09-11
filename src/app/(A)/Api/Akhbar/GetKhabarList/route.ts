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
        const { userId, page = 1, sizepage = 10, indexsort = 1, ascdesc = 2, search = "" } = body;
        if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

        const pool = await getConnection();
        const result = await pool.request()
            .input("UserId", sql.BigInt, userId)
            .input("Page", sql.Int, page)
            .input("SizePage", sql.Int, sizepage)
            .input("SortIndex", sql.Int, indexsort)
            .input("SECDEC", sql.Int, ascdesc)
            .input("Search", sql.NVarChar(200), search)
            .execute("[Akhbar].[SP_GetKhabarPage]");

        return NextResponse.json({ status: 200, data: result.recordset || [] });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
    }
}
