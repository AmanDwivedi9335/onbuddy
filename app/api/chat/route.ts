import { NextResponse } from "next/server";

import { ChatMessage, KnowledgeBaseEntry } from "@/lib/types";

type ChatRequest = {
  messages: ChatMessage[];
  knowledgeBase: KnowledgeBaseEntry[];
};

function buildSystemPrompt(knowledgeBase: KnowledgeBaseEntry[]) {
  const knowledge = knowledgeBase
    .map((entry) => `- ${entry.title}: ${entry.details}`)
    .join("\n");

  return [
    "You are Onbuddy, a helpful onboarding assistant.",
    "Use the provided knowledge entries to answer the user. If the answer is unclear, say you don't have enough info.",
    "Cite the title of the knowledge entry you used when relevant.",
    "Knowledge base:",
    knowledge || "(No knowledge provided)",
  ].join("\n");
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAIAPI;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OpenAI API key. Set the OPENAIAPI environment variable." },
      { status: 500 },
    );
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch (error) {
    console.error("Invalid chat request body", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!Array.isArray(body.messages)) {
    return NextResponse.json({ error: "Messages payload is required" }, { status: 400 });
  }

  const sanitizedMessages = body.messages.map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
  }));

  const systemPrompt = buildSystemPrompt(body.knowledgeBase || []);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.35,
        messages: [{ role: "system", content: systemPrompt }, ...sanitizedMessages],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error", error);
      return NextResponse.json(
        { error: "OpenAI API request failed. Verify the OPENAIAPI key." },
        { status: 500 },
      );
    }

    const completion = await response.json();
    const reply: string =
      completion?.choices?.[0]?.message?.content ??
      "I couldn't generate a response right now. Please try again.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("OpenAI fetch error", err);
    return NextResponse.json(
      { error: "Unable to reach the OpenAI API. Please try again later." },
      { status: 500 },
    );
  }
}
