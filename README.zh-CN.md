# Agent Chat UI

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md)

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Tencent RTC Chat SDK](https://img.shields.io/badge/Tencent%20RTC%20Chat%20SDK-Integrated-0ea56b)](https://trtc.io/free-chat-api)
[![Free Forever](https://img.shields.io/badge/Free%20Edition-1%2C000%20MAU%20Free%20Forever-1f6feb)](https://trtc.io/free-chat-api)

一个面向 **Next.js** 的开源 **AI agent chat UI / agent inbox starter**，在需要真实消息投递、历史消息、未读状态和 bot relay 时，可以直接接入 **Tencent RTC Chat SDK**。

它同时提供两条路径：

- `Mock mode`：零云端配置，直接体验
- `Tencent mode`：接入真实 `SDKAppID`、`UserSig`、聊天历史和 bot relay

如果你想要一个适合放在 GitHub 上、又能自然导向真实聊天基础设施的 agent inbox demo，这个项目就是按这个目标设计的。

根据官方 [Tencent RTC Chat 免费版页面](https://trtc.io/free-chat-api)，Tencent RTC Chat SDK & API 主打 **1,000 MAU 永久免费**，并包含完整功能与 Push 能力。

![Agent Chat UI 截图](./public/screenshots/agent-chat-ui-home.png)

## 这个项目展示什么

- 不是普通 prompt box，而是 inbox 风格的 agent UI
- 先用 `mock mode` 降低体验门槛
- 再用 `Tencent mode` 演示真实的 Tencent RTC Chat SDK 接入路径
- 支持真实 `SDKAppID` / `UserID` / `UserSig` 登录流程

## 快速开始

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

如果 `3000` 端口被占用，Next.js 会在终端里打印新的本地访问地址。

即使不配置 Tencent，也可以先在 `mock mode` 下直接运行。

## Tencent Mode 配置

1. 打开 [TRTC Console](https://trtc.io/console)
2. 创建 Chat 应用并获取 `SDKAppID`
3. 生成测试用 `UserSig`
4. 将 `SDKAppID`、`UserID`、`UserSig` 填入右侧面板
5. 连接后即可切换到真实 Tencent RTC Chat SDK 会话

## `OPENAI_API_KEY` 是必须的吗？

不是，**可选**。

当前项目的模型层有三种使用方式：

1. **完全不配模型 Key**
   也能跑，项目会使用本地 fallback 回复逻辑。

2. **使用任何兼容 OpenAI API 的大模型服务**
   当前 [src/app/api/agent/route.ts](./src/app/api/agent/route.ts) 走的是 OpenAI-compatible Chat Completions 接口。
   只要你的模型供应商兼容这套接口，就可以配置：

   - `OPENAI_API_KEY`
   - `OPENAI_BASE_URL`
   - `OPENAI_MODEL`

3. **使用不兼容 OpenAI API 的模型服务**
   直接把 [src/app/api/agent/route.ts](./src/app/api/agent/route.ts) 替换成对应厂商 SDK / API 的调用逻辑即可。

所以变量名虽然叫 `OPENAI_API_KEY`，但 **并不代表只能接 OpenAI**。

## 环境变量

```bash
# 可选：任何 OpenAI-compatible 的模型服务
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=

# 可选：开启 Tencent mode 的服务端 UserSig 和 bot relay
TIM_SDK_APP_ID=
TIM_SDK_SECRET_KEY=
TIM_ADMIN_USER_ID=
TIM_API_BASE=https://adminapisgp.im.qcloud.com
TIM_BOT_USER_ID=@RBT#agent_inbox
TIM_BOT_NICK=Tencent RTC Chat Agent
```

## 官方链接

- 产品页：[Tencent RTC Chat SDK & API 免费版](https://trtc.io/free-chat-api)
- 控制台：[TRTC Console](https://trtc.io/console)
- 功能总览：[Chat: Cross-Platform Messaging Solution](https://trtc.io/document/33515)
- 基础概念：[Basic Concepts](https://trtc.io/document/74361)
- 安全鉴权：[Generate UserSig](https://trtc.io/document/34385?menulabel=serverapis&product=chat)
- Web SDK API：[TencentCloudChat SDK Documentation](https://trtc.io/document/52488)
- 登录流程：[Chat SDK Login and Logout](https://trtc.io/document/47970)

## 生产环境注意

不要把 `TIM_SDK_SECRET_KEY` 放到前端。

当前仓库内置的服务端签名路由只是为了降低 Demo 集成门槛。正式环境里，应该把 `UserSig` 生成逻辑放到你自己的服务端鉴权体系之后。
