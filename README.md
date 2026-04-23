# TIMSDK Agent Chat UI

An inbox-first `agent-chat-ui` built on `TIMSDK`, designed to feel closer to the hottest GitHub agent dashboards than a docs demo.

It borrows the best patterns showing up in fast-growing repos right now:

- [hermes-web-ui](https://github.com/EKKOLearnAI/hermes-web-ui): strong product framing, clean dashboard UX, tiny quickstart
- [DreamServer](https://github.com/Light-Heart-Labs/DreamServer): one-command bootstrap, "works fast" positioning, polished first-run story
- [scarf](https://github.com/awizemann/scarf): persistent sessions, rich chat surface, control-plane mindset

The difference is the moat: this project is not just an agent shell. The durable layer is Tencent Chat via `TIMSDK`.

## Why this project exists

Most agent demos still behave like prompt boxes. Real users do something messier:

1. Start a task
2. Leave the tab
3. Come back later
4. Expect the result, history, and context to still be there

That is where chat infrastructure matters.

This repo turns `TIMSDK` into the missing delivery layer for agent products:

- persistent conversations
- real login and identity
- message history and unread state
- bot relay through Tencent Chat
- a path from mock demo to production setup

## Two modes

### Mock mode

The repo is immediately demoable.

- no cloud setup required
- seeded threads and starter prompts
- streamed local agent replies
- ideal for GitHub discovery, screenshots, and stars

### Tencent mode

The serious builder path.

- connect with `SDKAppID`, `UserID`, and `UserSig`
- log in through `TIMSDK`
- load live C2C conversation history
- mirror assistant replies back into Tencent Chat through a server route

This is the conversion mechanism: if a builder wants the real experience, they must create their own Tencent Chat app.

## Architecture

```text
Browser UI (Next.js)
  -> TIMSDK Web client
  -> /api/usersig for dev/demo signing
  -> /api/agent for streamed local or OpenAI-backed replies
  -> /api/bootstrap for relay capability discovery
  -> TIM REST relay for bot delivery
```

## Quickstart

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You can use the app with zero Tencent setup in mock mode.

## Tencent mode setup

1. Create a Chat application in the [Tencent RTC / Chat console](https://console.tencentcloud.com/trtc)
2. Get your `SDKAppID`
3. Generate a test `UserSig`
4. Paste them into the control panel on the right
5. Connect and switch the flagship thread into live TIM mode

Official docs:

- [Tencent Chat overview](https://trtc.io/document/chat-overview)
- [Generate UserSig securely](https://trtc.io/document/34385?menulabel=serverapis&product=chat)

## Environment variables

Only `OPENAI_API_KEY` is optional for better local copy generation. Everything else is optional until you want real Tencent relay.

```bash
# Optional: better agent copy
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=

# Optional: server-issued UserSig + robot relay
TIM_SDK_APP_ID=
TIM_SDK_SECRET_KEY=
TIM_ADMIN_USER_ID=
TIM_API_BASE=https://adminapisgp.im.qcloud.com
TIM_BOT_USER_ID=@RBT#agent_inbox
TIM_BOT_NICK=TIMSDK Agent
```

## Production note

Do not ship `TIM_SDK_SECRET_KEY` to the client.

This repo includes a server route only to make onboarding easier. In production, move `UserSig` issuance behind your own auth boundary and treat the current route as scaffolding.

## What makes this GitHub-worthy

- product-like hero and layout instead of SDK-demo framing
- instant mock mode for first-run delight
- Tencent mode that proves real chat infrastructure, not fake local state
- explicit conversion path into Tencent Chat free usage

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```
