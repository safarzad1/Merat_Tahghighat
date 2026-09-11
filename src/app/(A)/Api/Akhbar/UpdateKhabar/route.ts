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
            .input("TabaqehBandi", sql.TinyInt, body.tabaqehBandi)
            .input("ManbaKhabarId", sql.Int, body.manbaKhabarId)
            .input("NoeKhabar", sql.TinyInt, body.noeKhabar)
            .input("TarikhNameh", sql.NChar(10), body.tarikhNameh || null)
            .input("ShomareNameh", sql.NVarChar(100), body.shomareNameh || null)
            .input("OnvanKhabar", sql.NVarChar(500), body.onvanKhabar)
            .input("SharhKhabar", sql.NVarChar(sql.MAX), body.sharhKhabar)
            .input("MolahazatKhabar", sql.NVarChar(sql.MAX), body.molahazatKhabar)
            .input("NoghteKhabarkhizId", sql.BigInt, body.noghteKhabarkhizId || null)
            .input("MahalNoghteKhabarkhiz", sql.NVarChar(500), body.mahalNoghteKhabarkhiz || null)
            .input("TarikhEnteshar", sql.NChar(10), body.tarikhEnteshar || null)
            .input("LastEditUserId", sql.BigInt, body.lastEditUserId)
            .execute("[Akhbar].[SP_UpdateKhabar]");

        return NextResponse.json({ status: 200, data: result.recordset?.[0] || null });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
    }
}
