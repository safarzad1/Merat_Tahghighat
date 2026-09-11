import { NextResponse } from "next/server";
import sql from "mssql";
import { getConnection } from "@/Lib/db";
import { generateToken } from "@/Lib/auth";

const MAX_AGE = 60 * 60 * 72;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "").trim();
    const ip = String(body?.ip ?? "").trim();

    if (!username || !password) {
      return NextResponse.json(
        { status: 400, message: "نام کاربری و رمز عبور الزامی است" },
        { status: 400 }
      );
    }

    const pool = await getConnection();

    const dbResult = await pool
      .request()
      .input("CodeMelli", sql.NVarChar(50), username)
      .input("Password", sql.NVarChar(250), password)
      .input("IP", sql.NVarChar(50), ip)
      .execute("dbo.SP_CheckUserPassword");

    const user = dbResult?.recordset?.[0];

    if (!user) {
      return NextResponse.json(
        { status: 404, message: "هیچ داده‌ای از سرور بازنگشت" },
        { status: 404 }
      );
    }

    const isValid = Boolean(user.IsValid);
    const state = Number(user.State);

    if (isValid && state === 200) {
      const token = generateToken({
        username
      });

      const userInfo = {
        UserName: user.CodeMelli,
        UserId: user.UserId,
        Mahal: user.Mahal,
        PostId: user.PostId,
        FullName: user.FullName,
        NameMahal: user.NameMahal,
        DateNow: user.DateNow,
        IsMarkazShahrestan: user.IsMarkazShahrestan,
      };

      const res = NextResponse.json(
        { status: 200, message: "OK", data: userInfo },
        { status: 200 }
      );

      res.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: MAX_AGE,
      });


      return res;
    }

    if (state === 201) {
      return NextResponse.json(
        { status: 201, message: "❌ کلمه عبور اشتباه است" },
        { status: 201 }
      );
    }

    if (state === 202) {
      return NextResponse.json(
        { status: 202, message: "❌ نام کاربری شما غیرفعال است" },
        { status: 202 }
      );
    }

    return NextResponse.json(
      { status: 203, message: "❌ نام کاربری اشتباه است" },
      { status: 203 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: 500,
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
