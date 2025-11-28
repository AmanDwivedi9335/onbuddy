import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { serializeDocument } from "@/lib/mongoUtils";
import { uid } from "@/lib/id";
import { UserAccount } from "@/lib/types";

export async function POST(request: Request) {
  const payload = (await request.json()) as UserAccount;

  if (!payload.email?.trim() || !payload.password?.trim()) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  const user: UserAccount = {
    id: payload.id ?? uid("user"),
    role: payload.role,
    name: payload.name?.trim() || "New User",
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    departmentId: payload.departmentId,
    profileId: payload.profileId,
  };

  const db = await getDb();
  const existing = await db.collection("users").findOne({ email: user.email });

  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 400 },
    );
  }

  await db.collection("users").insertOne(user);

  return NextResponse.json(serializeDocument(user), { status: 201 });
}
