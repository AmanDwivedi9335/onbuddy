import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { KnowledgeBaseEntry } from "@/lib/types";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const payload = (await request.json()) as Omit<KnowledgeBaseEntry, "id">;
  const { id } = params;

  if (!payload.profileId || !payload.title?.trim()) {
    return NextResponse.json(
      { error: "Profile and title are required" },
      { status: 400 },
    );
  }

  const db = await getDb();
  await db.collection("knowledgeBase").updateOne({ id }, { $set: payload });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const db = await getDb();

  await db.collection("knowledgeBase").deleteOne({ id });

  return NextResponse.json({ ok: true });
}
