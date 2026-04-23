import OpenAI from "openai";

import { relayRobotResponse, type TimRelayStatus } from "@/lib/tim-rest";

export const runtime = "nodejs";

type AgentRequest = {
  prompt: string;
  userId?: string;
  threadTitle?: string;
  history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  mode?: "mock" | "tencent";
};

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function chunkText(text: string, size = 26) {
  const chunks: string[] = [];

  let cursor = 0;

  while (cursor < text.length) {
    chunks.push(text.slice(cursor, cursor + size));
    cursor += size;
  }

  return chunks;
}

function fallbackReply(prompt: string, threadTitle: string) {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("readme")) {
    return `Here is the angle I would push for ${threadTitle}: lead with "Agent inbox for async AI delivery", make Tencent RTC Chat SDK visible in the first setup block, and keep the first demo under two minutes. Then prove three things fast: persistent conversation history, progress updates that survive page reloads, and the handoff from mock mode to real Tencent RTC Chat credentials.`;
  }

  if (normalized.includes("push") || normalized.includes("notification")) {
    return `Push matters because the user is rarely sitting on the chat tab waiting for an agent to finish. A strong agent UI should treat push as part of the product loop: start task, leave, get woken up, reopen the exact thread, and continue from preserved context. Tencent RTC Chat SDK plus Push is a better story than bolting alerts onto a generic prompt box later.`;
  }

  if (
    normalized.includes("usersig") ||
    normalized.includes("sdkappid") ||
    normalized.includes("secret")
  ) {
    return `The clean flow is: create a Chat app in the TRTC Console, get SDKAppID, generate a test UserSig for local use, then move UserSig issuance behind a server route for production. That way the GitHub demo stays easy, but serious users still have to wire their own Tencent RTC Chat project to unlock the full experience.`;
  }

  if (
    normalized.includes("openai") ||
    normalized.includes("deepseek") ||
    normalized.includes("claude") ||
    normalized.includes("model")
  ) {
    return `OPENAI_API_KEY is optional in this demo. The current server route uses an OpenAI-compatible API surface for convenience, so any provider with an OpenAI-compatible endpoint can work by setting OPENAI_API_KEY, OPENAI_BASE_URL, and OPENAI_MODEL. If your model provider is not OpenAI-compatible, swap the logic in /api/agent for that provider's SDK.`;
  }

  return `The strongest version of this project is not "an AI chat demo with a random chat SDK attached." It is "an agent inbox built on Tencent RTC Chat SDK." The UI should prove that long-running work, delivery, memory, and follow-up belong in chat. Use mock mode to remove friction, then make Tencent mode feel like the grown-up path: real credentials, real bot relay, and real message continuity.`;
}

async function createModelReply(
  prompt: string,
  threadTitle: string,
  history: AgentRequest["history"] = [],
) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackReply(prompt, threadTitle);
  }

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content:
          "You are a product-minded engineering assistant designing a GitHub-ready agent inbox built with Tencent RTC Chat SDK. Be concrete, opinionated, and concise. Favor architecture, growth leverage, and onboarding clarity over generic AI commentary.",
      },
      ...history.slice(-4).map((item) => ({
        role: item.role,
        content: item.content,
      })),
      {
        role: "user",
        content: `Thread: ${threadTitle}\n\nUser request: ${prompt}`,
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || fallbackReply(prompt, threadTitle);
}

export async function POST(request: Request) {
  const body = (await request.json()) as AgentRequest;

  if (!body.prompt?.trim()) {
    return Response.json({ error: "A prompt is required." }, { status: 400 });
  }

  const threadTitle = body.threadTitle || "Agent Inbox";
  const answer = await createModelReply(body.prompt.trim(), threadTitle, body.history);
  const relayEnabled = body.mode === "tencent" && Boolean(body.userId);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const push = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      };

      push({ type: "status", value: "Planning the response" });
      await sleep(180);
      push({ type: "status", value: "Shaping the inbox narrative" });
      await sleep(180);

      let built = "";

      for (const chunk of chunkText(answer)) {
        built += chunk;
        push({ type: "delta", value: chunk });
        await sleep(55);
      }

      let relayResult: TimRelayStatus = {
        enabled: false,
        relayMode: "none",
        reason: "Relay was not requested.",
      };

      if (relayEnabled && body.userId) {
        relayResult = await relayRobotResponse(body.userId, answer);

        if (relayResult.enabled) {
          push({
            type: "status",
            value: `Synced to Tencent RTC Chat as ${relayResult.botUserId}`,
          });
        }
      }

      push({
        type: "done",
        value: built,
        relay: relayResult,
        model: process.env.OPENAI_MODEL || "mock-operator",
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
