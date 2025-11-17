import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getLogoutUrl } from "@/lib/cognito";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("idToken");
  cookieStore.delete("userId");

  return NextResponse.json({
    success: true,
    logoutUrl: getLogoutUrl(),
  });
}
