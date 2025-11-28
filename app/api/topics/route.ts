import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { serializeDocument, serializeMany } from "@/lib/mongoUtils";
import { uid } from "@/lib/id";
import { ChatTopic } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const db = await getDb();
  const topics = await db.collection("topics").find({ userId }).toArray();

  return NextResponse.json({ topics: serializeMany(topics) });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as ChatTopic;

  if (!payload.userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const topic: ChatTopic = {
    id: payload.id ?? uid("topic"),
    userId: payload.userId,
    title: payload.title?.trim() || "New topic",
    createdAt: payload.createdAt ?? new Date().toISOString(),
    messages: payload.messages ?? [],
  };

  const db = await getDb();
  await db.collection("topics").insertOne(topic);

  return NextResponse.json(serializeDocument(topic), { status: 201 });
}
