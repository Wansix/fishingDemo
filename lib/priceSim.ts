export interface PriceSimState {
  price: number;
  schoolCenter: number;
  netCenter: number;
  netWidthPercent: number;
  accumulatedProfit: number;
  harvestableProfit: number; // 수확 가능한 수익
  harvestedProfit: number; // 수확한 수익
  lastUpdateTime: number;
  priceDirection: number; // 1 for increasing, -1 for decreasing
  isAutoRebalancing: boolean; // 자동 리밸런싱 상태
  forceRebalanceAnimation: boolean; // 강제 리밸런싱 애니메이션 플래그
}

export interface PriceRange {
  min: number;
  max: number;
}

export class PriceSimulator {
  private state: PriceSimState;
  private basePrice = 140; // Start from minimum
  private intervalId: NodeJS.Timeout | null = null;
  private profitIntervalId: NodeJS.Timeout | null = null;
  private demoIntervalId: NodeJS.Timeout | null = null;
  private rebalanceTimeoutId: NodeJS.Timeout | null = null;
  private listeners: ((state: PriceSimState) => void)[] = [];
  private useCustomRange = true; // Start with sequential mode by default
  private customRange: PriceRange = { min: 140, max: 150 };
  private isRunning = false; // Track if simulation is running
  private isDemoRunning = false; // Track if demo is running
  private wasInRange = true; // Track previous range status
  private isAutoRebalancing = false; // Track if auto-rebalancing
  
  // Profit calculation variables
  private depositAmount = 0; // Deposit amount in dollars
  private aprRate = 1; // APR rate (1.0 = 100%)
  
  // New demo system variables
  private demoTargetPrice = 0; // Target price for current movement
  private demoCurrentPrice = 0; // Current price during movement
  private demoDirection = 1; // Movement direction
  private minDemoPrice = 120; // Minimum demo price
  private maxDemoPrice = 180; // Maximum demo price
  
  // 자동 리밸런싱 설정
  private autoRebalanceEnabled = false;
  private onOutOfRangeCallback: (() => void) | null = null;
  
  // 데모 일시정지 관련 변수들
  private isDemoPaused = false;
  private demoPauseTimeout: NodeJS.Timeout | null = null;
  private pausedAnimationState: {
    startPrice: number;
    targetPrice: number;
    animationStartTime: number;
    animationDuration: number;
    isAnimating: boolean;
    remainingTime: number;
  } | null = null;
  
  // 시뮬레이션 시간 단위 설정
  private timeUnit = '10분'; // 기본: 1초 = 10분
  
  // 시뮬레이션 시간 최적화를 위한 변수들
  private simulationStartTime: number = Date.now()
  private lastSimulationTimeUpdate: number = 0
  private simulationTimeUpdateInterval: number = 100 // 100ms마다 시뮬레이션 시간 업데이트
  
  // 디버깅용 카운터
  private rangeCheckCounter = 0;
  private inRangeCounter = 0;

  // 애니메이션 최적화를 위한 새로운 변수들
  private animationId: number | null = null;
  private animationStartTime: number = 0;
  private animationDuration: number = 2000; // 2초 동안 부드럽게 이동
  private startPrice: number = 150;
  private targetPrice: number = 150;
  private isAnimating: boolean = false;
  
  // React 상태 최적화를 위한 변수들
  private frameCount: number = 0;
  private lastNotifyTime: number = 0;
  private notifyThrottle: number = 500; // 2000ms → 500ms (부드러운 업데이트)
  
  // 렌더링 최적화를 위한 변수들
  private lastProfitUpdate: number = 0;
  private profitUpdateInterval: number = 2000; // 1초 → 2초 (노트북 최적화)
  private isUpdating: boolean = false; // 중복 업데이트 방지
  
  // 노트북 성능 최적화를 위한 추가 변수들
  private lastCanvasUpdate: number = 0;
  private canvasUpdateInterval: number = 100; // Canvas 업데이트 주기 (60fps → 10fps)
  private lastFishUpdate: number = 0;
  private fishUpdateInterval: number = 2000; // 물고기 움직임 주기 (1초 → 2초)
  private lastSimulationUpdate: number = 0;
  private simulationUpdateInterval: number = 500; // 시뮬레이션 시간 업데이트 (100ms → 500ms)

  constructor() {
    this.state = {
      price: 153, // Start at 153 (same as demo)
      schoolCenter: 153, // Fish start at same position  
      netCenter: 155, // Net center at 155 (same as demo)
      netWidthPercent: (10 / 155) * 100, // Range to cover 150-160 exactly
      accumulatedProfit: 0,
      harvestableProfit: 0,
      harvestedProfit: 0,
      lastUpdateTime: Date.now(),
      priceDirection: 1, // start increasing
      isAutoRebalancing: false,
      forceRebalanceAnimation: false,
    };
    
    // Don't start profit tracking automatically
  }

  start() {
    if (this.intervalId) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.updatePrice();
      this.updateSchoolCenter();
      this.updateProfit();
      this.notifyListeners();
    }, 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
    }
    // Note: Don't stop profit tracking when stopping price movement
  }

  startProfitTracking() {
    console.log('🚀 startProfitTracking 호출됨');
    console.log('현재 profitIntervalId:', this.profitIntervalId);
    if (this.profitIntervalId) {
      console.log('⚠️ 이미 수익 추적이 실행 중입니다. 기존 인터벌을 정리하고 새로 시작합니다.');
      clearInterval(this.profitIntervalId);
      this.profitIntervalId = null;
    }
    
    console.log('⏰ 수익 추적 인터벌 시작 (500ms)');
    this.profitIntervalId = setInterval(() => {
      // 디버깅: 인터벌 실행 확인
      if (this.rangeCheckCounter % 10 === 0) {
        console.log(`⚡ 수익 추적 인터벌 실행 중 (${this.rangeCheckCounter})`);
      }
      
      // 중복 업데이트 방지
      if (this.isUpdating) {
        console.log('⏸️ isUpdating = true, 수익 계산 스킵');
        return;
      }
      
      const now = Date.now();
      // 수익 업데이트 주기 제어 (디버깅을 위해 더 자주 실행)
      const timeSinceLastUpdate = now - this.lastProfitUpdate;
      if (timeSinceLastUpdate >= 1000) { // 2초 → 1초로 단축
        this.isUpdating = true;
        this.lastProfitUpdate = now;
        
        console.log('🔥 batchUpdate(profit) 호출 - updateProfit 실행 예정');
        this.batchUpdate('profit', () => {
          this.updateProfit();
        });
        
        // 업데이트 완료 후 플래그 해제 (더 긴 지연)
        setTimeout(() => {
          this.isUpdating = false;
        }, 200); // 100ms → 200ms (노트북 최적화)
      }
    }, 2000); // 1초 → 2초 (노트북 최적화)
    
    console.log('Profit tracking started (노트북 최적화 모드)');
  }

  stopProfitTracking() {
    if (this.profitIntervalId) {
      clearInterval(this.profitIntervalId);
      this.profitIntervalId = null;
    }
    console.log('Profit tracking stopped');
  }

  private updatePrice() {
    if (this.useCustomRange) {
      // Sequential movement within custom range
      this.state.price += this.state.priceDirection;
      
      // Change direction at boundaries
      if (this.state.price >= this.customRange.max) {
        this.state.price = this.customRange.max;
        this.state.priceDirection = -1;
      } else if (this.state.price <= this.customRange.min) {
        this.state.price = this.customRange.min;
        this.state.priceDirection = 1;
      }
    } else {
      // Random walk ±0.1%
      const change = (Math.random() - 0.5) * 0.002; // ±0.1%
      this.state.price = Math.max(1, this.state.price * (1 + change));
    }
  }

  private updateSchoolCenter() {
    if (this.useCustomRange) {
      // In sequential mode, fish follow price more closely
      const diff = this.state.price - this.state.schoolCenter;
      this.state.schoolCenter += diff * 0.5; // 50% convergence - much faster
    } else {
      // In random mode, fish move slowly towards the current price
      const diff = this.state.price - this.state.schoolCenter;
      this.state.schoolCenter += diff * 0.02; // 2% convergence per update
    }
  }

  private updateProfit() {
    const now = Date.now();
    const currentlyInRange = this.isInRange();
    
    // 디버깅: updateProfit 호출 확인
    if (this.rangeCheckCounter % 40 === 0) { // 20초마다 한 번 출력
      console.log(`🔄 updateProfit 호출됨 (호출횟수: ${this.rangeCheckCounter})`);
    }
    
    // 디버깅용: 범위 안/밖 비율 체크 (로그 제거)
    if (!this.rangeCheckCounter) this.rangeCheckCounter = 0;
    if (!this.inRangeCounter) this.inRangeCounter = 0;
    this.rangeCheckCounter++;
    if (currentlyInRange) this.inRangeCounter++;
    
    if (currentlyInRange && this.depositAmount > 0) {
      // 디버깅 정보
      if (this.rangeCheckCounter % 20 === 0) { // 10초마다 한 번씩 출력
        console.log(`💰 수익 계산 중: 예치금 $${this.depositAmount}, APR ${this.aprRate}%, 범위 안: ${currentlyInRange}`);
      }
      
      // 최적화된 시뮬레이션 시간 계산 사용
      const simulationTimeInSeconds = this.getSimulationTime() / 1000
      
      // 연이율 계산을 시뮬레이션 시간에 맞춰 정확하게
      const yearlyProfit = this.depositAmount * this.aprRate; // 연간 수익
      const dailyProfit = yearlyProfit / 365; // 일일 수익
      
      // 시뮬레이션 시간에 따른 정확한 수익 계산
      const getDaysPerSecond = () => {
        switch(this.timeUnit) {
          case '10분': return 10 / (24 * 60); // 1초 = 10분 = 10/1440일
          case '1시간': return 1 / 24; // 1초 = 1시간 = 1/24일
          case '1일': return 1; // 1초 = 1일
          case '7일': return 7; // 1초 = 7일
          default: return 10 / (24 * 60);
        }
      };
      
      const daysPerSecond = getDaysPerSecond();
      const profitPerSecond = dailyProfit * daysPerSecond; // 1초당 수익
      const profitPer500ms = profitPerSecond / 2; // 500ms당 수익 (1초의 1/2)
      
      // 시뮬레이션 시간에 맞춘 수익 적용
      const oldProfit = this.state.accumulatedProfit;
      this.state.accumulatedProfit += profitPer500ms;
      
      // 디버깅: 수익 증가 확인
      if (this.rangeCheckCounter % 20 === 0 && profitPer500ms > 0) {
        console.log(`📈 수익 증가: $${oldProfit.toFixed(4)} → $${this.state.accumulatedProfit.toFixed(4)} (+$${profitPer500ms.toFixed(4)})`);
      }
      
      // $5 단위로 수확 가능한 수익을 누적 수익에 추가
      this.updateHarvestableProfit();
    }
    
    // 시뮬레이션 시간 업데이트
    this.updateSimulationTime();
    
    // 데모 실행 중일 때만 자동 리밸런싱 체크 (일시정지 상태와 관계없이)
    if (this.isDemoRunning) {
      this.checkAutoRebalanceForDemo();
    } else {
      this.wasInRange = currentlyInRange;
    }
    this.state.lastUpdateTime = now;
  }

  // 수확가능을 누적수익과 동일하게 증가시키기
  private updateHarvestableProfit() {
    // 누적수익에서 이미 수확한 부분을 제외한 나머지가 수확가능
    this.state.harvestableProfit = this.state.accumulatedProfit - this.state.harvestedProfit;
  }

  private triggerAutoRebalance() {
    // 이미 리밸런싱 중이거나 타이머가 설정된 경우 스킵
    if (this.isAutoRebalancing || this.rebalanceTimeoutId) {
      console.log('⚠️ 자동 리밸런싱 중복 호출 방지 - 스킵');
      return;
    }

    this.isAutoRebalancing = true;
    this.state.isAutoRebalancing = true;
    
    console.log('🚀 자동 리밸런싱 트리거!')
    
    // Wait 0.5 seconds then rebalance (빠른 반응)
    this.rebalanceTimeoutId = setTimeout(() => {
      console.log('⏰ 0.5초 후 rebalance() 실행')
      this.rebalance();
      
      // 강제 애니메이션 플래그 설정
      this.state.forceRebalanceAnimation = true;
      
      // rebalance 후 즉시 상태 변경 알림 (애니메이션 트리거)
      this.notifyListeners();
      
      // 타이머 ID 초기화 (중복 호출 방지용)
      this.rebalanceTimeoutId = null;
      
      // 애니메이션 플래그는 즉시 리셋 (한 번만 트리거)
      setTimeout(() => {
        this.state.forceRebalanceAnimation = false;
      }, 100);
      
      // Keep showing "리밸런스 중..." for 1.5 more seconds (단축)
      setTimeout(() => {
        this.isAutoRebalancing = false;
        this.state.isAutoRebalancing = false;
        this.notifyListeners();
        console.log('🏁 자동 리밸런싱 완료')
      }, 1500);
    }, 500);
    
    // 즉시 상태 변경 알림 (isAutoRebalancing = true 전달)
    this.notifyListeners();
  }

  private isInRange(): boolean {
    const netHalfWidth = (this.state.netWidthPercent / 2) / 100;
    const lowerBound = this.state.netCenter * (1 - netHalfWidth);
    const upperBound = this.state.netCenter * (1 + netHalfWidth);
    
    return this.state.schoolCenter >= lowerBound && this.state.schoolCenter <= upperBound;
  }

  getState(): PriceSimState {
    return { ...this.state };
  }

  rebalance() {
    console.log('🔄 리밸런싱 실행 시작')
    console.log(`현재 상태: schoolCenter=${this.state.schoolCenter.toFixed(2)}, netCenter=${this.state.netCenter.toFixed(2)}, netWidthPercent=${this.state.netWidthPercent.toFixed(2)}`)
    
    // Set net range to current price ±$5 (total range of $10)
    const currentPrice = this.state.schoolCenter;
    const lowerBound = currentPrice - 5;
    const upperBound = currentPrice + 5;
    const netCenter = (lowerBound + upperBound) / 2; // Same as currentPrice
    
    // Calculate the percentage width needed for a $10 range
    // Formula: percentage = (range_width / center_price) * 100
    // For ±$5 range: percentage = (10 / currentPrice) * 100
    const oldNetCenter = this.state.netCenter;
    this.state.netCenter = netCenter;
    this.state.netWidthPercent = (10 / netCenter) * 100;
    
    console.log(`새로운 상태: netCenter=${this.state.netCenter.toFixed(2)}, netWidthPercent=${this.state.netWidthPercent.toFixed(2)}`)
    console.log(`netCenter 변화: ${oldNetCenter.toFixed(2)} → ${this.state.netCenter.toFixed(2)} (차이: ${Math.abs(this.state.netCenter - oldNetCenter).toFixed(2)})`)
    
    // Notify listeners to update UI
    this.notifyListeners();
  }

  harvest(amount: number) {
    this.state.accumulatedProfit = Math.max(0, this.state.accumulatedProfit - amount);
  }

  // 수확 가능한 수익을 수확한 수익에 추가
  harvestHarvestable() {
    const harvestAmount = this.state.harvestableProfit;
    if (harvestAmount > 0) {
      this.state.harvestedProfit += harvestAmount;
      // harvestableProfit은 updateHarvestableProfit()에서 자동으로 재계산됨
      // 누적수익은 계속 쌓이도록 유지 (초기화하지 않음)
      this.updateHarvestableProfit(); // 수확 후 수확가능 금액 재계산
      this.notifyListeners();
      return harvestAmount;
    }
    return 0;
  }

  subscribe(listener: (state: PriceSimState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // 간소화된 배치 업데이트 시스템 (성능 최적화)
  private batchUpdate(updateType: string, callback: () => void) {
    // 수익 계산은 예외적으로 실행 허용
    if (this.isUpdating && updateType !== 'profit') {
      console.log(`⏸️ batchUpdate(${updateType}) 스킵: isUpdating = true`);
      return;
    }
    
    console.log(`🚀 batchUpdate(${updateType}) 실행`);
    callback();
    this.scheduleNotify();
  }

  private scheduleNotify() {
    const now = Date.now();
    // 알림 주기를 더욱 늘려서 CPU 사용량 감소
    if (now - this.lastNotifyTime >= this.notifyThrottle) {
      this.notifyListeners();
      this.lastNotifyTime = now;
    }
  }

  // 최적화된 상태 알림
  private notifyListeners() {
    // 리스너 수 제한
    if (this.listeners.length > 10) {
      console.warn('Too many listeners, limiting to 10');
      this.listeners = this.listeners.slice(0, 10);
    }
    
    // React 리렌더링 트리거
    const newState = { ...this.state };
    this.listeners.forEach(listener => {
      try {
        listener(newState);
      } catch (error) {
        console.warn('Listener error:', error);
      }
    });
  }

  getNetRange() {
    const halfWidth = (this.state.netWidthPercent / 2) / 100;
    return {
      lower: this.state.netCenter * (1 - halfWidth),
      upper: this.state.netCenter * (1 + halfWidth),
    };
  }

  setPriceRange(min: number, max: number) {
    this.customRange = { min, max };
    this.useCustomRange = true;
    // Set initial price to min and direction to increasing
    this.state.price = min;
    this.state.priceDirection = 1;
  }

  resetToRandomMode() {
    this.useCustomRange = false;
  }

  getCurrentRange(): PriceRange | null {
    return this.useCustomRange ? { ...this.customRange } : null;
  }

  isSimulationRunning(): boolean {
    return this.isRunning;
  }

  // Manual price control methods
  incrementPrice() {
    this.state.price += 1;
    // schoolCenter는 천천히 따라가도록 (리밸런싱 알림을 위해)
    const diff = this.state.price - this.state.schoolCenter;
    this.state.schoolCenter += diff * 0.5; // 50%로 조금 더 빠르게
    
    // 범위 벗어남 체크 및 콜백 호출
    this.checkRangeAndNotify();
    
    this.updateProfit(); // Update profit immediately
    this.notifyListeners(); // Force immediate UI update
  }

  decrementPrice() {
    this.state.price = Math.max(1, this.state.price - 1); // Don't go below $1
    // schoolCenter는 천천히 따라가도록 (리밸런싱 알림을 위해)
    const diff = this.state.price - this.state.schoolCenter;
    this.state.schoolCenter += diff * 0.5; // 50%로 조금 더 빠르게
    
    // 범위 벗어남 체크 및 콜백 호출
    this.checkRangeAndNotify();
    
    this.updateProfit(); // Update profit immediately
    this.notifyListeners(); // Force immediate UI update
  }

  // 수동 제어 시작 (버튼 누름)
  startManualControl(): void {
    if (this.isDemoRunning) {
      this.pauseDemo(0); // duration 0 = 수동 제어 모드
      console.log('🎮 수동 제어 모드 시작');
    }
  }

  // 수동 제어 종료 (버튼 뗌)
  stopManualControl(): void {
    if (this.isDemoRunning && this.isDemoPaused) {
      this.resumeDemo();
      console.log('▶️ 수동 제어 모드 종료 - 데모 재개');
    } else {
      console.log('⚠️ 수동 제어 종료 시도했지만 조건 불충족:', {
        isDemoRunning: this.isDemoRunning,
        isDemoPaused: this.isDemoPaused
      });
    }
  }

  // 범위 체크 및 알림 메서드 (수동 가격 조작용)
  private checkRangeAndNotify() {
    const currentlyInRange = this.isInRange();
    
    // Check if just moved out of range
    if (this.wasInRange && !currentlyInRange && !this.isAutoRebalancing) {
      console.log('📢 수동 조작으로 범위 벗어남 - 리밸런싱 알림 표시');
      
      // 데모 실행 중이 아닐 때만 수동 조작으로 인한 자동 리밸런싱 트리거
      // (데모 실행 중에는 updateProfit에서 이미 처리됨)
      if (!this.isDemoRunning && this.autoRebalanceEnabled) {
        // 자동 리밸런싱이 활성화된 경우 자동으로 리밸런싱
        this.triggerAutoRebalance();
      } else if (!this.autoRebalanceEnabled) {
        // 자동 리밸런싱이 비활성화된 경우 콜백 호출 (토스트 표시)
        if (this.onOutOfRangeCallback) {
          this.onOutOfRangeCallback();
        }
      }
    }
    
    this.wasInRange = currentlyInRange;
  }

  // Add method to expose stopProfitTracking for cleanup
  destroy() {
    this.stop();
    this.stopDemo();
    this.stopProfitTracking(); // Only stop on destroy
    
    // 모든 타이머 정리
    if (this.rebalanceTimeoutId) {
      clearTimeout(this.rebalanceTimeoutId);
      this.rebalanceTimeoutId = null;
    }
    
    // 리밸런싱 상태 초기화
    this.isAutoRebalancing = false;
    this.state.isAutoRebalancing = false;
    this.state.forceRebalanceAnimation = false;
  }

  // Demo functionality - Continuous random movement (노트북 최적화)
  startDemo() {
    if (this.isDemoRunning) return;
    
    this.isDemoRunning = true;
    this.demoCurrentPrice = this.state.price;
    this.generateNewTarget();
    
    // 데모 시작/재개 시 수익 추적도 다시 시작
    console.log(`🔍 수익 추적 확인: depositAmount = $${this.depositAmount}, aprRate = ${this.aprRate}`);
    if (this.depositAmount > 0) {
      console.log('✅ 예치금이 있으므로 수익 추적 시작');
      this.startProfitTracking();
    } else {
      console.log('❌ 예치금이 0이므로 수익 추적 안함');
    }
    
    console.log('💰 가격 변동 데모 시작! 데모 중지까지 계속 가격이 변동합니다.');
    
    // requestAnimationFrame을 사용한 부드러운 애니메이션 (노트북 최적화)
    const animate = () => {
      if (!this.isDemoRunning) return;
      
      // 노트북 성능을 위한 프레임 스킵
      const now = Date.now();
      if (now - this.lastCanvasUpdate >= this.canvasUpdateInterval) {
        this.runDemoStep();
        this.lastCanvasUpdate = now;
      }
      
      // 배치 업데이트로 상태 변경 (무한루프 방지)
      if (!this.isUpdating) {
        this.notifyListeners();
      }
      
      this.animationId = requestAnimationFrame(animate);
    };
    
    this.animationId = requestAnimationFrame(animate);
  }

  stopDemo() {
    this.isDemoRunning = false;
    this.isDemoPaused = false;
    
    // 애니메이션 정리
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.isAnimating = false;
    
    // 일시정지 관련 정리
    if (this.demoPauseTimeout) {
      clearTimeout(this.demoPauseTimeout);
      this.demoPauseTimeout = null;
    }
    this.pausedAnimationState = null;
    
    // 데모가 중지되면 수익 추적도 일시정지
    this.stopProfitTracking();
  }

  // 부드러운 애니메이션을 위한 보간 함수
  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  // 부드러운 애니메이션을 위한 이징 함수
  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  private generateNewTarget() {
    let randomMove: number;
    do {
      randomMove = Math.floor(Math.random() * 7) - 3; // -3 to +3
    } while (randomMove === 0); // Ensure we don't get 0
    
    // Calculate target price with boundaries
    let newTargetPrice = this.demoCurrentPrice + randomMove;
    newTargetPrice = Math.max(this.minDemoPrice, Math.min(this.maxDemoPrice, newTargetPrice));
    
    console.log(`🎯 새로운 가격 목표 생성: $${this.demoCurrentPrice.toFixed(2)} → $${newTargetPrice.toFixed(2)} (${randomMove > 0 ? '+' : ''}${randomMove})`);
    
    // 애니메이션 시작 설정
    this.startPrice = this.demoCurrentPrice;
    this.targetPrice = newTargetPrice;
    this.demoTargetPrice = newTargetPrice;
    this.demoDirection = this.demoTargetPrice > this.demoCurrentPrice ? 1 : -1;
    this.animationStartTime = Date.now();
    this.isAnimating = true;
  }

  private runDemoStep() {
    // 데모가 일시정지 상태이면 가격 애니메이션은 스킵하지만 범위 체크는 수행
    if (this.isDemoPaused) {
      // 일시정지 중에도 자동 리밸런싱 체크는 계속 수행
      this.checkAutoRebalanceForDemo();
      return;
    }

    if (!this.isAnimating) {
      // 애니메이션이 끝났으면 새로운 타겟 생성
      this.generateNewTarget();
      return;
    }

    const elapsedTime = Date.now() - this.animationStartTime;
    const progress = Math.min(elapsedTime / this.animationDuration, 1);
    const easedProgress = this.easeInOutQuad(progress);

    this.demoCurrentPrice = this.lerp(this.startPrice, this.targetPrice, easedProgress);

    // 가격 변동 디버깅
    if (Math.floor(elapsedTime / 1000) !== Math.floor((elapsedTime - 100) / 1000)) {
      console.log(`💹 가격 변동 중: $${this.demoCurrentPrice.toFixed(2)} (목표: $${this.targetPrice.toFixed(2)}, 진행률: ${(progress*100).toFixed(1)}%)`);
    }

    // 애니메이션이 끝났을 때 처리
    if (progress >= 1) {
      this.demoCurrentPrice = this.targetPrice;
      console.log(`✅ 가격 목표 도달: $${this.targetPrice.toFixed(2)}`);
      this.isAnimating = false;
      this.generateNewTarget(); // 새로운 타겟 생성
    }
    
    // 배치 업데이트로 상태 변경
    this.batchUpdate('demo', () => {
      this.state.price = this.demoCurrentPrice;
      // schoolCenter는 가격을 천천히 따라가도록 (범위 벗어남 효과)
      const diff = this.demoCurrentPrice - this.state.schoolCenter;
      this.state.schoolCenter += diff * 0.3; // 30%씩 천천히 따라감
    });
  }

  isDemoActive(): boolean {
    return this.isDemoRunning;
  }

  // 데모 일시정지 (수동 가격 조작 시 호출)
  pauseDemo(duration: number = 0): void {
    if (!this.isDemoRunning || this.isDemoPaused) {
      return;
    }

    console.log('⏸️ 데모 일시정지 (수동 조작 감지)');
    this.isDemoPaused = true;

    // 현재 애니메이션 상태 저장
    if (this.isAnimating) {
      const elapsedTime = Date.now() - this.animationStartTime;
      const remainingTime = Math.max(0, this.animationDuration - elapsedTime);
      
      this.pausedAnimationState = {
        startPrice: this.startPrice,
        targetPrice: this.targetPrice,
        animationStartTime: this.animationStartTime,
        animationDuration: this.animationDuration,
        isAnimating: this.isAnimating,
        remainingTime: remainingTime
      };
    }

    // 애니메이션 중지
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isAnimating = false;

    // 기존 재개 타이머 취소
    if (this.demoPauseTimeout) {
      clearTimeout(this.demoPauseTimeout);
      this.demoPauseTimeout = null;
    }

    // duration이 0이면 수동 제어 모드 (자동 재개 안 함)
    if (duration > 0) {
      // 지정된 시간 후 자동 재개
      this.demoPauseTimeout = setTimeout(() => {
        this.resumeDemo();
      }, duration);
    }
  }

  // 데모 재개
  resumeDemo(): void {
    if (!this.isDemoRunning || !this.isDemoPaused) {
      return;
    }

    console.log('▶️ 데모 재개');
    this.isDemoPaused = false;

    // 일시정지 타이머 정리
    if (this.demoPauseTimeout) {
      clearTimeout(this.demoPauseTimeout);
      this.demoPauseTimeout = null;
    }

    // 저장된 애니메이션 상태가 있으면 복원, 없으면 새로 시작
    if (this.pausedAnimationState && this.pausedAnimationState.remainingTime > 0) {
      // 남은 시간으로 애니메이션 재개
      this.startPrice = this.demoCurrentPrice; // 현재 가격에서 시작
      this.targetPrice = this.pausedAnimationState.targetPrice;
      this.animationDuration = this.pausedAnimationState.remainingTime;
      this.animationStartTime = Date.now();
      this.isAnimating = true;
      this.pausedAnimationState = null;
      
      console.log(`🔄 애니메이션 재개: $${this.startPrice.toFixed(2)} → $${this.targetPrice.toFixed(2)} (${this.animationDuration}ms)`);
    } else {
      // 새로운 애니메이션 시작
      this.pausedAnimationState = null;
      this.generateNewTarget();
      console.log(`🆕 새 애니메이션 시작: $${this.startPrice.toFixed(2)} → $${this.targetPrice.toFixed(2)}`);
    }

    // 애니메이션 루프 직접 재시작 (startDemo 우회)
    this.restartAnimationLoop();
  }

  // 애니메이션 루프만 재시작하는 메서드
  private restartAnimationLoop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    const animate = () => {
      if (!this.isDemoRunning) return;

      const now = Date.now();
      if (now - this.lastCanvasUpdate >= this.canvasUpdateInterval) {
        this.runDemoStep();
        this.lastCanvasUpdate = now;
      }

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
    console.log('🔄 애니메이션 루프 재시작됨');
  }

  // 데모 일시정지 상태 확인
  isDemoPausedState(): boolean {
    return this.isDemoPaused;
  }

  // 데모 중 자동 리밸런싱 체크 (일시정지 중에도 호출됨)
  private checkAutoRebalanceForDemo(): void {
    const currentlyInRange = this.isInRange();
    
    // Check if just moved out of range (only during demo)
    if (this.wasInRange && !currentlyInRange) {
      console.log('🚨 범위 벗어남 감지! (일시정지 중)', `isAutoRebalancing: ${this.isAutoRebalancing}`, `autoRebalanceEnabled: ${this.autoRebalanceEnabled}`, `rebalanceTimeoutId: ${!!this.rebalanceTimeoutId}`)
      
      if (this.autoRebalanceEnabled && !this.isAutoRebalancing && !this.rebalanceTimeoutId) {
        // 자동 리밸런싱이 활성화되고 현재 리밸런싱 중이 아니며 타이머도 설정되지 않은 경우에만 트리거
        console.log('✅ 자동 리밸런싱 트리거! (일시정지 중)')
        this.triggerAutoRebalance();
      } else if (!this.autoRebalanceEnabled) {
        // 자동 리밸런싱이 비활성화된 경우 콜백 호출 (토스트 표시)
        if (this.onOutOfRangeCallback) {
          this.onOutOfRangeCallback();
        }
      } else {
        console.log('❌ 이미 자동 리밸런싱 진행 중이거나 예약됨 - 스킵 (일시정지 중)')
      }
    }
    
    this.wasInRange = currentlyInRange;
  }

  getDemoStatus(): string {
    // Check if auto-rebalancing (not demo-specific)
    if (this.isAutoRebalancing) return '리밸런스 중...';
    
    // Demo-specific status
    if (!this.isDemoRunning) return '';
    if (this.isDemoPaused) return '데모 일시정지 (수동 조작)';
    if (this.isAnimating) return '데모 실행 중 (가격 변동)';
    
    return '데모 실행 중 (대기)';
  }

  // New methods for setting deposit and APR
  setDepositAndApr(depositAmount: number, aprRate: number) {
    console.log(`🏦 setDepositAndApr 호출: $${depositAmount}, APR: ${aprRate}%`);
    this.depositAmount = depositAmount;
    this.aprRate = aprRate / 100; // Convert percentage to decimal
    console.log(`✅ 설정 완료: 예치금 $${this.depositAmount}, APR: ${this.aprRate} (${aprRate}%)`);
  }

  // 복리 재투자를 위한 메서드들
  getDepositAmount(): number {
    return this.depositAmount;
  }

  addToDeposit(amount: number) {
    this.depositAmount += amount;
    console.log(`🔄 복리 재투자: $${amount.toFixed(2)} 추가. 새로운 예치금: $${this.depositAmount.toFixed(2)}`);
    console.log(`새로운 연간 수익 잠재력: $${(this.depositAmount * this.aprRate).toFixed(2)}`);
  }

  startDemoWithSettings() {
    console.log('🎮 startDemoWithSettings 호출됨');
    console.log(`예치금: $${this.depositAmount}, APR: ${this.aprRate}%`);
    
    if (this.depositAmount > 0) {
      console.log('✅ 예치금이 있으므로 수익 추적 및 데모 시작');
      this.startProfitTracking();
      this.startDemo();
    } else {
      console.log('❌ 예치금이 0이므로 수익 추적하지 않음');
    }
  }

  resetProfit() {
    this.state.accumulatedProfit = 0;
    this.state.harvestableProfit = 0;
    this.state.harvestedProfit = 0;
  }

  // 자동 리밸런싱 설정 메서드들
  setAutoRebalanceEnabled(enabled: boolean) {
    this.autoRebalanceEnabled = enabled;
    console.log(`Auto rebalance ${enabled ? 'enabled' : 'disabled'}`);
  }

  setOnOutOfRangeCallback(callback: (() => void) | null) {
    this.onOutOfRangeCallback = callback;
  }

  // 시뮬레이션 시간 단위 설정 메서드
  setTimeUnit(unit: string) {
    this.timeUnit = unit;
    // 시뮬레이션 시작 시간을 현재로 리셋하여 정확한 계산 보장
    this.simulationStartTime = Date.now();
    this.lastSimulationTimeUpdate = Date.now();
    console.log(`Time unit set to: 1초 = ${unit}`);
  }

  getTimeUnit(): string {
    return this.timeUnit;
  }

  // 최적화된 시뮬레이션 시간 계산
  private getSimulationTime(): number {
    const now = Date.now()
    const elapsedRealTime = now - this.simulationStartTime
    
    // 시뮬레이션 시간 단위에 따른 변환
    const getSimulationMultiplier = () => {
      switch(this.timeUnit) {
        case '10분': return 10 * 60 * 1000 // 1초 = 10분 = 600,000ms
        case '1시간': return 60 * 60 * 1000 // 1초 = 1시간 = 3,600,000ms
        case '1일': return 24 * 60 * 60 * 1000 // 1초 = 1일 = 86,400,000ms
        case '7일': return 7 * 24 * 60 * 60 * 1000 // 1초 = 7일 = 604,800,000ms
        default: return 10 * 60 * 1000
      }
    }
    
    const multiplier = getSimulationMultiplier()
    return elapsedRealTime * multiplier
  }

  // 부드러운 시뮬레이션 시간 업데이트 (노트북 최적화)
  private updateSimulationTime(): void {
    const now = Date.now()
    
    // 시뮬레이션 시간 업데이트 주기 제어 (노트북 최적화)
    if (now - this.lastSimulationUpdate >= this.simulationUpdateInterval) {
      this.lastSimulationUpdate = now
      
      // 시뮬레이션 시간을 초 단위로 변환하여 상태 업데이트
      const simulationTimeInSeconds = this.getSimulationTime() / 1000
      
      // 무한루프 방지를 위한 안전장치
      if (simulationTimeInSeconds > 1000000) { // 100만초 이상이면 이상
        console.warn('Simulation time too high, resetting');
        this.simulationStartTime = Date.now();
        return;
      }
      
      // 배치 업데이트로 시뮬레이션 시간 변경 (노트북 최적화)
      this.batchUpdate('simulationTime', () => {
        // 여기서 시뮬레이션 시간 관련 상태를 업데이트할 수 있음
        // 예: this.state.simulationTime = simulationTimeInSeconds
      })
    }
  }

  // 리밸런싱 중 일시정지 기능
  private isPaused = false;
  private pausedState: {
    wasDemoRunning: boolean;
    wasProfitTracking: boolean;
  } = {
    wasDemoRunning: false,
    wasProfitTracking: false
  };

  pauseForRebalancing() {
    if (this.isPaused) return;
    
    console.log('⏸️ 리밸런싱 중 수익/시간 일시정지');
    this.isPaused = true;
    
    // 현재 상태 저장
    this.pausedState.wasDemoRunning = this.isDemoRunning;
    this.pausedState.wasProfitTracking = !!this.profitIntervalId;
    
    // 수익 추적 일시정지
    if (this.profitIntervalId) {
      clearInterval(this.profitIntervalId);
      this.profitIntervalId = null;
    }
    
    // 데모는 일시정지하지 않고 계속 실행 (수익만 정지)
    // this.isDemoRunning = false; // 이 줄을 제거하여 가격 움직임 유지
  }

  resumeAfterRebalancing() {
    if (!this.isPaused) return;
    
    console.log('▶️ 리밸런싱 완료, 수익/시간 재개');
    this.isPaused = false;
    
    // 수익 추적 재개 (데모가 실행 중이고 예치금이 있는 경우)
    if (this.pausedState.wasProfitTracking && this.depositAmount > 0) {
      this.startProfitTracking();
    }
    
    // 데모는 계속 실행되고 있으므로 별도 재개 필요 없음
    
    // 저장된 상태 정보 초기화
    this.pausedState = {
      wasDemoRunning: false,
      wasProfitTracking: false
    };
  }


}
