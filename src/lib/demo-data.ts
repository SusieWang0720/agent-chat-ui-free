export type DemoThread = {
  id: string;
  title: string;
  badge: string;
  platform: string;
  summary: string;
  owner: string;
  temperature: "live" | "warm" | "idle";
};

export type DemoMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  status?: "local" | "synced" | "streaming" | "failed";
  accent?: string;
};

export const demoThreads: DemoThread[] = [
  {
    id: "agent-inbox",
    title: "Async Agent Inbox",
    badge: "Flagship",
    platform: "Next.js + Tencent RTC Chat SDK",
    summary:
      "The missing layer between long-running agents and human users: persistent chat, delivery, and follow-up.",
    owner: "@product-bot",
    temperature: "live",
  },
  {
    id: "support-handoff",
    title: "AI Support Handoff",
    badge: "Revenue",
    platform: "C2C + human escalation",
    summary:
      "Let the bot solve the first 80%, then hand off to a human without losing context or history.",
    owner: "@support-ai",
    temperature: "warm",
  },
  {
    id: "release-briefing",
    title: "Release Briefing Bot",
    badge: "Ops",
    platform: "Push-ready assistant",
    summary:
      "Ship build updates, incident notes, and task summaries into a single developer-facing inbox.",
    owner: "@ops-agent",
    temperature: "idle",
  },
];

export const demoMessages: Record<string, DemoMessage[]> = {
  "agent-inbox": [
    {
      id: "ai-1",
      role: "assistant",
      createdAt: "09:12",
      status: "synced",
      content:
        "You are looking at the agent inbox pattern that hot GitHub projects keep circling around: a chat surface for long-running work, not just a prompt box.",
    },
    {
      id: "sys-1",
      role: "system",
      createdAt: "09:13",
      accent: "Planning",
      content:
        "Suggested flow: user sends task -> agent runs tools -> progress is streamed -> final answer lands in chat -> push wakes the user back up.",
    },
    {
      id: "usr-1",
      role: "user",
      createdAt: "09:16",
      status: "local",
      content:
        "Design an agent chat UI built on Tencent RTC Chat SDK that feels closer to a product than a docs demo.",
    },
    {
      id: "ai-2",
      role: "assistant",
      createdAt: "09:17",
      status: "synced",
      content:
        "Done. I would keep the entry friction low with mock mode, but the real moat is server relay: the user must create a Chat app, issue a UserSig, and wire a bot account before production feels complete.",
    },
  ],
  "support-handoff": [
    {
      id: "ai-3",
      role: "assistant",
      createdAt: "08:51",
      status: "synced",
      content:
        "Customer asked whether they can recover a failed order flow. I drafted the answer, highlighted risk, and flagged a human follow-up if payment state is stale.",
    },
    {
      id: "usr-2",
      role: "user",
      createdAt: "08:54",
      status: "local",
      content: "Show me the handoff summary and the recovery steps.",
    },
  ],
  "release-briefing": [
    {
      id: "sys-2",
      role: "system",
      createdAt: "07:45",
      accent: "Ops Feed",
      content:
        "Three fresh signals from GitHub: agent dashboards, voice-enabled agents, and chat delivery layers keep compounding stars.",
    },
    {
      id: "ai-4",
      role: "assistant",
      createdAt: "07:47",
      status: "synced",
      content:
        "Recommendation: launch with an inbox narrative, not an SDK narrative. The SDK becomes the enabling layer behind a sharper promise.",
    },
  ],
};

export const starterPrompts = [
  "Plan the best repo README for this project.",
  "Explain why async agent delivery matters more than one-shot chat.",
  "Map this UI to the Tencent RTC Chat SDK setup flow.",
];
