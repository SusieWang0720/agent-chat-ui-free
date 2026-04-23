"use client";

import TencentCloudChat, { type ChatSDK, type Message } from "@tencentcloud/chat";
import {
  BellRing,
  Bot,
  ChevronRight,
  CircleDashed,
  Command,
  Cpu,
  KeyRound,
  Link2,
  LoaderCircle,
  MessageSquareText,
  Orbit,
  RadioTower,
  Search,
  SendHorizonal,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TIMUploadPlugin from "tim-upload-plugin";

import { demoMessages, demoThreads, starterPrompts, type DemoMessage } from "@/lib/demo-data";

type UiMessage = DemoMessage & {
  source?: "demo" | "preview" | "tim";
};

type UiThread = {
  id: string;
  title: string;
  badge: string;
  platform: string;
  summary: string;
  owner: string;
  temperature: "live" | "warm" | "idle";
  unread: number;
};

type BridgeState = {
  status: "idle" | "connecting" | "connected" | "error";
  mode: "mock" | "tencent";
  message: string;
  relayEnabled: boolean;
  canIssueUserSig: boolean;
  configuredAppId?: number | null;
};

type BootstrapState = {
  loading: boolean;
  reason: string;
};

type RunRow = {
  id: string;
  title: string;
  detail: string;
  state: "queued" | "running" | "done" | "warning";
};

type Credentials = {
  sdkAppId: string;
  userId: string;
  userSig: string;
  agentUserId: string;
};

type TimMessageEvent = {
  data?: Message[];
};

type TimErrorEvent = {
  data?: {
    message?: string;
  };
  message?: string;
};

type TimMessageListResponse = {
  data?: {
    messageList?: Message[];
  };
};

type AgentStreamEvent =
  | {
      type: "status" | "delta";
      value: string;
    }
  | {
      type: "done";
      value: string;
      relay?: {
        enabled: boolean;
        relayMode: string;
      };
    };

const consoleUrl = "https://console.trtc.io";
const docsUrl = "https://trtc.io/document/33515";
const userSigUrl = "https://trtc.io/document/34385?menulabel=serverapis&product=chat";

const researchPatterns = [
  {
    title: "Hero first, not docs first",
    detail:
      "Hot repos win the first ten seconds with a sharp promise, a visual preview, and a tiny install surface.",
  },
  {
    title: "Own the async workflow",
    detail:
      "The best agent UIs are not just prompt boxes. They solve planning, waiting, coming back, and finishing.",
  },
  {
    title: "One command, then a deeper path",
    detail:
      "Mock mode gets stars. Real credentials, bot relay, and production safety convert serious builders.",
  },
];

function nowLabel() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function conversationIdFromUser(userId: string) {
  return `C2C${userId}`;
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function messageText(message: Pick<Message, "payload">) {
  if (message?.payload?.text) {
    return String(message.payload.text);
  }

  if (message?.payload?.description) {
    return String(message.payload.description);
  }

  return "[Unsupported message type in this demo]";
}

function initialThreads(): UiThread[] {
  return demoThreads.map((thread, index) => ({
    ...thread,
    unread: index === 0 ? 2 : 0,
  }));
}

function initialMessages() {
  return Object.fromEntries(
    Object.entries(demoMessages).map(([threadId, messages]) => [
      threadId,
      messages.map((message) => ({ ...message, source: "demo" as const })),
    ]),
  ) as Record<string, UiMessage[]>;
}

function initialRuns(): RunRow[] {
  return [
    {
      id: "run-1",
      title: "Tencent RTC Chat relay health",
      detail: "Waiting for Tencent mode to be enabled.",
      state: "queued",
    },
    {
      id: "run-2",
      title: "Agent planner",
      detail: "Seeded with async-delivery product prompts.",
      state: "done",
    },
  ];
}

export function AgentChatUi() {
  const [threads, setThreads] = useState<UiThread[]>(initialThreads);
  const [messagesByThread, setMessagesByThread] = useState<Record<string, UiMessage[]>>(initialMessages);
  const [activeThreadId, setActiveThreadId] = useState("agent-inbox");
  const [composer, setComposer] = useState("");
  const [search, setSearch] = useState("");
  const [bridge, setBridge] = useState<BridgeState>({
    status: "idle",
    mode: "mock",
    message: "Running in mock mode. Great for demos, not for real delivery.",
    relayEnabled: false,
    canIssueUserSig: false,
    configuredAppId: null,
  });
  const [bootstrap, setBootstrap] = useState<BootstrapState>({
    loading: true,
    reason: "Checking whether server-side TIM relay is already configured.",
  });
  const [credentials, setCredentials] = useState<Credentials>({
    sdkAppId: "",
    userId: "demo_builder",
    userSig: "",
    agentUserId: "@RBT#agent_inbox",
  });
  const [runs, setRuns] = useState<RunRow[]>(initialRuns);
  const [clientEpoch, setClientEpoch] = useState(0);
  const clientRef = useRef<ChatSDK | null>(null);
  const pendingRelayTextRef = useRef<Record<string, string>>({});

  const deferredSearch = useDeferredValue(search);
  const visibleThreads = threads.filter((thread) => {
    const haystack = `${thread.title} ${thread.summary} ${thread.owner}`.toLowerCase();
    return haystack.includes(deferredSearch.trim().toLowerCase());
  });
  const activeThread = threads.find((thread) => thread.id === activeThreadId) || threads[0];
  const activeMessages = messagesByThread[activeThreadId] || [];

  const updateRun = (title: string, detail: string, state: RunRow["state"]) => {
    setRuns((current) => {
      const next = [
        {
          id: crypto.randomUUID(),
          title,
          detail,
          state,
        },
        ...current,
      ];

      return next.slice(0, 5);
    });
  };

  const mergeTimHistory = (timMessages: Message[]) => {
    const mapped = timMessages
      .slice()
      .reverse()
      .map((message) => {
        const fromAgent = message.from === credentials.agentUserId;

        return {
          id: message.ID || crypto.randomUUID(),
          role: fromAgent ? ("assistant" as const) : ("user" as const),
          content: messageText(message),
          createdAt: nowLabel(),
          status: "synced" as const,
          source: "tim" as const,
        };
      });

    if (mapped.length === 0) {
      return;
    }

    setMessagesByThread((current) => ({
      ...current,
      "agent-inbox": mapped,
    }));

    setThreads((current) =>
      current.map((thread) =>
        thread.id === "agent-inbox"
          ? {
              ...thread,
              unread: 0,
              summary: "Live Tencent RTC Chat conversation loaded from the cloud.",
              owner: credentials.agentUserId || thread.owner,
            }
          : thread,
      ),
    );
  };

  useEffect(() => {
    let alive = true;

    const loadBootstrap = async () => {
      try {
        const response = await fetch("/api/bootstrap", { cache: "no-store" });
        const data = (await response.json()) as {
          hasServerUserSig: boolean;
          hasRelay: boolean;
          relayMode: string;
          botUserId?: string;
          configuredAppId?: number | null;
          reason?: string;
        };

        if (!alive) {
          return;
        }

        setBridge((current) => ({
          ...current,
          canIssueUserSig: data.hasServerUserSig,
          relayEnabled: data.hasRelay,
          configuredAppId: data.configuredAppId ?? null,
        }));

        setBootstrap({
          loading: false,
          reason:
            data.reason ||
            (data.hasRelay
              ? "Server relay is ready. Real TIM bot messages can be mirrored through your backend."
              : "Server relay is optional. The UI still works in mock mode without it."),
        });

        setCredentials((current) => ({
          ...current,
          sdkAppId:
            current.sdkAppId || data.configuredAppId
              ? String(data.configuredAppId || current.sdkAppId)
              : "",
          agentUserId: data.botUserId || current.agentUserId,
        }));
      } catch (error) {
        if (!alive) {
          return;
        }

        setBootstrap({
          loading: false,
          reason:
            error instanceof Error
              ? error.message
              : "Could not inspect bootstrap status.",
        });
      }
    };

    loadBootstrap();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const client = clientRef.current;

    if (!client) {
      return;
    }

    const onMessage = (event: TimMessageEvent) => {
      const receivedMessages = event.data || [];
      const nextMessages = receivedMessages.map((message) => {
        const fromAgent = message.from === credentials.agentUserId;
        const content = messageText(message);
        const expectedRelay = pendingRelayTextRef.current["agent-inbox"];

        if (fromAgent && expectedRelay && expectedRelay.trim() === content.trim()) {
          pendingRelayTextRef.current["agent-inbox"] = "";

          setMessagesByThread((current) => ({
            ...current,
            "agent-inbox": (current["agent-inbox"] || []).map((item) =>
              item.source === "preview" &&
              item.role === "assistant" &&
              item.content.trim() === content.trim()
                ? { ...item, status: "synced", source: "tim" }
                : item,
            ),
          }));

          return null;
        }

        return {
          id: message.ID || crypto.randomUUID(),
          role: fromAgent ? ("assistant" as const) : ("user" as const),
          content,
          createdAt: nowLabel(),
          status: "synced" as const,
          source: "tim" as const,
        };
      });

      const filtered = nextMessages.filter(Boolean) as UiMessage[];

      if (filtered.length === 0) {
        return;
      }

      setMessagesByThread((current) => ({
        ...current,
        "agent-inbox": [...(current["agent-inbox"] || []), ...filtered],
      }));

      setThreads((current) =>
        current.map((thread) =>
          thread.id === "agent-inbox"
            ? {
                ...thread,
                unread: activeThreadId === "agent-inbox" ? 0 : thread.unread + filtered.length,
                temperature: "live",
                summary: filtered[filtered.length - 1]?.content || thread.summary,
              }
            : thread,
        ),
      );
    };

    const onReady = () => {
      setBridge((current) => ({
        ...current,
        status: "connected",
        mode: "tencent",
        message: "Connected to Tencent RTC Chat. Local UI is now backed by a real chat session.",
      }));
    };

    const onNotReady = () => {
      setBridge((current) => ({
        ...current,
        status: "idle",
        mode: "tencent",
        message: "Tencent RTC Chat is temporarily not ready.",
      }));
    };

    const onError = (event: TimErrorEvent) => {
      setBridge((current) => ({
        ...current,
        status: "error",
        mode: "tencent",
        message:
          event?.data?.message ||
          event?.message ||
          "Tencent RTC Chat reported an error. Check SDKAppID and UserSig.",
      }));
    };

    client.on(TencentCloudChat.EVENT.MESSAGE_RECEIVED, onMessage);
    client.on(TencentCloudChat.EVENT.SDK_READY, onReady);
    client.on(TencentCloudChat.EVENT.SDK_NOT_READY, onNotReady);
    client.on(TencentCloudChat.EVENT.ERROR, onError);

    return () => {
      client.off(TencentCloudChat.EVENT.MESSAGE_RECEIVED, onMessage);
      client.off(TencentCloudChat.EVENT.SDK_READY, onReady);
      client.off(TencentCloudChat.EVENT.SDK_NOT_READY, onNotReady);
      client.off(TencentCloudChat.EVENT.ERROR, onError);
    };
  }, [clientEpoch, credentials.agentUserId, activeThreadId]);

  const loadAgentInboxHistory = async () => {
    const client = clientRef.current;

    if (!client || !credentials.agentUserId) {
      return;
    }

    try {
      const response = (await client.getMessageList({
        conversationID: conversationIdFromUser(credentials.agentUserId),
      })) as TimMessageListResponse;

      mergeTimHistory(response?.data?.messageList || []);
      await client.setMessageRead({
        conversationID: conversationIdFromUser(credentials.agentUserId),
      });
    } catch {
      updateRun(
        "Tencent RTC Chat history load",
        "No remote messages were loaded yet, so the demo thread stayed in seeded mode.",
        "warning",
      );
    }
  };

  const connectTencent = async () => {
    if (!credentials.sdkAppId.trim() || !credentials.userId.trim()) {
      setBridge((current) => ({
        ...current,
        status: "error",
        mode: "tencent",
        message: "SDKAppID and User ID are required before connecting.",
      }));
      return;
    }

    setBridge((current) => ({
      ...current,
      status: "connecting",
      mode: "tencent",
      message: "Logging in to Tencent RTC Chat and preparing the bot relay.",
    }));
    updateRun(
      "Tencent RTC Chat login",
      "Authenticating with SDKAppID and UserSig.",
      "running",
    );

    try {
      let userSig = credentials.userSig.trim();

      if (!userSig) {
        const response = await fetch("/api/usersig", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: credentials.userId.trim(),
            sdkAppId: Number(credentials.sdkAppId),
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Could not issue a server-side UserSig.");
        }

        userSig = payload.userSig;

        setCredentials((current) => ({
          ...current,
          userSig,
        }));
      }

      if (clientRef.current) {
        await clientRef.current.logout().catch(() => undefined);
        await clientRef.current.destroy().catch(() => undefined);
      }

      const client = TencentCloudChat.create({
        SDKAppID: Number(credentials.sdkAppId),
      });

      client.registerPlugin({ "tim-upload-plugin": TIMUploadPlugin });
      client.setLogLevel(1);
      clientRef.current = client;
      setClientEpoch((value) => value + 1);

      await client.login({
        userID: credentials.userId.trim(),
        userSig,
      });

      startTransition(() => {
        setActiveThreadId("agent-inbox");
      });

      await loadAgentInboxHistory();

      updateRun(
        "Tencent RTC Chat relay health",
        "Connected. The flagship thread is now backed by a real Tencent RTC Chat login.",
        "done",
      );
    } catch (error) {
      setBridge((current) => ({
        ...current,
        status: "error",
        mode: "tencent",
        message:
          error instanceof Error
            ? error.message
            : "Tencent RTC Chat login failed for an unknown reason.",
      }));

      updateRun(
        "Tencent RTC Chat login",
        error instanceof Error ? error.message : "Login failed.",
        "warning",
      );
    }
  };

  const disconnectTencent = async () => {
    if (!clientRef.current) {
      setBridge((current) => ({
        ...current,
        status: "idle",
        mode: "mock",
        message: "Back in mock mode.",
      }));
      return;
    }

    await clientRef.current.logout().catch(() => undefined);
    await clientRef.current.destroy().catch(() => undefined);
    clientRef.current = null;
    setClientEpoch((value) => value + 1);
    setBridge((current) => ({
      ...current,
      status: "idle",
      mode: "mock",
      message: "Disconnected from Tencent RTC Chat. Local preview mode is still available.",
    }));
    updateRun("Tencent RTC Chat session", "Returned to mock mode.", "queued");
  };

  const appendPreviewMessage = (threadId: string, message: UiMessage) => {
    setMessagesByThread((current) => ({
      ...current,
      [threadId]: [...(current[threadId] || []), message],
    }));
  };

  const streamAgentReply = async (prompt: string, threadId: string) => {
    const assistantId = crypto.randomUUID();
    const history = (messagesByThread[threadId] || []).slice(-6).map((item) => ({
      role: item.role,
      content: item.content,
    }));

    appendPreviewMessage(threadId, {
      id: assistantId,
      role: "assistant",
      createdAt: nowLabel(),
      content: "",
      status: "streaming",
      source: "preview",
    });

    updateRun("Agent planner", "Streaming the assistant reply into the inbox.", "running");

    const response = await fetch("/api/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        threadTitle: activeThread.title,
        history,
        userId: bridge.mode === "tencent" ? credentials.userId.trim() : undefined,
        mode: bridge.mode,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error || "The agent route rejected the request.");
    }

    if (!response.body) {
      throw new Error("The agent stream did not return a body.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const chunk = await reader.read();

      if (chunk.done) {
        break;
      }

      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        const event = JSON.parse(line) as AgentStreamEvent;

        if (event.type === "status") {
          updateRun("Agent planner", event.value, "running");
        }

        if (event.type === "delta") {
          setMessagesByThread((current) => ({
            ...current,
            [threadId]: (current[threadId] || []).map((item) =>
              item.id === assistantId
                ? {
                    ...item,
                    content: item.content + event.value,
                  }
                : item,
            ),
          }));
        }

        if (event.type === "done") {
          if (event.relay?.enabled) {
            pendingRelayTextRef.current[threadId] = event.value;
          }

          setMessagesByThread((current) => ({
            ...current,
            [threadId]: (current[threadId] || []).map((item) =>
              item.id === assistantId
                ? {
                    ...item,
                    content: event.value,
                    status: event.relay?.enabled ? "local" : "synced",
                  }
                : item,
            ),
          }));

          updateRun(
            "Agent planner",
            event.relay?.enabled
              ? "Finished locally and mirrored to Tencent RTC Chat."
              : "Finished locally in preview mode.",
            "done",
          );
        }
      }
    }
  };

  const handleSend = async () => {
    const prompt = composer.trim();

    if (!prompt) {
      return;
    }

    const threadId = activeThreadId;
    setComposer("");

    appendPreviewMessage(threadId, {
      id: crypto.randomUUID(),
      role: "user",
      createdAt: nowLabel(),
      content: prompt,
      status: bridge.mode === "tencent" ? "local" : "synced",
      source: bridge.mode === "tencent" ? "preview" : "demo",
    });

    setThreads((current) =>
      current.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              temperature: "live",
              summary: prompt,
            }
          : thread,
      ),
    );

    if (bridge.mode === "tencent" && clientRef.current && threadId === "agent-inbox") {
      try {
        const message = clientRef.current.createTextMessage({
          to: credentials.agentUserId,
          conversationType: TencentCloudChat.TYPES.CONV_C2C,
          payload: {
            text: prompt,
          },
        });

        await clientRef.current.sendMessage(message);
        updateRun(
          "Tencent RTC Chat send",
          "User message sent to the bot conversation.",
          "done",
        );
      } catch (error) {
        setMessagesByThread((current) => ({
          ...current,
          [threadId]: (current[threadId] || []).map((item, index, list) =>
            index === list.length - 1 ? { ...item, status: "failed" } : item,
          ),
        }));
        updateRun(
          "Tencent RTC Chat send",
          error instanceof Error ? error.message : "Failed to send the TIM message.",
          "warning",
        );
      }
    }

    try {
      await streamAgentReply(prompt, threadId);
    } catch (error) {
      appendPreviewMessage(threadId, {
        id: crypto.randomUUID(),
        role: "system",
        createdAt: nowLabel(),
        content:
          error instanceof Error
            ? error.message
            : "The local agent preview failed before the relay finished.",
        accent: "Stream error",
        status: "failed",
      });
    }
  };

  const heroStats = [
    {
      icon: Orbit,
      label: "Async-first UX",
      value: "Built for agents that finish later, not just prompt-response demos",
    },
    {
      icon: RadioTower,
      label: "Real delivery layer",
      value: "History, unread state, revisit flow, and relay-ready bot messaging",
    },
    {
      icon: BellRing,
      label: "Free forever path",
      value: "Mock mode for demos, Tencent mode for the official free edition",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(114,255,194,0.12),_transparent_38%),linear-gradient(180deg,_#fbfcf8_0%,_#eef3eb_54%,_#e2e8df_100%)] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/70 bg-white/75 px-6 py-6 shadow-[0_20px_80px_rgba(33,41,35,0.08)] backdrop-blur">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">
                <Sparkles className="h-3.5 w-3.5" />
                Async Agent Inbox for Next.js
              </div>
              <h1 className="max-w-4xl font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold leading-[1.03] tracking-tight text-slate-950 sm:text-5xl xl:text-6xl">
                Ship an async agent inbox with real delivery, thread history, and
                follow-up built in.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                Use this starter when your AI product is more than a prompt box. It is
                designed for agents that take time to work and still need to deliver
                results after the user leaves the page. Tencent RTC Chat SDK provides
                the durable layer, and the official free edition page positions it as
                1,000 MAU free forever with Push support.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  href={consoleUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Create a Chat App
                  <ChevronRight className="h-4 w-4" />
                </a>
                <a
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  href={docsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Read Tencent RTC Chat Docs
                  <Link2 className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="grid flex-1 gap-3 sm:grid-cols-3 xl:max-w-2xl">
              {heroStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.6rem] border border-slate-200/80 bg-slate-950 px-4 py-4 text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  <item.icon className="h-5 w-5 text-emerald-300" />
                  <div className="mt-4 text-sm font-semibold">{item.label}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.45fr_0.95fr]">
          <aside className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-[0_18px_70px_rgba(20,28,24,0.07)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Threads
                </div>
                <h2 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
                  Agent Surfaces
                </h2>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                {visibleThreads.length} visible
              </div>
            </div>

            <label className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500">
              <Search className="h-4 w-4" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search angles, threads, owners"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </label>

            <div className="mt-5 space-y-3">
              {visibleThreads.map((thread) => {
                const active = thread.id === activeThreadId;

                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() =>
                      startTransition(() => {
                        setActiveThreadId(thread.id);
                        setThreads((current) =>
                          current.map((item) =>
                            item.id === thread.id ? { ...item, unread: 0 } : item,
                          ),
                        );
                      })
                    }
                    className={cn(
                      "w-full rounded-[1.5rem] border px-4 py-4 text-left transition",
                      active
                        ? "border-emerald-300 bg-emerald-50/90 shadow-[0_12px_32px_rgba(17,142,94,0.12)]"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {thread.title}
                          </span>
                          <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                            {thread.badge}
                          </span>
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                          {thread.platform}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          thread.temperature === "live" && "bg-emerald-500",
                          thread.temperature === "warm" && "bg-amber-500",
                          thread.temperature === "idle" && "bg-slate-300",
                        )}
                      />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{thread.summary}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                      <span>{thread.owner}</span>
                      <span>{thread.unread ? `${thread.unread} unread` : "clear"}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <WandSparkles className="h-4 w-4 text-emerald-600" />
                What hot repos taught us
              </div>
              <div className="mt-4 space-y-3">
                {researchPatterns.map((pattern) => (
                  <div key={pattern.title} className="rounded-2xl bg-white px-3 py-3">
                    <div className="text-sm font-semibold text-slate-900">{pattern.title}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">
                      {pattern.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_20px_80px_rgba(24,31,28,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 border-b border-slate-200/90 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Live Workspace
                </div>
                <h2 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold text-slate-950">
                  {activeThread.title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {activeThread.summary}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                  {bridge.mode === "mock" ? "Mock mode" : "Tencent mode"}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                  {bridge.relayEnabled ? "Server relay ready" : "Local preview"}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {activeMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[92%] rounded-[1.5rem] px-4 py-3 shadow-[0_10px_24px_rgba(19,26,23,0.06)] sm:max-w-[84%]",
                      message.role === "assistant" &&
                        "bg-slate-950 text-slate-50 ring-1 ring-white/5",
                      message.role === "user" &&
                        "bg-emerald-100 text-emerald-950 ring-1 ring-emerald-200",
                      message.role === "system" &&
                        "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">
                      {message.role === "assistant" && <Bot className="h-3.5 w-3.5" />}
                      {message.role === "user" && <MessageSquareText className="h-3.5 w-3.5" />}
                      {message.role === "system" && <Cpu className="h-3.5 w-3.5" />}
                      <span>{message.accent || message.role}</span>
                      <span>·</span>
                      <span>{message.createdAt}</span>
                      {message.status && (
                        <>
                          <span>·</span>
                          <span>{message.status}</span>
                        </>
                      )}
                    </div>
                    {message.role === "assistant" ? (
                      <div className="markdown-surface text-sm leading-7">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content || "_Streaming reply..._"}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-7">
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap gap-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setComposer(prompt)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-end gap-3">
                <label className="flex-1 rounded-[1.35rem] border border-slate-200 bg-white px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <textarea
                    value={composer}
                    onChange={(event) => setComposer(event.target.value)}
                    placeholder="Ask for a README, a product angle, a setup flow, or a Tencent RTC Chat SDK integration move."
                    rows={3}
                    className="min-h-[88px] w-full resize-none bg-transparent text-sm leading-7 outline-none placeholder:text-slate-400"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSend}
                  className="inline-flex h-13 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Send
                  <SendHorizonal className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_12px_36px_rgba(20,28,24,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Ops Feed
                  </div>
                  <div className="mt-1 font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-slate-950">
                    Agent runtime log
                  </div>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                  {runs.length} events
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-start gap-3 rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <span
                      className={cn(
                        "mt-1 h-2.5 w-2.5 rounded-full",
                        run.state === "done" && "bg-emerald-500",
                        run.state === "running" && "bg-sky-500",
                        run.state === "queued" && "bg-slate-300",
                        run.state === "warning" && "bg-amber-500",
                      )}
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{run.title}</div>
                      <div className="mt-1 text-sm leading-6 text-slate-600">{run.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>

          <aside className="rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_70px_rgba(20,28,24,0.07)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Tencent Mode
                </div>
                <h2 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
                  Control Tower
                </h2>
              </div>
              <div
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  bridge.status === "connected" && "bg-emerald-100 text-emerald-800",
                  bridge.status === "connecting" && "bg-amber-100 text-amber-800",
                  bridge.status === "error" && "bg-rose-100 text-rose-700",
                  bridge.status === "idle" && "bg-slate-100 text-slate-600",
                )}
              >
                {bridge.status}
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-950 px-4 py-4 text-slate-50">
              <div className="flex items-center gap-2 text-sm font-semibold">
                {bridge.status === "connecting" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin text-emerald-300" />
                ) : bridge.status === "connected" ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                ) : (
                  <CircleDashed className="h-4 w-4 text-slate-300" />
                )}
                Connection state
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{bridge.message}</p>
              <p className="mt-3 text-xs leading-6 text-slate-400">{bootstrap.reason}</p>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  <Command className="h-3.5 w-3.5" />
                  SDKAppID
                </span>
                <input
                  value={credentials.sdkAppId}
                  onChange={(event) =>
                    setCredentials((current) => ({
                      ...current,
                      sdkAppId: event.target.value,
                    }))
                  }
                  placeholder="From the TRTC Console"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-emerald-300 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  <Bot className="h-3.5 w-3.5" />
                  User ID
                </span>
                <input
                  value={credentials.userId}
                  onChange={(event) =>
                    setCredentials((current) => ({
                      ...current,
                      userId: event.target.value,
                    }))
                  }
                  placeholder="Use a unique test account"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-emerald-300 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  <KeyRound className="h-3.5 w-3.5" />
                  UserSig
                </span>
                <textarea
                  value={credentials.userSig}
                  onChange={(event) =>
                    setCredentials((current) => ({
                      ...current,
                      userSig: event.target.value,
                    }))
                  }
                  placeholder={
                    bridge.canIssueUserSig
                      ? "Leave blank to issue on the server route"
                      : "Paste a UserSig from the console or your own backend"
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-emerald-300 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  <RadioTower className="h-3.5 w-3.5" />
                  Agent User ID
                </span>
                <input
                  value={credentials.agentUserId}
                  onChange={(event) =>
                    setCredentials((current) => ({
                      ...current,
                      agentUserId: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-emerald-300 focus:bg-white"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={connectTencent}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
              >
                Connect Tencent
                <RadioTower className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={disconnectTencent}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Back to Mock
              </button>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-sm font-semibold text-slate-900">Why this flow converts</div>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                <li>1. Mock mode lets the repo feel alive before any cloud setup.</li>
                <li>2. Tencent mode gives serious builders a free-forever path into Tencent RTC Chat SDK.</li>
                <li>3. Production still requires server-side UserSig issuing and bot relay.</li>
              </ul>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
              <div className="text-sm font-semibold text-slate-900">Docs shortcut</div>
              <div className="mt-3 space-y-2 text-sm">
                <a
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 text-slate-700 transition hover:bg-slate-100"
                  href={consoleUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open TRTC Console
                  <ChevronRight className="h-4 w-4" />
                </a>
                <a
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 text-slate-700 transition hover:bg-slate-100"
                  href={userSigUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Generate UserSig securely
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
              <div className="font-semibold">Best-practice note</div>
              <p className="mt-2">
                Do not ship a client-side secret key. Use the server route only as a
                demo scaffold, then move UserSig issuing behind your own auth layer.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
