import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { serializeDocument } from "@/lib/mongoUtils";
import { uid } from "@/lib/id";
import { KnowledgeBaseEntry } from "@/lib/types";

export async function POST(request: Request) {
  const payload = (await request.json()) as Omit<KnowledgeBaseEntry, "id">;

  if (!payload.profileId || !payload.title?.trim()) {
    return NextResponse.json(
      { error: "Profile and title are required" },
      { status: 400 },
    );
  }

  const entry: KnowledgeBaseEntry = {
    id: uid("kb"),
    profileId: payload.profileId,
    title: payload.title.trim(),
    details: payload.details?.trim() || "",
  };

  const db = await getDb();
  await db.collection("knowledgeBase").insertOne(entry);

  return NextResponse.json(serializeDocument(entry), { status: 201 });
}
