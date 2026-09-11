import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { randomUUID } from "crypto";
import { extname } from "path";
import { getConnection } from "@/Lib/db";
import { verifyToken } from "@/Lib/auth";

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov", ".m4v"]);
const AUDIO_EXT = new Set([".mp3"]);

function validateFile(file: File) {
  const ext = extname(file.name || "").toLowerCase();
  const isImage = IMAGE_EXT.has(ext) && file.type.startsWith("image/");
  const isVideo = VIDEO_EXT.has(ext) && file.type.startsWith("video/");
  const isAudio = AUDIO_EXT.has(ext) && (file.type === "audio/mpeg" || file.type === "audio/mp3" || file.type === "");

  if (!isImage && !isVideo && !isAudio) {
    return { ok: false, message: "نوع فایل مجاز نیست. تصویر PNG/JPG/JPEG، ویدئو یا MP3 مجاز است." };
  }

  const maxBytes = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      ok: false,
      message: isVideo ? "حجم ویدئو حداکثر 10MB است." : isAudio ? "حجم MP3 حداکثر 5MB است." : "حجم تصویر حداکثر 5MB است.",
    };
  }

  return { ok: true, ext };
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });
  try { verifyToken(token); }
  catch { return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 }); }

  try {
    const form = await req.formData();
    const shomareKhabar = Number(form.get("shomareKhabar"));
    const userId = Number(form.get("userId"));
    const file = form.get("file") as File | null;

    if (!Number.isFinite(shomareKhabar) || shomareKhabar <= 0 || !Number.isFinite(userId) || userId <= 0 || !file) {
      return NextResponse.json({ error: "اطلاعات پیوست ناقص است." }, { status: 400 });
    }

    const checked = validateFile(file);
    if (!checked.ok) return NextResponse.json({ error: checked.message }, { status: 400 });

    const extension = checked.ext as string;
    const fileName = `${randomUUID().toUpperCase()}${extension}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileSizeKb = Math.max(1, Math.ceil(file.size / 1024));

    const pool = await getConnection();
    const result = await pool.request()
      .input("ShomareKhabar", sql.BigInt, shomareKhabar)
      .input("FileName", sql.NVarChar(250), fileName)
      .input("OriginalFileName", sql.NVarChar(500), file.name)
      .input("Files", sql.VarBinary(sql.MAX), buffer)
      .input("FileSize", sql.Int, fileSizeKb)
      .input("CreateUserId", sql.BigInt, userId)
      .execute("[Akhbar].[SP_InsertKhabarPeyvast]");

    return NextResponse.json({ status: 200, data: result.recordset?.[0] || null });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
