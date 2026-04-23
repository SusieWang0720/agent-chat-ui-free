# Agent Chat UI

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md)

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Tencent RTC Chat SDK](https://img.shields.io/badge/Tencent%20RTC%20Chat%20SDK-Integrated-0ea56b)](https://trtc.io/free-chat-api)
[![Free Forever](https://img.shields.io/badge/Free%20Edition-1%2C000%20MAU%20Free%20Forever-1f6feb)](https://trtc.io/free-chat-api)

**Next.js용 오픈소스 AI agent chat UI / agent inbox starter** 입니다. 실제 메시지 전달, 이력, 읽지 않음 상태, bot relay 가 필요해지면 **Tencent RTC Chat SDK** 와 연결할 수 있습니다.

이 리포지토리는 두 가지 경로를 제공합니다.

- `Mock mode` : 클라우드 설정 없이 바로 실행
- `Tencent mode` : 실제 `SDKAppID`, `UserSig`, 대화 이력, bot relay 사용

GitHub 에서 발견되기 쉽고, 실제 채팅 인프라로 자연스럽게 이어지는 agent inbox 데모를 목표로 설계했습니다.

공식 [Tencent RTC Chat 무료 페이지](https://trtc.io/free-chat-api)에 따르면, Tencent RTC Chat SDK & API 는 **1,000 MAU까지 영구 무료**이며 전체 기능과 Push 기능을 제공합니다.

![Agent Chat UI screenshot](./public/screenshots/agent-chat-ui-home.png)

## 이 프로젝트가 보여주는 것

- 단순한 prompt box 가 아닌 inbox 스타일 agent UI
- `mock mode` 에서 `Tencent mode` 로 자연스럽게 넘어가는 흐름
- 실제 `SDKAppID` / `UserID` / `UserSig` 로그인 경로
- 이력, 전달, 재방문을 전제로 한 agent UX

## 빠른 시작

```bash
npm install
cp .env.example .env.local
npm run dev
```

[http://localhost:3000](http://localhost:3000) 을 열어 보세요.

`3000` 포트가 이미 사용 중이면 Next.js 가 새 로컬 주소를 터미널에 출력합니다.

Tencent 설정이 없어도 먼저 `mock mode` 로 바로 실행할 수 있습니다.

## Tencent Mode 설정

1. [TRTC Console](https://trtc.io/console) 열기
2. Chat 앱을 만들고 `SDKAppID` 받기
3. 테스트용 `UserSig` 생성
4. 오른쪽 패널에 `SDKAppID`, `UserID`, `UserSig` 입력
5. 연결 후 Tencent RTC Chat SDK 기반의 실제 대화 흐름으로 전환

## `OPENAI_API_KEY` 가 꼭 필요한가요?

아니요. **선택 사항**입니다.

이 데모는 세 가지 방식으로 동작할 수 있습니다.

1. **키 없이 실행**
   mock mode 와 fallback 응답으로 그대로 실행됩니다.

2. **OpenAI 호환 API 를 제공하는 모델 서비스 사용**
   [src/app/api/agent/route.ts](./src/app/api/agent/route.ts) 는 OpenAI-compatible Chat Completions 인터페이스를 사용합니다.
   따라서 호환 엔드포인트가 있으면 아래 값으로 연결할 수 있습니다.

   - `OPENAI_API_KEY`
   - `OPENAI_BASE_URL`
   - `OPENAI_MODEL`

3. **OpenAI 호환이 아닌 모델 서비스 사용**
   이 경우 [src/app/api/agent/route.ts](./src/app/api/agent/route.ts) 를 해당 공급자의 SDK / API 구현으로 바꾸면 됩니다.

즉, 변수 이름은 `OPENAI_API_KEY` 이지만 **OpenAI 전용이라는 뜻은 아닙니다**.

## 환경 변수

```bash
# 선택 사항: OpenAI-compatible 모델 엔드포인트
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=

# 선택 사항: Tencent mode 용 UserSig 발급 + bot relay
TIM_SDK_APP_ID=
TIM_SDK_SECRET_KEY=
TIM_ADMIN_USER_ID=
TIM_API_BASE=https://adminapisgp.im.qcloud.com
TIM_BOT_USER_ID=@RBT#agent_inbox
TIM_BOT_NICK=Tencent RTC Chat Agent
```

## 공식 링크

- 제품 페이지: [Tencent RTC Chat SDK & API free edition](https://trtc.io/free-chat-api)
- 콘솔: [TRTC Console](https://trtc.io/console)
- 기능 개요: [Chat: Cross-Platform Messaging Solution](https://trtc.io/document/33515)
- 기본 개념: [Basic Concepts](https://trtc.io/document/74361)
- UserSig 문서: [Generate UserSig](https://trtc.io/document/34385?menulabel=serverapis&product=chat)
- Web SDK API: [TencentCloudChat SDK Documentation](https://trtc.io/document/52488)
- 로그인 흐름: [Chat SDK Login and Logout](https://trtc.io/document/47970)
