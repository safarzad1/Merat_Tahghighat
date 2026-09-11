import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";

import { getConnection } from "@/Lib/db";
import { verifyToken } from "@/Lib/auth";

export async function POST(req: NextRequest) {
    const token = req.cookies.get("token")?.value;
    if (!token) {
        return NextResponse.json(
            { status: 401, error: "Unauthorized: No token" },
            { status: 401 }
        );
    }
    const body = await req.json();
    const { password, userid } = body;

    try {
        verifyToken(token);
    } catch {
        return NextResponse.json(
            { status: 401, error: "Unauthorized: Invalid or expired token" },
            { status: 401 }
        );
    }

    try {
        const pool = await getConnection();
        const result = await pool
            .request()
            .input("Password", sql.NVarChar(250), String(password ?? "").trim())
            .input("UserId", sql.BigInt, userid)
            .execute("dbo.SP_ChangePassword");

        const updatedCount = Number(result.recordset?.[0]?.UpdatedCount ?? 0);

        if (updatedCount !== 1) {
            return NextResponse.json(
                { status: 404, message: "کاربر موردنظر برای تغییر کلمه عبور پیدا نشد." },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { status: 200, message: "کلمه عبور با موفقیت تغییر کرد." }
        );

    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Unknown error" },
            { status: 500 }
        );
    }
}
