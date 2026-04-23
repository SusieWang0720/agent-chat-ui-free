# Agent Chat UI

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md)

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Tencent RTC Chat SDK](https://img.shields.io/badge/Tencent%20RTC%20Chat%20SDK-Integrated-0ea56b)](https://trtc.io/free-chat-api)
[![Free Forever](https://img.shields.io/badge/Free%20Edition-1%2C000%20MAU%20Free%20Forever-1f6feb)](https://trtc.io/free-chat-api)

**Next.js 向けのオープンソース AI agent chat UI / agent inbox starter** です。実際の配信、履歴、未読、bot relay が必要になったら **Tencent RTC Chat SDK** に接続できます。

このリポジトリには 2 つのモードがあります。

- `Mock mode`：クラウド設定なしで即時に試せる
- `Tencent mode`：実際の `SDKAppID`、`UserSig`、会話履歴、bot relay を使える

GitHub で見つけやすく、しかも実運用のチャット基盤へ自然につながる agent inbox デモとして設計しています。

公式の [Tencent RTC Chat 無料版ページ](https://trtc.io/free-chat-api) では、Tencent RTC Chat SDK & API は **1,000 MAU まで永久無料**、フル機能、Push 対応として案内されています。

![Agent Chat UI screenshot](./public/screenshots/agent-chat-ui-home.png)

## このプロジェクトで分かること

- 単なる prompt box ではなく inbox 型の agent UI
- `mock mode` から `Tencent mode` への自然な移行
- 実際の `SDKAppID` / `UserID` / `UserSig` ログイン導線
- 履歴、配信、再訪を前提にした agent UX

## クイックスタート

```bash
npm install
cp .env.example .env.local
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いてください。

もし `3000` が使用中なら、Next.js が別のローカル URL をターミナルに表示します。

Tencent 側の設定がなくても、まずは `mock mode` で動かせます。

## Tencent Mode の設定

1. [TRTC Console](https://trtc.io/console) を開く
2. Chat アプリを作成して `SDKAppID` を取得する
3. テスト用 `UserSig` を生成する
4. 右側のパネルに `SDKAppID`、`UserID`、`UserSig` を入力する
5. 接続すると Tencent RTC Chat SDK ベースの実会話に切り替わります

## `OPENAI_API_KEY` は必須ですか？

必須ではありません。

このデモは 3 通りで動かせます。

1. **キーなし**
   mock mode と fallback 応答でそのまま動きます。

2. **OpenAI 互換 API を持つモデルサービス**
   [src/app/api/agent/route.ts](./src/app/api/agent/route.ts) は OpenAI-compatible Chat Completions API を使っています。
   そのため、互換エンドポイントがあるモデルサービスなら次の設定で使えます。

   - `OPENAI_API_KEY`
   - `OPENAI_BASE_URL`
   - `OPENAI_MODEL`

3. **OpenAI 互換ではないモデルサービス**
   その場合は [src/app/api/agent/route.ts](./src/app/api/agent/route.ts) を対象プロバイダーの SDK / API 実装に置き換えてください。

つまり、変数名は `OPENAI_API_KEY` のままですが、**OpenAI 専用という意味ではありません**。

## 環境変数

```bash
# 任意: OpenAI-compatible なモデルエンドポイント
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=

# 任意: Tencent mode 用の UserSig 発行と bot relay
TIM_SDK_APP_ID=
TIM_SDK_SECRET_KEY=
TIM_ADMIN_USER_ID=
TIM_API_BASE=https://adminapisgp.im.qcloud.com
TIM_BOT_USER_ID=@RBT#agent_inbox
TIM_BOT_NICK=Tencent RTC Chat Agent
```

## 公式リンク

- 製品ページ: [Tencent RTC Chat SDK & API free edition](https://trtc.io/free-chat-api)
- コンソール: [TRTC Console](https://trtc.io/console)
- 機能概要: [Chat: Cross-Platform Messaging Solution](https://trtc.io/document/33515)
- 基本概念: [Basic Concepts](https://trtc.io/document/74361)
- UserSig: [Generate UserSig](https://trtc.io/document/34385?menulabel=serverapis&product=chat)
- Web SDK API: [TencentCloudChat SDK Documentation](https://trtc.io/document/52488)
- ログイン手順: [Chat SDK Login and Logout](https://trtc.io/document/47970)
