import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { serializeDocument } from "@/lib/mongoUtils";
import { uid } from "@/lib/id";
import { Department } from "@/lib/types";

export async function POST(request: Request) {
  const { name } = (await request.json()) as Partial<Department>;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const department: Department = { id: uid("dept"), name: name.trim() };
  const db = await getDb();
  await db.collection("departments").insertOne(department);

  return NextResponse.json(serializeDocument(department), { status: 201 });
}
