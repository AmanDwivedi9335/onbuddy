import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { serializeDocument } from "@/lib/mongoUtils";
import { uid } from "@/lib/id";
import { Profile } from "@/lib/types";

export async function POST(request: Request) {
  const payload = (await request.json()) as Omit<Profile, "id">;

  if (!payload.departmentId || !payload.name.trim()) {
    return NextResponse.json({ error: "Department and name are required" }, { status: 400 });
  }

  const profile: Profile = {
    id: uid("profile"),
    departmentId: payload.departmentId,
    name: payload.name.trim(),
    summary: payload.summary?.trim() || "",
  };

  const db = await getDb();
  await db.collection("profiles").insertOne(profile);

  return NextResponse.json(serializeDocument(profile), { status: 201 });
}
