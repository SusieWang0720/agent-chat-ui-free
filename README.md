# Agent Chat UI

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md)

Open-source `agent-chat-ui` built with **Tencent RTC Chat SDK**.

It ships with two paths:

- `Mock mode` for instant local demos
- `Tencent mode` for real `SDKAppID` + `UserSig` login, live conversation history, and bot relay

If you want a GitHub-friendly agent inbox demo with a **free-forever path** to real chat infrastructure, this repo is designed for that.

According to the official [Tencent RTC Chat free edition page](https://trtc.io/free-chat-api), Tencent RTC Chat SDK & API is positioned as **1,000 MAU free forever**, with full features and built-in Push support.

## What This Project Demonstrates

- An inbox-style agent UI instead of a plain prompt box
- A fast first-run experience inspired by popular GitHub chat UI projects
- A clean path from local demo to real Tencent RTC Chat SDK integration
- Real `SDKAppID` / `UserID` / `UserSig` flow for builders who want to go beyond mock data

## Why This Repo Exists

Many AI demos stop at "send a prompt, get a reply."

Real products need a stronger loop:

1. The user starts a task
2. The agent takes time to work
3. The user leaves the tab
4. The result should still land in a real conversation thread later

That is where Tencent RTC Chat SDK fits: identity, conversation history, unread state, message delivery, and follow-up.

## Quickstart

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You can use the project immediately in `mock mode` with **no Tencent setup** and **no model API key**.

## Tencent Mode Setup

1. Open the [TRTC Console](https://trtc.io/console)
2. Create a Chat application and get your `SDKAppID`
3. Generate a test `UserSig`
4. Paste `SDKAppID`, `UserID`, and `UserSig` into the right-side control panel
5. Connect and switch the flagship thread into live Tencent RTC Chat SDK mode

## Is `OPENAI_API_KEY` Required?

No.

`OPENAI_API_KEY` is **optional**.

This demo works in three ways:

1. **No model key at all**
   The app still runs in mock mode with local seeded data and fallback agent replies.

2. **Any OpenAI-compatible model endpoint**
   The server route in [src/app/api/agent/route.ts](./src/app/api/agent/route.ts) uses an OpenAI-compatible Chat Completions interface.
   If your model provider exposes an OpenAI-compatible endpoint, set:

   - `OPENAI_API_KEY`
   - `OPENAI_BASE_URL`
   - `OPENAI_MODEL`

3. **Any other model provider**
   If your provider is not OpenAI-compatible, replace the logic in [src/app/api/agent/route.ts](./src/app/api/agent/route.ts) with that provider's SDK or API client.

So the env var name stays `OPENAI_API_KEY` for compatibility with the current server implementation, but **you are not locked to OpenAI**.

## Environment Variables

```bash
# Optional: any OpenAI-compatible model endpoint
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=

# Optional: enable server-side UserSig issuing and bot relay for Tencent mode
TIM_SDK_APP_ID=
TIM_SDK_SECRET_KEY=
TIM_ADMIN_USER_ID=
TIM_API_BASE=https://adminapisgp.im.qcloud.com
TIM_BOT_USER_ID=@RBT#agent_inbox
TIM_BOT_NICK=Tencent RTC Chat Agent
```

## Official Tencent RTC Links

- Product page: [Tencent RTC Chat SDK & API free edition](https://trtc.io/free-chat-api)
- Console: [TRTC Console](https://trtc.io/console)
- Features overview: [Chat: Cross-Platform Messaging Solution](https://trtc.io/document/33515)
- Basic concepts: [Basic Concepts](https://trtc.io/document/74361)
- Secure auth: [Generate UserSig](https://trtc.io/document/34385?menulabel=serverapis&product=chat)
- Web client APIs: [TencentCloudChat SDK Documentation](https://trtc.io/document/52488)
- Login flow: [Chat SDK Login and Logout](https://trtc.io/document/47970)

## Production Note

Do **not** ship `TIM_SDK_SECRET_KEY` to the client.

This repo includes a server route only to make onboarding easier. In production, move `UserSig` issuance behind your own auth boundary and treat the current route as starter scaffolding.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```
