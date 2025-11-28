import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { Profile } from "@/lib/types";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const payload = (await request.json()) as Omit<Profile, "id">;
  const { id } = params;

  if (!payload.departmentId || !payload.name.trim()) {
    return NextResponse.json({ error: "Department and name are required" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("profiles").updateOne({ id }, { $set: payload });
  await db
    .collection("users")
    .updateMany({ profileId: id }, { $set: { departmentId: payload.departmentId } });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const db = await getDb();

  await Promise.all([
    db.collection("profiles").deleteOne({ id }),
    db.collection("knowledgeBase").deleteMany({ profileId: id }),
    db.collection("users").updateMany({ profileId: id }, { $unset: { profileId: "" } }),
  ]);

  return NextResponse.json({ ok: true });
}
