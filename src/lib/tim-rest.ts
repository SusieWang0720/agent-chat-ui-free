import { createRequire } from "module";

const require = createRequire(import.meta.url);
const TLSSigAPI = require("tls-sig-api-v2");

export type TimRelayStatus = {
  enabled: boolean;
  relayMode: "none" | "robot-stream";
  reason?: string;
  botUserId?: string;
};

type TimServerConfig = {
  sdkAppId: number;
  sdkSecretKey: string;
  adminUserId: string;
  apiBase: string;
  botUserId: string;
  botNick: string;
};

type TimApiResponse = {
  ActionStatus?: string;
  ErrorCode?: number;
  ErrorInfo?: string;
  MsgKey?: string;
};

const DEFAULT_TIM_API_BASE = "https://adminapisgp.im.qcloud.com";
const DEFAULT_BOT_USER_ID = "@RBT#agent_inbox";
const DEFAULT_BOT_NICK = "TIMSDK Agent";
const USER_SIG_EXPIRE_SECONDS = 60 * 60 * 24 * 180;

export function getTimServerConfig(): TimServerConfig | null {
  const sdkAppId = Number(process.env.TIM_SDK_APP_ID || "");
  const sdkSecretKey = process.env.TIM_SDK_SECRET_KEY || "";
  const adminUserId = process.env.TIM_ADMIN_USER_ID || "";

  if (!sdkAppId || !sdkSecretKey || !adminUserId) {
    return null;
  }

  return {
    sdkAppId,
    sdkSecretKey,
    adminUserId,
    apiBase: process.env.TIM_API_BASE || DEFAULT_TIM_API_BASE,
    botUserId: process.env.TIM_BOT_USER_ID || DEFAULT_BOT_USER_ID,
    botNick: process.env.TIM_BOT_NICK || DEFAULT_BOT_NICK,
  };
}

export function createUserSig(userId: string) {
  const config = getTimServerConfig();

  if (!config) {
    throw new Error(
      "TIM server credentials are missing. Set TIM_SDK_APP_ID, TIM_SDK_SECRET_KEY, and TIM_ADMIN_USER_ID first.",
    );
  }

  const api = new TLSSigAPI.Api(config.sdkAppId, config.sdkSecretKey);

  return api.genSig(userId, USER_SIG_EXPIRE_SECONDS);
}

function buildRestUrl(config: TimServerConfig, path: string) {
  const query = new URLSearchParams({
    sdkappid: String(config.sdkAppId),
    identifier: config.adminUserId,
    usersig: createUserSig(config.adminUserId),
    random: String(Math.floor(Math.random() * 1_000_000_000)),
    contenttype: "json",
  });

  return `${config.apiBase}${path}?${query.toString()}`;
}

async function timRequest(
  config: TimServerConfig,
  path: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(buildRestUrl(config, path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await response.json()) as TimApiResponse;

  if (!response.ok) {
    throw new Error(
      `TIM REST request failed with HTTP ${response.status}: ${JSON.stringify(data)}`,
    );
  }

  return data;
}

export async function ensureRobot() {
  const config = getTimServerConfig();

  if (!config) {
    return {
      enabled: false,
      relayMode: "none",
      reason: "TIM relay env vars are not configured.",
    } satisfies TimRelayStatus;
  }

  try {
    const result = await timRequest(config, "/v4/openim_robot_http_svc/create_robot", {
      UserID: config.botUserId,
      Nick: config.botNick,
    });

    if (result.ErrorCode && result.ErrorCode !== 0) {
      return {
        enabled: false,
        relayMode: "none",
        reason: result.ErrorInfo || `Robot bootstrap failed (${result.ErrorCode}).`,
        botUserId: config.botUserId,
      } satisfies TimRelayStatus;
    }

    return {
      enabled: true,
      relayMode: "robot-stream",
      botUserId: config.botUserId,
    } satisfies TimRelayStatus;
  } catch (error) {
    return {
      enabled: false,
      relayMode: "none",
      reason:
        error instanceof Error
          ? error.message
          : "Unknown error while preparing the chatbot account.",
      botUserId: config.botUserId,
    } satisfies TimRelayStatus;
  }
}

function chunkText(text: string, size = 140) {
  const chunks: string[] = [];

  let cursor = 0;

  while (cursor < text.length) {
    chunks.push(text.slice(cursor, cursor + size));
    cursor += size;
  }

  return chunks;
}

export async function relayRobotResponse(toUserId: string, text: string) {
  const config = getTimServerConfig();

  if (!config) {
    return {
      enabled: false,
      relayMode: "none",
      reason: "TIM relay env vars are not configured.",
    } satisfies TimRelayStatus;
  }

  const bootstrap = await ensureRobot();

  if (!bootstrap.enabled) {
    return bootstrap;
  }

  const chunks = chunkText(text);
  let msgKey = "";

  for (let index = 0; index < chunks.length; index += 1) {
    const payload: Record<string, unknown> = {
      From_Account: config.botUserId,
      To_Account: toUserId,
      Chunk: chunks[index],
    };

    if (msgKey) {
      payload.MsgKey = msgKey;
    }

    if (index === chunks.length - 1) {
      payload.Finish = 1;
    }

    const result = await timRequest(
      config,
      "/v4/openim_robot_http_svc/send_stream_msg",
      payload,
    );

    if (!msgKey && result.MsgKey) {
      msgKey = result.MsgKey;
    }
  }

  return {
    enabled: true,
    relayMode: "robot-stream",
    botUserId: config.botUserId,
  } satisfies TimRelayStatus;
}
