import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/cognito";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const idToken = cookieStore.get("idToken")?.value;

    if (!idToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = getUserFromToken(idToken);

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
