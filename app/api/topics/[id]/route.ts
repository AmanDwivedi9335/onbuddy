import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { ChatTopic } from "@/lib/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = (await request.json()) as Partial<ChatTopic>;
  const { id } = await params;

  const db = await getDb();
  await db
    .collection("topics")
    .updateOne({ id }, { $set: { title: payload.title, messages: payload.messages } });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = await getDb();

  await db.collection("topics").deleteOne({ id });

  return NextResponse.json({ ok: true });
}
