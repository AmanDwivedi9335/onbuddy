import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const payload = (await _request.json()) as { name?: string };

  if (!payload.name || !payload.name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = await getDb();
  await db
    .collection("departments")
    .updateOne({ id }, { $set: { name: payload.name.trim() } });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = await getDb();

  const profiles = await db
    .collection("profiles")
    .find({ departmentId: id })
    .toArray();

  const profileIds = profiles.map((profile) => profile.id);

  const userFilters = [{ departmentId: id }];
  if (profileIds.length > 0) {
    userFilters.push({ profileId: { $in: profileIds } });
  }

  await Promise.all([
    db.collection("departments").deleteOne({ id }),
    db.collection("profiles").deleteMany({ departmentId: id }),
    db.collection("knowledgeBase").deleteMany({ profileId: { $in: profileIds } }),
    db.collection("users").deleteMany({ $or: userFilters }),
  ]);

  return NextResponse.json({ ok: true });
}
