import { ensureRobot, getTimServerConfig } from "@/lib/tim-rest";

export const runtime = "nodejs";

export async function GET() {
  const config = getTimServerConfig();
  const robot = await ensureRobot();

  return Response.json({
    hasServerUserSig: Boolean(config),
    hasRelay: robot.enabled,
    relayMode: robot.relayMode,
    botUserId: robot.botUserId,
    reason: robot.reason,
    configuredAppId: config?.sdkAppId ?? null,
  });
}
