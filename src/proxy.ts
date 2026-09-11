import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PRIVATE_PREFIXES = ["/Dashboard", "/profile", "/settings"];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const p = pathname.toLowerCase();

    const token = request.cookies.get("token")?.value;

    if (token && p === "/Login") {
        return NextResponse.redirect(new URL("/TahghighatManage", request.url));
    }

    const isPrivate = PRIVATE_PREFIXES.some((x) => p.startsWith(x));
    if (!token && isPrivate) {
        const loginUrl = new URL("/Login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (p === "/") {
        return NextResponse.redirect(new URL(token ? "/TahghighatManage" : "/Login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/Login", "/Dashboard/:path*", "/Profile/:path*", "/Settings/:path*"],
};
