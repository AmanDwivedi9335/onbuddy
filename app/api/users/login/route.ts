import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { serializeDocument } from "@/lib/mongoUtils";
import { UserAccount } from "@/lib/types";

type LoginPayload = Pick<UserAccount, "email" | "password">;

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<LoginPayload>;
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  const db = await getDb();
  const existing = await db.collection<UserAccount>("users").findOne({ email });

  if (!existing || existing.password !== password) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  return NextResponse.json(serializeDocument(existing));
}
