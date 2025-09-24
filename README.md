# 🎣 FishFarm DeFi - 하루 커피값/밥값 벌기 챌린지

> **물고기잡이 메타포로 쉽게 이해하는 DeFi V3 유동성 파밍 체험**

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.1-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

## 🌟 프로젝트 소개

DeFi의 복잡한 개념을 **물고기잡이 게임**으로 쉽게 이해할 수 있는 교육용 데모입니다. 하루 커피값이나 밥값을 벌 수 있는 챌린지를 통해 유동성 파밍의 핵심 메커니즘을 체험해보세요!

### 🎮 핵심 메타포

- **물고기 떼** = 현재 SOL 가격
- **그물** = 내 포지션 범위  
- **수익 발생** = 물고기가 그물 범위 안에 있을 때
- **리밸런싱** = 그물을 옮기는 것

## 🚀 주요 기능

### 💰 챌린지 시스템
- **☕ 커피값 챌린지**: $1,000 예치 (초보자용)
- **🍜 밥값 챌린지**: $5,000 예치 (중급자용)

### 🎯 실시간 시뮬레이션
- SOL 가격의 실시간 변동 시뮬레이션
- Canvas 기반 부드러운 애니메이션
- 물고기 떼와 그물의 상호작용 시각화

### ⚙️ 고급 기능
- **자동 리밸런싱**: 범위 벗어남 시 자동 그물 이동
- **복리 재투자**: 수확한 수익을 자동으로 예치금에 추가
- **운영진 수수료**: 플랫폼 운영을 위한 수수료 시스템 (조정 가능)
- **실시간 알림**: 설정한 금액이 모이면 알림
- **시뮬레이션 시간 조정**: 10분/1시간/1일/7일 단위 선택

## 🛠️ 기술 스택

- **프레임워크**: Next.js 15.2.4 (App Router)
- **UI 라이브러리**: React 19.1.1
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **애니메이션**: Framer Motion
- **UI 컴포넌트**: Radix UI 기반 커스텀 컴포넌트
- **아이콘**: Lucide React

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/fishing.git
cd fishing
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 브라우저에서 확인
```
http://localhost:3000
```

## 🎮 사용 방법

### 1단계: 챌린지 선택
- **커피값 챌린지** ($1,000) 또는 **밥값 챌린지** ($5,000) 선택

### 2단계: APR 설정
- 원하는 연 이율(APR) 선택 (기본값: 200%)

### 3단계: 데모 시작
- "🚀 데모 시작하기" 버튼 클릭
- 실시간으로 물고기 떼(가격)와 그물(포지션) 관찰

### 4단계: 수익 관리
- **자동 리밸런싱**: 범위 벗어남 시 자동으로 그물 이동
- **수동 수확**: "지금 수확" 버튼으로 수익 회수
- **복리 재투자**: 수확한 수익을 자동으로 예치금에 추가

## 🏗️ 프로젝트 구조

```
fishing/
├── app/                    # Next.js 앱 라우터
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 메인 페이지
│   └── globals.css        # 전역 스타일
├── components/            # React 컴포넌트
│   ├── ui/               # 재사용 가능한 UI 컴포넌트
│   ├── FishScene.tsx     # 메인 게임 화면
│   ├── ChallengeCards.tsx # 챌린지 선택 카드
│   ├── PriceControl.tsx   # 가격 제어 패널
│   └── ...
├── lib/                  # 핵심 로직
│   ├── priceSim.ts       # 시뮬레이션 엔진
│   ├── copy.ts          # 텍스트 콘텐츠
│   └── utils.ts         # 유틸리티 함수
└── hooks/               # 커스텀 훅
```

## 🎯 핵심 컴포넌트

### `FishScene.tsx`
- Canvas 기반 실시간 애니메이션
- 물고기 떼, 그물, 배의 부드러운 움직임
- 리밸런싱 애니메이션 (그물 거두기 → 배 이동 → 그물 치기)

### `priceSim.ts`
- SOL 가격 시뮬레이션 엔진
- APR 기반 수익 계산
- 자동 리밸런싱 로직
- 시뮬레이션 시간 단위 관리

### `ChallengeCards.tsx`
- 챌린지 선택 인터페이스
- 커피값/밥값 챌린지 카드

## 💡 교육적 가치

이 프로젝트는 DeFi의 복잡한 개념들을 직관적으로 이해할 수 있도록 도와줍니다:

| DeFi 개념 | 게임 메타포 | 설명 |
|-----------|-------------|------|
| 유동성 풀 | 물고기 떼 | 현재 가격을 나타내는 움직이는 물고기들 |
| 포지션 범위 | 그물 범위 | 수익이 발생하는 가격 구간 |
| 리밸런싱 | 그물 옮기기 | 가격 변동에 따른 포지션 조정 |
| 수익 발생 | 물고기 잡기 | 범위 안에 있을 때만 수익 발생 |
| 가격 변동 | 물고기 떼 움직임 | 실시간으로 변하는 가격 시뮬레이션 |

## 🎨 디자인 특징

- **다크 테마**: 모던하고 세련된 UI
- **그라데이션**: 시각적 깊이감과 현대적 느낌
- **부드러운 애니메이션**: Framer Motion을 활용한 자연스러운 움직임
- **반응형 디자인**: 모든 디바이스에서 최적화된 경험

## 🔧 개발 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start
