# Agent Chat UI

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md)

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Tencent RTC Chat SDK](https://img.shields.io/badge/Tencent%20RTC%20Chat%20SDK-Integrated-0ea56b)](https://trtc.io/free-chat-api)
[![Free Forever](https://img.shields.io/badge/Free%20Edition-1%2C000%20MAU%20Free%20Forever-1f6feb)](https://trtc.io/free-chat-api)

**Next.js 向けのオープンソース非同期 agent inbox** です。

これは単なる prompt box ではありません。時間のかかる AI タスクがあり、ユーザーがページを離れた後でも結果を会話スレッドに戻したいプロダクト向けです。

**Tencent RTC Chat SDK** は配信レイヤーとして機能します。履歴、未読、フォローアップ、bot relay を扱います。

LLM や agent backend 自体は別途必要です。このリポジトリは **AI API の代替ではなく**、AI プロダクトに inbox と配信レイヤーを与えるものです。

このリポジトリには 2 つのモードがあります。

- `Mock mode`：クラウド設定なしで即時に試せる
- `Tencent mode`：実際の `SDKAppID`、`UserSig`、会話履歴、bot relay を使える

GitHub で見つけやすく、しかも実運用のチャット基盤へ自然につながる agent inbox デモとして設計しています。

公式の [Tencent RTC Chat 無料版ページ](https://trtc.io/free-chat-api) では、Tencent RTC Chat SDK & API は **1,000 MAU まで永久無料**、フル機能、Push 対応として案内されています。

![Agent Chat UI screenshot](./public/screenshots/agent-chat-ui-home.png)

## このリポジトリが何であるか

- 長時間かかる AI タスク向けの inbox 型フロントエンド
- 非同期配信、スレッド履歴、再訪 UX を持つ Next.js starter
- `mock mode` から `Tencent mode` に切り替えると Tencent RTC Chat SDK integration demo にもなる

## 具体的なユースケース

EC アプリ向けの AI サポートエージェントを作っているとします。

1. ユーザーが `なぜ注文が遅れているのか、顧客向け返信文も下書きして` と依頼する
2. バックエンド agent が注文情報、配送状況、社内ナレッジを確認する。30-90 秒かかる場合がある
3. その間にユーザーはページを離れる
4. 結果は履歴・未読状態付きの実際の会話スレッドに返ってくる

このリポジトリがないと、その「結果をどう戻すか」の体験を自前で作る必要があります。この repo を使えば、agent backend に集中しつつ、持続的な inbox レイヤーを Tencent RTC Chat SDK で持てます。

## このリポジトリが何ではないか

- 汎用マルチモデル chat playground ではない
- LangGraph や OpenAI Agents のような agent framework ではない
- UX を欠いた単なる SDK サンプルでもない

## Tencent RTC Chat SDK を使わない場合との違い

単純な AI chat ページだけが必要なら、Tencent RTC Chat SDK なしでも作れます。

**Tencent RTC Chat SDK なし**

- 基本的な prompt-response ページには十分
- メッセージは自前の DB に保存できる
- 単一 Web アプリ、単一セッション、単純な履歴に向いている

**Tencent RTC Chat SDK あり**

- AI プロダクトを本物の messaging product のように振る舞わせやすい
- 実際の会話スレッド、履歴同期、未読状態、再訪時の配信
- マルチデバイス継続、bot relay、通知、human handoff への拡張がしやすい

「AI が返答できる」だけなら不要です。この repo は「AI が持続的な inbox の中で返答する」体験を作りたいときに向いています。

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

1. [TRTC Console](https://console.trtc.io) を開く
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
- コンソール: [TRTC Console](https://console.trtc.io)
- 機能概要: [Chat: Cross-Platform Messaging Solution](https://trtc.io/document/33515)
- 基本概念: [Basic Concepts](https://trtc.io/document/74361)
- UserSig: [Generate UserSig](https://trtc.io/document/34385?menulabel=serverapis&product=chat)
- Web SDK API: [TencentCloudChat SDK Documentation](https://trtc.io/document/52488)
- ログイン手順: [Chat SDK Login and Logout](https://trtc.io/document/47970)
