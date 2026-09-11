import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { extname } from "path";
import { getConnection } from "@/Lib/db";
import { verifyToken } from "@/Lib/auth";

function contentType(fileName: string) {
  switch (extname(fileName).toLowerCase()) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".mp3": return "audio/mpeg";
    case ".webm": return "video/webm";
    case ".mov": return "video/quicktime";
    case ".m4v": return "video/x-m4v";
    default: return "video/mp4";
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });
  try { verifyToken(token); }
  catch { return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 }); }

  try {
    const shomareKhabar = Number(req.nextUrl.searchParams.get("shomareKhabar"));
    const userId = Number(req.nextUrl.searchParams.get("userId"));
    const fileName = String(req.nextUrl.searchParams.get("fileName") || "").trim();
    if (!shomareKhabar || !userId || !fileName) return NextResponse.json({ error: "parameters required" }, { status: 400 });

    const pool = await getConnection();
    const result = await pool.request()
      .input("ShomareKhabar", sql.BigInt, shomareKhabar)
      .input("FileName", sql.NVarChar(250), fileName)
      .input("UserId", sql.BigInt, userId)
      .execute("[Akhbar].[SP_GetKhabarPeyvastFile]");

    const row = result.recordset?.[0];
    if (!row?.Files) return NextResponse.json({ error: "فایل یافت نشد." }, { status: 404 });

    const bytes = row.Files instanceof Buffer ? row.Files : Buffer.from(row.Files);
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": contentType(row.FileName || fileName),
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, max-age=300",
        "Content-Disposition": `inline; filename="${encodeURIComponent(row.FileName || fileName)}"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
