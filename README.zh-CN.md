# Agent Chat UI

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md)

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Tencent RTC Chat SDK](https://img.shields.io/badge/Tencent%20RTC%20Chat%20SDK-Integrated-0ea56b)](https://trtc.io/free-chat-api)
[![Free Forever](https://img.shields.io/badge/Free%20Edition-1%2C000%20MAU%20Free%20Forever-1f6feb)](https://trtc.io/free-chat-api)

**给“不会立刻完成任务”的 AI agent 做一个真正的 inbox。**

这个项目是一个 **面向 Next.js 的 AI 产品前端 starter**。  
它不替代你的大模型或 agent 后端，它补的是另一层：

- inbox 风格 UI，而不是普通 prompt box
- 真实会话线程
- 历史消息和再次访问体验
- 从本地 demo 到 Tencent RTC Chat SDK 接入的路径

如果你只是做一个简单的 AI 聊天页，这个项目未必必要。  
如果你的 agent 会执行较长任务，希望产品更像“真实消息系统”而不是“页面内问答框”，这个项目就更适合。

根据官方 [Tencent RTC Chat 免费版页面](https://trtc.io/free-chat-api)，Tencent RTC Chat SDK & API 主打 **1,000 MAU 永久免费**，并包含完整功能与 Push 能力。

![Agent Chat UI 截图](./public/screenshots/agent-chat-ui-home.png)

## 它可以拿来做什么？

- AI 客服 inbox，把客户问题和回复都放进持续存在的会话线程
- AI 运维助手，查日志、查工单、查监控后把结果回到同一线程
- AI 内部办公助手，任务完成后把结果继续发回原会话

## 为什么有人会用它？

很多 AI demo 只做到：

1. 用户发一句
2. AI 回一句
3. 一切都只是页面内的临时状态

做 demo 可以。  
但做产品时，通常还需要：

- 刷新后还能看到历史
- 用户回来后还能继续接着聊
- 有未读状态，而不是假设用户一直停留在页面
- 后续能往 bot relay、通知、人工接管扩展

这个项目的价值，不是让 “AI 能回答”，而是让 “AI 在一个持久 inbox 里回答”。

## 这个项目包含什么？

- `Mock mode`
  不配云端也能马上跑，带 seeded threads 和 fallback 回复。

- `Tencent mode`
  接入真实 `SDKAppID`、`UserID`、`UserSig`，用 Tencent RTC Chat SDK 做真实交付层。

- `Agent route starter`
  内置一个兼容 OpenAI 接口的服务端 route，你可以直接换成自己的 provider 或 agent backend。

## 一个很具体的场景

假设你在做一个电商 AI 客服助手。

1. 用户问：`为什么这个订单延迟了？顺便帮我草拟一段回复客户的话。`
2. 你的后端 agent 去查订单、物流和知识库。
3. 这个过程可能要 30 到 90 秒。
4. 结果应该回到同一个会话线程里，而不是只存在于某个页面局部状态里。

这就是这个项目最适合解决的问题。

## 什么时候其实不需要 Tencent RTC Chat SDK？

如果你只需要：

- 一个简单的 AI 聊天页
- 一个 Web 应用
- 一个当前会话
- 把消息存在你自己的数据库里

那不用 Tencent RTC Chat SDK 也完全可以。

## 什么时候 Tencent RTC Chat SDK 开始有价值？

当你想把 AI 产品做得更像“真实消息产品”时，它会更有意义：

- 持久会话线程
- 历史同步
- 未读状态
- 更好的再次访问体验
- 更清晰的多端连续性路径
- 后续接 bot relay、通知、人工接管更顺

可以简单理解成：

- 不用它：你做的是一个 AI 聊天页
- 用了它：你更接近一个 AI 消息产品

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

1. 打开 [TRTC Console](https://console.trtc.io)
2. 创建 Chat 应用并获取 `SDKAppID`
3. 生成测试用 `UserSig`
4. 将 `SDKAppID`、`UserID`、`UserSig` 填入右侧面板
5. 连接后即可切换到真实 Tencent RTC Chat SDK 会话

## `OPENAI_API_KEY` 是必须的吗？

不是，**可选**。

这个 demo 有三种用法：

1. **完全不配模型 Key**
   也能跑，会使用本地 seeded 数据和 fallback 回复。

2. **接任何兼容 OpenAI API 的模型服务**
   当前 [src/app/api/agent/route.ts](./src/app/api/agent/route.ts) 使用的是 OpenAI-compatible Chat Completions 接口。
   如果你的模型服务兼容这套接口，就配置：

   - `OPENAI_API_KEY`
   - `OPENAI_BASE_URL`
   - `OPENAI_MODEL`

3. **接其他不兼容 OpenAI API 的模型服务**
   直接把 [src/app/api/agent/route.ts](./src/app/api/agent/route.ts) 换成对应厂商的 SDK 或 API 调用即可。

所以虽然变量名叫 `OPENAI_API_KEY`，但并不代表只能接 OpenAI。

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
- 控制台：[TRTC Console](https://console.trtc.io)
- 功能总览：[Chat: Cross-Platform Messaging Solution](https://trtc.io/document/33515)
- 基础概念：[Basic Concepts](https://trtc.io/document/74361)
- 安全鉴权：[Generate UserSig](https://trtc.io/document/34385?menulabel=serverapis&product=chat)
- Web SDK API：[TencentCloudChat SDK Documentation](https://trtc.io/document/52488)
- 登录流程：[Chat SDK Login and Logout](https://trtc.io/document/47970)

## 生产环境注意

不要把 `TIM_SDK_SECRET_KEY` 放到前端。

当前仓库内置的服务端签名路由只是为了降低 demo 集成门槛。正式环境里，应该把 `UserSig` 生成逻辑放到你自己的服务端鉴权体系之后。

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```
