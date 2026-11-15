import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-error";
import { assertOriginMismoHost } from "@/lib/auth/require";
import { COOKIE_SESION } from "@/lib/auth/sesion";

export function POST(request: Request): NextResponse {
  try {
    assertOriginMismoHost(request);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_SESION, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (error) {
    return jsonError(error);
  }
}
