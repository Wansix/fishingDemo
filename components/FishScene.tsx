"use client"

import { motion } from "framer-motion"
import { useState, useEffect, useRef, useCallback } from "react"
import type { PriceSimState, PriceSimulator } from "@/lib/priceSim"
import { COPY } from "@/lib/copy"

interface FishSceneProps {
  state: PriceSimState
  onRecast?: () => void
  demoStatus?: string
  simulator?: PriceSimulator
}

export default function FishScene({ state, onRecast, demoStatus, simulator }: FishSceneProps) {
  const range = {
    lower: state.netCenter * (1 - state.netWidthPercent / 200),
    upper: state.netCenter * (1 + state.netWidthPercent / 200),
  }

  const isInRange = state.schoolCenter >= range.lower && state.schoolCenter <= range.upper

  // Price range for positioning (100-200 maps to 5%-95% of screen width)
  const minPrice = 100
  const maxPrice = 200
  const fishXPosition = ((state.schoolCenter - minPrice) / (maxPrice - minPrice)) * 90 + 5 // 5%-95% range

  // Hydration 에러 방지를 위한 클라이언트 사이드 상태
  const [isClient, setIsClient] = useState(false)
  
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // 게임 객체 refs (React 상태 업데이트 최소화)
  const fishPositionsRef = useRef<Array<{ x: number; y: number; targetX: number; targetY: number }>>([]);
  const priceLineRef = useRef<{ x: number; targetX: number }>({ x: 400, targetX: 400 });
  
  // 초기 배 위치 계산
  const initialLeftX = 40 + ((range.lower - 100) / 100) * 720
  const initialRightX = 40 + ((range.upper - 100) / 100) * 720
  const initialBoatX = (initialLeftX + initialRightX) / 2

  // 리밸런싱 애니메이션 상태
  const [rebalanceAnimation, setRebalanceAnimation] = useState({
    isAnimating: false,
    phase: 'idle' as 'idle' | 'pulling' | 'moving' | 'deploying',
    boatX: initialBoatX,
    targetBoatX: 0,
    netPullProgress: 0,
    deployProgress: 0,
    oldNetPosition: { left: initialLeftX, right: initialRightX },
    newNetPosition: { left: 0, right: 0 },
    // 현재 표시되는 그물 위치 (애니메이션 중이 아닐 때 사용)
    currentNetPosition: { left: initialLeftX, right: initialRightX },
    // 현재 표시되는 배 위치 (깜빡임 방지)
    currentBoatX: initialBoatX
  });
  
  // 초기화 완료 상태 추가
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 노트북 성능 최적화를 위한 변수들
  let lastFishUpdate = 0; // 마지막 물고기 업데이트 시간

  // Canvas 부분 업데이트를 위한 상태 추적
  const [lastFishPositions, setLastFishPositions] = useState<Array<{x: number, y: number}>>([])
  const [lastPriceLineX, setLastPriceLineX] = useState<number>(0)
  const [lastNetRange, setLastNetRange] = useState<{lower: number, upper: number}>({lower: 0, upper: 0})

  // 간소화된 변경 감지 (성능 최적화)
  const shouldUpdate = useCallback(() => {
    const currentPriceLineX = (fishXPosition / 100) * 800
    const priceLineChanged = Math.abs(currentPriceLineX - lastPriceLineX) > 2 // 임계값 증가
    const netRangeChanged = Math.abs(range.lower - lastNetRange.lower) > 2 || 
                           Math.abs(range.upper - lastNetRange.upper) > 2
    
    if (priceLineChanged || netRangeChanged) {
      setLastPriceLineX(currentPriceLineX)
      setLastNetRange(range)
      return true
    }
    return false
  }, [fishXPosition, range, lastPriceLineX, lastNetRange])

  // 클라이언트 사이드에서만 실행
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 리밸런싱 애니메이션 시퀀스 (최적화됨)
  const startRebalanceAnimation = useCallback((targetBoatX: number, newLeftX: number, newRightX: number, startX: number) => {
    let animationId: number
    let startTime = performance.now()
    
    // 전체 애니메이션을 하나의 루프로 통합 (성능 최적화)
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const totalDuration = 1200 // 전체 1.2초로 단축
      const progress = Math.min(elapsed / totalDuration, 1)
      
      if (progress < 0.4) {
        // 1단계: 그물 거두기 (0.48초)
        const pullProgress = progress / 0.4
        setRebalanceAnimation(prev => ({
          ...prev,
          phase: 'pulling',
          netPullProgress: pullProgress
        }))
      } else if (progress < 0.8) {
        // 2단계: 배 이동 (0.48초)
        const moveProgress = (progress - 0.4) / 0.4
        const currentX = startX + (targetBoatX - startX) * moveProgress
        
        setRebalanceAnimation(prev => ({
          ...prev,
          phase: 'moving',
          boatX: currentX,
          netPullProgress: 1
        }))
      } else {
        // 3단계: 그물 치기 (0.24초)
        const deployProgress = (progress - 0.8) / 0.2
        setRebalanceAnimation(prev => ({
          ...prev,
          phase: 'deploying',
          boatX: targetBoatX,
          deployProgress: deployProgress
        }))
      }
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate)
      } else {
        // 애니메이션 완료 (로그 최소화)
        setRebalanceAnimation({
          isAnimating: false,
          phase: 'idle',
          boatX: targetBoatX,
          targetBoatX: 0,
          netPullProgress: 0,
          deployProgress: 0,
          oldNetPosition: { left: newLeftX, right: newRightX },
          newNetPosition: { left: 0, right: 0 },
          currentNetPosition: { left: newLeftX, right: newRightX },
          currentBoatX: targetBoatX
        })
        
        // 수익/시간 재개
        if (simulator) {
          simulator.resumeAfterRebalancing()
        }
      }
    }
    
    animationId = requestAnimationFrame(animate)
    
    // 클린업 함수 반환
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [simulator])

  // 리밸런싱 감지 및 애니메이션 시작
  useEffect(() => {
    // 초기화가 완료되지 않았으면 리턴
    if (!isInitialized) return
    
    // range가 급격히 변한 경우 리밸런싱으로 간주
    const leftX = 40 + ((range.lower - 100) / 100) * 720
    const rightX = 40 + ((range.upper - 100) / 100) * 720
    const newBoatX = (leftX + rightX) / 2
    
    // 성능을 위해 디버그 로그 최소화
    
    // 범위 벗어남 감지 (개선된 로직)
    const currentPrice = state.price || state.schoolCenter
    const isCurrentlyOutOfRange = currentPrice < range.lower || currentPrice > range.upper
    
    // 자동 리밸런싱이 시작된 경우 또는 큰 위치 변화가 있는 경우
    const positionDiff = Math.abs(newBoatX - rebalanceAnimation.boatX);
    const shouldAnimate = !rebalanceAnimation.isAnimating && 
      (
        state.forceRebalanceAnimation || // 강제 애니메이션 플래그 (한 번만 트리거)
        (state.isAutoRebalancing && isCurrentlyOutOfRange && positionDiff > 3) || // 자동: 범위 벗어나고 3픽셀 이상 변화
        (!state.isAutoRebalancing && positionDiff > 30)  // 수동: 30픽셀 이상 변화 (감소)
      );

    // 디버깅: 애니메이션 트리거 조건 로그
    if (state.forceRebalanceAnimation || (state.isAutoRebalancing && isCurrentlyOutOfRange)) {
      console.log('🎬 애니메이션 트리거 조건:', {
        forceRebalanceAnimation: state.forceRebalanceAnimation,
        isAutoRebalancing: state.isAutoRebalancing,
        isCurrentlyOutOfRange,
        positionDiff,
        shouldAnimate,
        isAnimating: rebalanceAnimation.isAnimating
      });
    }
    
    if (shouldAnimate) {
      // 리밸런싱 애니메이션 시작 (즉시 애니메이션 상태로 전환)
      const oldLeftX = rebalanceAnimation.oldNetPosition.left || (40 + ((range.lower - 100) / 100) * 720)
      const oldRightX = rebalanceAnimation.oldNetPosition.right || (40 + ((range.upper - 100) / 100) * 720)
      let oldBoatX = (oldLeftX + oldRightX) / 2
      
      // 자동 리밸런싱일 때 위치 변화가 작으면 현재 배 위치 사용
      if (state.isAutoRebalancing && Math.abs(newBoatX - oldBoatX) < 50) {
        oldBoatX = rebalanceAnimation.boatX
      }
      
      // 즉시 애니메이션 상태로 전환 (새 range 값이 그려지는 것을 방지)
      setRebalanceAnimation({
        isAnimating: true,
        phase: 'pulling',
        boatX: oldBoatX,
        targetBoatX: newBoatX,
        netPullProgress: 0,
        deployProgress: 0,
        oldNetPosition: { left: oldLeftX, right: oldRightX },
        newNetPosition: { left: leftX, right: rightX },
        currentNetPosition: { left: oldLeftX, right: oldRightX }, // 이전 위치 유지
        currentBoatX: oldBoatX // 이전 배 위치 유지
      })
      
      // 수익/시간 일시정지
      if (simulator) {
        simulator.pauseForRebalancing()
      }
      
      // 다음 프레임에서 애니메이션 시작 (상태 변경이 적용된 후)
      requestAnimationFrame(() => {
        startRebalanceAnimation(newBoatX, leftX, rightX, oldBoatX)
      })
    } else if (!rebalanceAnimation.isAnimating) {
      // 애니메이션이 없는 경우 위치를 점진적으로 업데이트 (작은 변화의 경우)
      if (Math.abs(newBoatX - rebalanceAnimation.boatX) > 5) {
        setRebalanceAnimation(prev => ({
          ...prev,
          boatX: newBoatX,
          oldNetPosition: { left: leftX, right: rightX },
          currentNetPosition: { left: leftX, right: rightX }, // 새 위치로 업데이트
          currentBoatX: newBoatX // 새 배 위치로 업데이트
        }))
      }
    }
  }, [range, rebalanceAnimation.isAnimating, rebalanceAnimation.boatX, rebalanceAnimation.oldNetPosition, startRebalanceAnimation, simulator, isInitialized, state.isAutoRebalancing, state.forceRebalanceAnimation])

  // 물고기 및 가격선 초기화 (한 번만)
  useEffect(() => {
    if (!isClient) return
    
    // 5마리 물고기를 SOL 가격선 중심으로 가로로 정렬
    const centerX = (fishXPosition / 100) * 800
    const centerY = 300
    
    // 가격선 현재 위치로 초기화 (리셋 방지)
    if (priceLineRef.current.x === 400) {
      priceLineRef.current.x = centerX;
      priceLineRef.current.targetX = centerX;
    }
    
    if (fishPositionsRef.current.length === 0) {
      // 첫 초기화
      fishPositionsRef.current = Array.from({ length: 5 }, (_, i) => {
        const x = centerX + (i - 2) * 40 // 25 → 40으로 간격 증가
        const y = centerY
        return {
          x,
          y,
          targetX: x,
          targetY: y
        }
      })
      
             // 리밸런싱 애니메이션 초기 위치 설정
       const leftX = 40 + ((range.lower - 100) / 100) * 720
       const rightX = 40 + ((range.upper - 100) / 100) * 720
       const boatCenterX = (leftX + rightX) / 2
       setRebalanceAnimation(prev => ({
         ...prev,
         boatX: boatCenterX,
         oldNetPosition: { left: leftX, right: rightX },
         currentNetPosition: { left: leftX, right: rightX },
         currentBoatX: boatCenterX
       }))
      
      // 초기화 완료 설정 (약간의 지연을 두어 모든 초기화가 완료되도록)
      setTimeout(() => {
        setIsInitialized(true)
      }, 1000)
    }
    // fishXPosition 변경 시에는 애니메이션에서 자동으로 부드럽게 이동됨
  }, [isClient, fishXPosition])

  // 고정 요소 그리기 (한 번만)
  const drawStaticElements = useCallback((ctx: CanvasRenderingContext2D) => {
    // 배경 (물만)
    ctx.fillStyle = '#1e3a8a'
    ctx.fillRect(0, 0, 800, 500)
    
    // 가격 격자선
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'
    ctx.lineWidth = 1
    for (let i = 0; i < 11; i++) {
      const x = 40 + (i * 72)
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 500)
      ctx.stroke()
    }
    
  }, [])

  // SOL 가격선 그리기 (부드러운 애니메이션)
  const drawPriceLine = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(priceLineRef.current.x, 0)
    ctx.lineTo(priceLineRef.current.x, 500)
    ctx.stroke()
  }, [])

  // 실제 물고기잡이 그물 그리기 (이미지 참고: 흰색 그물 + 명확한 그물망)
  const drawNet = useCallback((ctx: CanvasRenderingContext2D) => {
    // 애니메이션 중일 때는 애니메이션 상태의 위치만 사용
    let leftX: number, rightX: number, boatCenterX: number
    const boatY = 80
    
    if (rebalanceAnimation.isAnimating) {
      // 애니메이션 중: 애니메이션 상태에서 위치 가져오기
      boatCenterX = rebalanceAnimation.boatX
      
      // 각 단계별로 적절한 그물 위치 사용
      if (rebalanceAnimation.phase === 'pulling') {
        leftX = rebalanceAnimation.oldNetPosition.left
        rightX = rebalanceAnimation.oldNetPosition.right
      } else if (rebalanceAnimation.phase === 'moving') {
        // 이동 중에는 그물 위치 정의하지 않음 (어차피 그리지 않음)
        leftX = 0
        rightX = 0
      } else if (rebalanceAnimation.phase === 'deploying') {
        leftX = rebalanceAnimation.newNetPosition.left
        rightX = rebalanceAnimation.newNetPosition.right
      } else {
        // 기본값 설정
        leftX = rebalanceAnimation.currentNetPosition.left
        rightX = rebalanceAnimation.currentNetPosition.right
      }
    } else {
      // 일반 상태: 저장된 현재 위치 사용 (깜빡임 방지)
      leftX = rebalanceAnimation.currentNetPosition.left
      rightX = rebalanceAnimation.currentNetPosition.right
      boatCenterX = (leftX + rightX) / 2
    }

    // 그물이 그려질 위치가 없으면 리턴
    if (leftX === 0 && rightX === 0) return

    const netWidth = rightX - leftX
    const netHeight = 100
    const netTopY = 200
    const netBottomY = netTopY + netHeight

    // 배에서 그물로 연결되는 케이블/로프 (애니메이션 상태에 따라)
    ctx.strokeStyle = '#ffffff' // 하얀색으로 변경
    ctx.lineWidth = 3
    ctx.beginPath()
    
    // 애니메이션 중일 때는 적절한 위치로 케이블 연결
    if (rebalanceAnimation.isAnimating) {
      if (rebalanceAnimation.phase === 'pulling') {
        // 그물 거두는 중: 원래 위치의 그물로 케이블 연결
        const oldLeftX = rebalanceAnimation.oldNetPosition.left
        const oldRightX = rebalanceAnimation.oldNetPosition.right
        const pullProgress = rebalanceAnimation.netPullProgress
        const netY = 200 + (80 - 200) * pullProgress
        
        ctx.moveTo(boatCenterX - 30, boatY - 5) // 갑판 위쪽으로 이동
        ctx.lineTo(oldLeftX, netY)
        ctx.moveTo(boatCenterX + 30, boatY - 5) // 갑판 위쪽으로 이동
        ctx.lineTo(oldRightX, netY)
      } else if (rebalanceAnimation.phase === 'moving') {
        // 이동 중: 케이블만 배에 붙어있음 (그물 없음)
        ctx.moveTo(boatCenterX - 30, boatY - 5) // 갑판 위쪽으로 이동
        ctx.lineTo(boatCenterX - 30, boatY + 15) // 갑판 위쪽에서 끝남
        ctx.moveTo(boatCenterX + 30, boatY - 5) // 갑판 위쪽으로 이동
        ctx.lineTo(boatCenterX + 30, boatY + 15) // 갑판 위쪽에서 끝남
      } else if (rebalanceAnimation.phase === 'deploying') {
        // 배포 중: 새로운 위치로 케이블 연결 (deployProgress에 따라)
        if (rebalanceAnimation.deployProgress > 0) {
          const deployY = netTopY + (netBottomY - netTopY) * (1 - rebalanceAnimation.deployProgress)
          ctx.moveTo(boatCenterX - 30, boatY - 5) // 갑판 위쪽으로 이동
          ctx.lineTo(leftX, deployY)
          ctx.moveTo(boatCenterX + 30, boatY - 5) // 갑판 위쪽으로 이동
          ctx.lineTo(rightX, deployY)
        } else {
          // deployProgress가 0이면 케이블을 배에 붙여둠
          ctx.moveTo(boatCenterX - 30, boatY - 5) // 갑판 위쪽으로 이동
          ctx.lineTo(boatCenterX - 30, boatY + 15) // 갑판 위쪽에서 끝남
          ctx.moveTo(boatCenterX + 30, boatY - 5) // 갑판 위쪽으로 이동
          ctx.lineTo(boatCenterX + 30, boatY + 15) // 갑판 위쪽에서 끝남
        }
      }
    } else {
      // 일반 상태: 현재 그물 위치로 케이블 연결
      ctx.moveTo(boatCenterX - 30, boatY - 5) // 갑판 위쪽으로 이동
      ctx.lineTo(leftX, netTopY)
      ctx.moveTo(boatCenterX + 30, boatY - 5) // 갑판 위쪽으로 이동
      ctx.lineTo(rightX, netTopY)
    }
    ctx.stroke()

    // 그물 그리기 (애니메이션 중이 아닐 때만)
    if (!rebalanceAnimation.isAnimating) {
      // 그물망 패턴 (이미지처럼 명확한 격자 - 하얀색 선, 네모칸은 투명)
      ctx.strokeStyle = '#ffffff' // 하얀색 선
      ctx.lineWidth = 2
      
      // 가로 그물망 라인 (더 조밀하게)
      const horizontalMeshSize = 15
      for (let y = netTopY; y <= netBottomY; y += horizontalMeshSize) {
        ctx.beginPath()
        ctx.moveTo(leftX, y)
        ctx.lineTo(rightX, y)
        ctx.stroke()
      }
      
      // 세로 그물망 라인 (더 조밀하게)
      const verticalMeshSize = 15
      for (let x = leftX; x <= rightX; x += verticalMeshSize) {
        ctx.beginPath()
        ctx.moveTo(x, netTopY)
        ctx.lineTo(x, netBottomY)
        ctx.stroke()
      }

      // 그물 테두리 (하얀색)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(leftX, netTopY)
      ctx.lineTo(rightX, netTopY)
      ctx.lineTo(rightX, netBottomY)
      ctx.lineTo(leftX, netBottomY)
      ctx.closePath()
      ctx.stroke()

      // 그물 하단 추 (무게추)
      ctx.fillStyle = '#374151'
      ctx.beginPath()
      ctx.arc((leftX + rightX) / 2, netBottomY + 12, 8, 0, 2 * Math.PI)
      ctx.fill()
      
      // 추 테두리
      ctx.strokeStyle = '#1f2937'
      ctx.lineWidth = 2
      ctx.stroke()

      // 그물 하단 추 연결 로프
      ctx.strokeStyle = '#8b5cf6'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo((leftX + rightX) / 2, netBottomY)
      ctx.lineTo((leftX + rightX) / 2, netBottomY + 12)
      ctx.stroke()
    }

    // 그물 범위 라벨 (애니메이션 중이 아닐 때만)
    if (!rebalanceAnimation.isAnimating) {
      // 라벨 배경
      ctx.fillStyle = 'rgba(139, 69, 19, 0.9)'
      ctx.fillRect((leftX + rightX) / 2 - 60, 330, 120, 20)
      
      // 라벨 테두리
      ctx.strokeStyle = '#8B4513'
      ctx.lineWidth = 2
      ctx.strokeRect((leftX + rightX) / 2 - 60, 330, 120, 20)
      
      // 라벨 텍스트
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`🎣 그물 ($${range.lower.toFixed(0)}-${range.upper.toFixed(0)})`, (leftX + rightX) / 2, 345)
    }
  }, [range, rebalanceAnimation])

  // 전형적인 물고기잡이 배 그리기 (사다리꼴 선체 - 밑변이 짧음)
  const drawFishingBoat = useCallback((ctx: CanvasRenderingContext2D) => {
    let boatCenterX
    
    // 애니메이션 중일 때는 애니메이션 위치만 사용
    if (rebalanceAnimation.isAnimating) {
      boatCenterX = rebalanceAnimation.boatX
    } else {
      // 일반 상태: 저장된 현재 배 위치 사용 (깜빡임 방지)
      boatCenterX = rebalanceAnimation.currentBoatX
    }
    
    const boatY = 80 // 물 위에 위치
    
    // 배 그림자 (물 위 반사)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.beginPath()
    ctx.ellipse(boatCenterX, boatY + 40, 90, 15, 0, 0, 2 * Math.PI)
    ctx.fill()
    
    // 배 선체 - 사다리꼴 모양 (밑변이 짧음)
    ctx.fillStyle = '#8B4513' // 갈색 선체
    ctx.beginPath()
    ctx.moveTo(boatCenterX - 60, boatY + 25) // 왼쪽 아래 (짧음)
    ctx.lineTo(boatCenterX + 60, boatY + 25) // 오른쪽 아래 (짧음)
    ctx.lineTo(boatCenterX + 80, boatY - 5)  // 오른쪽 위 (길음)
    ctx.lineTo(boatCenterX - 80, boatY - 5)  // 왼쪽 위 (길음)
    ctx.closePath()
    ctx.fill()
    
    // 선체 테두리
    ctx.strokeStyle = '#654321'
    ctx.lineWidth = 3
    ctx.stroke()
    
    // 배 갑판 (사다리꼴 - 밑변이 짧음)
    ctx.fillStyle = '#DEB887' // 나무색 갑판
    ctx.beginPath()
    ctx.moveTo(boatCenterX - 80, boatY - 5)  // 왼쪽 위 (길음)
    ctx.lineTo(boatCenterX + 80, boatY - 5)  // 오른쪽 위 (길음)
    ctx.lineTo(boatCenterX + 70, boatY - 15) // 오른쪽 안쪽 (짧음)
    ctx.lineTo(boatCenterX - 70, boatY - 15) // 왼쪽 안쪽 (짧음)
    ctx.closePath()
    ctx.fill()
    
    // 갑판 테두리
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 갑판 나무판 무늬
    ctx.strokeStyle = '#CD853F'
    ctx.lineWidth = 1
    for (let i = 0; i < 10; i++) {
      const lineX = boatCenterX - 75 + i * 15
      ctx.beginPath()
      ctx.moveTo(lineX, boatY - 5)
      ctx.lineTo(lineX, boatY - 15)
      ctx.stroke()
    }
    
    // 배 측면 (사다리꼴 - 밑변이 짧음)
    ctx.fillStyle = '#F5DEB3' // 밝은 베이지색
    ctx.beginPath()
    ctx.moveTo(boatCenterX - 80, boatY - 5)  // 왼쪽 위 (길음)
    ctx.lineTo(boatCenterX - 70, boatY - 15) // 왼쪽 안쪽 (짧음)
    ctx.lineTo(boatCenterX - 70, boatY - 25) // 왼쪽 아래 (짧음)
    ctx.lineTo(boatCenterX - 80, boatY - 15) // 왼쪽 바깥 (길음)
    ctx.closePath()
    ctx.fill()
    
    // 오른쪽 측면
    ctx.beginPath()
    ctx.moveTo(boatCenterX + 80, boatY - 5)  // 오른쪽 위 (길음)
    ctx.lineTo(boatCenterX + 70, boatY - 15) // 오른쪽 안쪽 (짧음)
    ctx.lineTo(boatCenterX + 70, boatY - 25) // 오른쪽 아래 (짧음)
    ctx.lineTo(boatCenterX + 80, boatY - 15) // 오른쪽 바깥 (길음)
    ctx.closePath()
    ctx.fill()
    
    // 측면 테두리
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 조타실 (사각형)
    ctx.fillStyle = '#F5F5DC' // 베이지색
    ctx.fillRect(boatCenterX - 25, boatY - 35, 50, 20)
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 2
    ctx.strokeRect(boatCenterX - 25, boatY - 35, 50, 20)
    
    // 조타실 지붕 (사다리꼴 - 밑변이 짧음)
    ctx.fillStyle = '#8B4513' // 갈색 지붕
    ctx.beginPath()
    ctx.moveTo(boatCenterX - 30, boatY - 35) // 왼쪽 아래 (짧음)
    ctx.lineTo(boatCenterX + 30, boatY - 35) // 오른쪽 아래 (짧음)
    ctx.lineTo(boatCenterX + 35, boatY - 45) // 오른쪽 위 (길음)
    ctx.lineTo(boatCenterX - 35, boatY - 45) // 왼쪽 위 (길음)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    // 조타실 창문
    ctx.fillStyle = '#87CEEB' // 하늘색
    ctx.fillRect(boatCenterX - 20, boatY - 30, 40, 15)
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 1
    ctx.strokeRect(boatCenterX - 20, boatY - 30, 40, 15)
    
    // 창문 프레임
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(boatCenterX, boatY - 30)
    ctx.lineTo(boatCenterX, boatY - 15)
    ctx.stroke()
    
    // 마스트 (기둥)
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(boatCenterX - 50, boatY - 15)
    ctx.lineTo(boatCenterX - 50, boatY - 75)
    ctx.stroke()
    
    // 마스트 크로스바 (가로 막대)
    ctx.beginPath()
    ctx.moveTo(boatCenterX - 65, boatY - 75)
    ctx.lineTo(boatCenterX - 35, boatY - 75)
    ctx.stroke()
    
    // 그물 걸이 (고리들)
    ctx.strokeStyle = '#696969'
    ctx.lineWidth = 3
    for (let i = 0; i < 5; i++) {
      const hookX = boatCenterX - 60 + i * 6
      ctx.beginPath()
      ctx.arc(hookX, boatY - 70, 2.5, 0, 2 * Math.PI)
      ctx.stroke()
    }
    
    // 어선 깃발
    ctx.fillStyle = '#FF0000' // 빨간색
    ctx.beginPath()
    ctx.moveTo(boatCenterX + 50, boatY - 60)
    ctx.lineTo(boatCenterX + 75, boatY - 55)
    ctx.lineTo(boatCenterX + 50, boatY - 50)
    ctx.closePath()
    ctx.fill()
    
    // 깃발 테두리
    ctx.strokeStyle = '#DC143C'
    ctx.lineWidth = 1
    ctx.stroke()
    
    // 깃발 장대
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(boatCenterX + 50, boatY - 15)
    ctx.lineTo(boatCenterX + 50, boatY - 60)
    ctx.stroke()
    
    // 배 이름
    ctx.fillStyle = '#8B4513'
    ctx.font = 'bold 11px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('FISHING BOAT', boatCenterX, boatY + 18)
    
  }, [rebalanceAnimation])

  // 물고기들 그리기 (범위에 따라 색상 변경)
  const drawFishes = useCallback((ctx: CanvasRenderingContext2D) => {
    const fishColor = isInRange ? '#22d3ee' : '#6b7280' // 범위 안: 파란색, 범위 밖: 회색
    
    fishPositionsRef.current.forEach(fish => {
      const x = fish.x;
      const y = fish.y;
      
      // 물고기 몸체 (타원)
      ctx.fillStyle = fishColor;
      ctx.beginPath();
      ctx.ellipse(x, y, 12, 8, 0, 0, 2 * Math.PI);
      ctx.fill();
      
      // 물고기 꼬리
      ctx.beginPath();
      ctx.moveTo(x - 12, y);
      ctx.lineTo(x - 20, y - 6);
      ctx.lineTo(x - 18, y);
      ctx.lineTo(x - 20, y + 6);
      ctx.closePath();
      ctx.fill();
      
      // 물고기 눈
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(x + 4, y - 2, 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // 눈동자
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(x + 5, y - 2, 1, 0, 2 * Math.PI);
      ctx.fill();
    })
  }, [isInRange])



  // 고정 요소를 오프스크린 Canvas에 그리기 (한 번만)
  useEffect(() => {
    if (!isClient || !staticCanvasRef.current) return
    
    const staticCtx = staticCanvasRef.current.getContext('2d')
    if (!staticCtx) return
    
    staticCanvasRef.current.width = 800
    staticCanvasRef.current.height = 500
    
    drawStaticElements(staticCtx)
  }, [isClient, drawStaticElements])

  // 메인 Canvas 초기화 및 고정 요소 복사
  useEffect(() => {
    if (!isClient || !canvasRef.current || !staticCanvasRef.current) return
    
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    
    canvasRef.current.width = 800
    canvasRef.current.height = 500
    
    // 오프스크린 Canvas에서 고정 요소 복사
    ctx.drawImage(staticCanvasRef.current, 0, 0)
  }, [isClient])

  // 물고기 위치 업데이트 (ref 직접 수정, 최적화됨)
  const updateFishPositions = useCallback(() => {
    // 활성 물고기만 필터링 (움직임이 필요한 물고기만)
    const activeFishes = fishPositionsRef.current.filter(fish => 
      Math.abs(fish.x - fish.targetX) > 0.5 || 
      Math.abs(fish.y - fish.targetY) > 0.5
    );
    
    activeFishes.forEach((fish, index) => {
      const centerX = (fishXPosition / 100) * 800
      const centerY = 300
      const spacing = 20
      const targetX = centerX + (index - 2) * spacing
      const targetY = centerY + Math.sin(index * 0.5) * 10
      
      // 부드러운 이동 (더 자연스러운 속도)
      const dx = targetX - fish.x
      const dy = targetY - fish.y
      
      // 거리에 따른 동적 속도 조정
      const distance = Math.sqrt(dx * dx + dy * dy)
      const speed = Math.min(0.15, Math.max(0.05, distance * 0.001))
      
      fish.x += dx * speed
      fish.y += dy * speed
      fish.targetX = targetX
      fish.targetY = targetY
    })
  }, [fishXPosition])

  // 최적화된 애니메이션 루프 (필요할 때만 업데이트)
  useEffect(() => {
    if (!isClient || !canvasRef.current || !staticCanvasRef.current) return;
    
    let animationId: number;
    let lastFrameTime = 0;
    const targetFPS = 60; // 최고 부드러움을 위해 60fps로 증가
    const frameInterval = 1000 / targetFPS;
    
    const animate = (currentTime: number) => {
      if (!canvasRef.current || !staticCanvasRef.current) return;
      
      // 프레임 스킵
      if (currentTime - lastFrameTime < frameInterval) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      
      lastFrameTime = currentTime;
      
      // 항상 다시 그리기 (부드러운 애니메이션을 위해)
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      // Canvas 전체 지우기
      ctx.clearRect(0, 0, 800, 500);
      
      // 정적 요소들을 오프스크린 캔버스에서 복사
      ctx.drawImage(staticCanvasRef.current, 0, 0);
      
      // 동적 요소들만 그리기
      drawFishingBoat(ctx);
      drawPriceLine(ctx);
      drawNet(ctx);
      drawFishes(ctx);
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isClient, drawFishingBoat, drawPriceLine, drawNet, drawFishes]);

  // 부드러운 물고기 움직임 애니메이션
  useEffect(() => {
    if (!isClient) return;
    
    let animationId: number;
    let lastTime = 0;
    
    const animateFishes = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      // 가격선 목표 위치 설정 및 부드러운 애니메이션
      const targetPriceLineX = (fishXPosition / 100) * 800;
      priceLineRef.current.targetX = targetPriceLineX;
      
      // 가격선 부드러운 보간 (더 빠른 반응)
      const priceLineDistance = Math.abs(priceLineRef.current.targetX - priceLineRef.current.x);
      const priceLineEaseFactor = priceLineDistance > 50 ? 0.15 : priceLineDistance > 20 ? 0.12 : 0.08;
      priceLineRef.current.x += (priceLineRef.current.targetX - priceLineRef.current.x) * priceLineEaseFactor;
      
      // 물고기들이 SOL 가격선 주변에 모여있도록 부드럽게 이동
      const centerX = priceLineRef.current.x; // 가격선을 따라 이동
      const centerY = 300;
      const time = currentTime * 0.001; // 시간을 초 단위로 변환
      
      fishPositionsRef.current.forEach((fish, index) => {
        // 기본 대형: 가격선 주변 대형 유지 (랜덤 움직임 제거)
        const offsetX = (index - 2) * 40; // 25 → 40으로 간격 증가
        const waveX = Math.sin(time * 0.3 + index * 0.8) * 4;
        const targetX = centerX + offsetX + waveX;
        const targetY = centerY;
        
        // Framer Motion과 같은 부드러움을 위한 easeOut 스타일 보간
        const distance = Math.abs(targetX - fish.x);
        const easeFactor = distance > 50 ? 0.08 : distance > 20 ? 0.05 : 0.02;
        const lerpFactor = Math.min(1, easeFactor);
        
        fish.x += (targetX - fish.x) * lerpFactor;
        fish.y += (targetY - fish.y) * lerpFactor;
      });
      
      animationId = requestAnimationFrame(animateFishes);
    };
    
    animationId = requestAnimationFrame(animateFishes);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isClient, fishXPosition]);


          return (
    <div className="bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 min-h-[500px] relative overflow-hidden">
      {/* 오프스크린 Canvas (고정 요소용) */}
      {isClient && (
        <canvas
          ref={staticCanvasRef}
          style={{ display: 'none' }}
        />
      )}
      
      {/* 메인 Canvas 게임 화면 */}
      {isClient && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-20"
          style={{ width: '100%', height: '100%' }}
        />
      )}



      {/* Status Badge - Top Right */}
        <motion.div
        className="absolute top-8 right-8 text-white px-6 py-3 rounded-full shadow-lg z-20 text-lg font-semibold"
          style={{
            position: "absolute",
            top: "32px",
            right: "32px",
          backgroundColor: isInRange ? "#10b981" : "#ef4444",
            color: "white",
            padding: "12px 24px",
            borderRadius: "9999px",
            zIndex: 50,
            fontSize: "18px",
            fontWeight: "600",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        key={isInRange ? 'in-range' : 'out-of-range'} // 상태 변경시 애니메이션 재실행
        >
        {isInRange ? COPY.scenes.inRangeBadge : COPY.scenes.outRangeBadge}
        </motion.div>

      {/* Profit Display - Bottom Right */}
      <div
        className="absolute bottom-8 right-8 bg-slate-900 backdrop-blur-sm rounded-xl p-4 text-white border-2 border-slate-600 z-20 shadow-2xl"
        style={{
          position: "absolute",
          bottom: "32px",
          right: "32px",
          backgroundColor: "#0f172a",
          color: "white",
          padding: "16px",
          borderRadius: "12px",
          border: "2px solid #475569",
          zIndex: 50,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          minWidth: "200px",
        }}
      >
        <div
          className="text-sm text-slate-300 mb-2"
          style={{ fontSize: "14px", marginBottom: "8px", color: "#cbd5e1" }}
        >
          누적 수익
        </div>
        <div
          className="text-2xl font-bold text-green-400"
          style={{ fontSize: "24px", fontWeight: "bold", color: "#4ade80" }}
        >
          ${state.accumulatedProfit.toFixed(2)}
        </div>
      </div>

    </div>
  )
}
