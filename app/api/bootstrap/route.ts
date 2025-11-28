import { NextResponse } from "next/server";

import { getDb } from "@/lib/mongodb";
import { serializeMany } from "@/lib/mongoUtils";
import {
  seedDepartments,
  seedKnowledge,
  seedProfiles,
  seedSuperAdmin,
} from "@/lib/seedData";

export async function GET() {
  const db = await getDb();

  const departmentsCollection = db.collection("departments");
  const profilesCollection = db.collection("profiles");
  const knowledgeCollection = db.collection("knowledgeBase");
  const usersCollection = db.collection("users");

  const [departmentsCount, profilesCount, knowledgeCount, existingAdmin] =
    await Promise.all([
      departmentsCollection.countDocuments(),
      profilesCollection.countDocuments(),
      knowledgeCollection.countDocuments(),
      usersCollection.findOne({ email: seedSuperAdmin.email }),
    ]);

  if (departmentsCount === 0) {
    await departmentsCollection.insertMany(seedDepartments);
  }

  if (profilesCount === 0) {
    await profilesCollection.insertMany(seedProfiles);
  }

  if (knowledgeCount === 0) {
    await knowledgeCollection.insertMany(seedKnowledge);
  }

  if (!existingAdmin) {
    await usersCollection.insertOne(seedSuperAdmin);
  }

  const [departments, profiles, knowledgeBase, users] = await Promise.all([
    departmentsCollection.find().toArray(),
    profilesCollection.find().toArray(),
    knowledgeCollection.find().toArray(),
    usersCollection.find().toArray(),
  ]);

  return NextResponse.json({
    departments: serializeMany(departments),
    profiles: serializeMany(profiles),
    knowledgeBase: serializeMany(knowledgeBase),
    users: serializeMany(users),
  });
}
