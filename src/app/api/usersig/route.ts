import { createUserSig, getTimServerConfig } from "@/lib/tim-rest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { userId, sdkAppId } = (await request.json()) as {
    userId?: string;
    sdkAppId?: number;
  };

  const config = getTimServerConfig();

  if (!config) {
    return Response.json(
      {
        error:
          "Server-side UserSig issuing is not enabled. Add TIM_SDK_APP_ID, TIM_SDK_SECRET_KEY, and TIM_ADMIN_USER_ID.",
      },
      { status: 400 },
    );
  }

  if (!userId || !userId.trim()) {
    return Response.json(
      { error: "A userId is required to issue a UserSig." },
      { status: 400 },
    );
  }

  if (sdkAppId && Number(sdkAppId) !== config.sdkAppId) {
    return Response.json(
      {
        error: `The requested SDKAppID (${sdkAppId}) does not match the server configuration (${config.sdkAppId}).`,
      },
      { status: 400 },
    );
  }

  return Response.json({
    sdkAppId: config.sdkAppId,
    userSig: createUserSig(userId.trim()),
  });
}
