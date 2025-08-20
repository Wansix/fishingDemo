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
  
  // 시뮬레이션 속도 설정
  private simulationSpeed = 1; // 기본 속도 (1초 = 10분)

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
    if (this.profitIntervalId) return;
    
    this.profitIntervalId = setInterval(() => {
      this.updateProfit();
      // Force UI update by creating new state object
      const newState = { ...this.state };
      this.listeners.forEach(listener => listener(newState));
    }, 100); // Every 100ms for $0.02 per 100ms = $0.2 per second
    
    console.log('Profit tracking started');
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
    
    if (currentlyInRange && this.depositAmount > 0) {
      // Calculate profit based on APR and deposit amount
      // Daily profit = (deposit * APR) / 365
      // Per 100ms profit in simulation = (daily profit / 1440) * (10/60) 
      // Because 1 second = 10 minutes, so 100ms = 1 minute in simulation
      const dailyProfit = (this.depositAmount * this.aprRate) / 365;
      const profitPer100ms = (dailyProfit / 1440); // 1440 minutes in a day
      
      // 시뮬레이션 속도만 반영 (현실적인 수익률)
      const adjustedProfitPer100ms = profitPer100ms * this.simulationSpeed;
      
      this.state.accumulatedProfit += adjustedProfitPer100ms;
      
      // $5 단위로 수확 가능한 수익을 누적 수익에 추가
      this.updateHarvestableProfit();
    }
    
    // Check if just moved out of range (only during demo)
    if (this.wasInRange && !currentlyInRange && this.isDemoRunning && !this.isAutoRebalancing) {
      if (this.autoRebalanceEnabled) {
        // 자동 리밸런싱이 활성화된 경우 자동으로 리밸런싱
        this.triggerAutoRebalance();
      } else {
        // 자동 리밸런싱이 비활성화된 경우 콜백 호출 (토스트 표시)
        if (this.onOutOfRangeCallback) {
          this.onOutOfRangeCallback();
        }
      }
    }
    
    this.wasInRange = currentlyInRange;
    this.state.lastUpdateTime = now;
  }

  // 수확가능을 누적수익과 동일하게 증가시키기
  private updateHarvestableProfit() {
    // 누적수익에서 이미 수확한 부분을 제외한 나머지가 수확가능
    this.state.harvestableProfit = this.state.accumulatedProfit - this.state.harvestedProfit;
  }

  private triggerAutoRebalance() {
    this.isAutoRebalancing = true;
    
    // Wait 1 second then rebalance
    this.rebalanceTimeoutId = setTimeout(() => {
      this.rebalance();
      
      // Keep showing "리밸런스 중..." for 2 more seconds
      setTimeout(() => {
        this.isAutoRebalancing = false;
        this.notifyListeners();
      }, 2000);
      
      this.notifyListeners();
    }, 1000);
    
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
    // Set net range to current price ±$5 (total range of $10)
    const currentPrice = this.state.schoolCenter;
    const lowerBound = currentPrice - 5;
    const upperBound = currentPrice + 5;
    const netCenter = (lowerBound + upperBound) / 2; // Same as currentPrice
    
    // Calculate the percentage width needed for a $10 range
    // Formula: percentage = (range_width / center_price) * 100
    // For ±$5 range: percentage = (10 / currentPrice) * 100
    this.state.netCenter = netCenter;
    this.state.netWidthPercent = (10 / netCenter) * 100;
    
    console.log(`Rebalanced net: center=${netCenter}, range=${lowerBound}-${upperBound}, percentage=${this.state.netWidthPercent}`);
    
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

  private notifyListeners() {
    // Create a new object to trigger React re-render
    const newState = { ...this.state };
    this.listeners.forEach(listener => listener(newState));
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
    this.state.schoolCenter = this.state.price; // Instantly follow price
    this.updateProfit(); // Update profit immediately
    this.notifyListeners(); // Force immediate UI update
  }

  decrementPrice() {
    this.state.price = Math.max(1, this.state.price - 1); // Don't go below $1
    this.state.schoolCenter = this.state.price; // Instantly follow price
    this.updateProfit(); // Update profit immediately
    this.notifyListeners(); // Force immediate UI update
  }

  // Add method to expose stopProfitTracking for cleanup
  destroy() {
    this.stop();
    this.stopDemo();
    this.stopProfitTracking(); // Only stop on destroy
    if (this.rebalanceTimeoutId) {
      clearTimeout(this.rebalanceTimeoutId);
      this.rebalanceTimeoutId = null;
    }
  }

  // Demo functionality - Continuous random movement
  startDemo() {
    if (this.isDemoRunning) return;
    
    this.isDemoRunning = true;
    this.demoCurrentPrice = this.state.price;
    this.generateNewTarget();
    
    // 데모 시작/재개 시 수익 추적도 다시 시작
    if (this.depositAmount > 0) {
      this.startProfitTracking();
    }
    
    // Start continuous demo
    this.demoIntervalId = setInterval(() => {
      this.runDemoStep();
    }, 100); // Every 100ms for smooth movement
  }

  stopDemo() {
    if (this.demoIntervalId) {
      clearInterval(this.demoIntervalId);
      this.demoIntervalId = null;
    }
    this.isDemoRunning = false;
    
    // 데모가 중지되면 수익 추적도 일시정지
    this.stopProfitTracking();
  }

  private generateNewTarget() {
    // Generate random movement: -3 to +3
    let randomMove;
    do {
      randomMove = Math.floor(Math.random() * 7) - 3; // -3 to +3
    } while (randomMove === 0); // Ensure we don't get 0
    
    // Calculate target price with boundaries
    let targetPrice = this.demoCurrentPrice + randomMove;
    targetPrice = Math.max(this.minDemoPrice, Math.min(this.maxDemoPrice, targetPrice));
    
    this.demoTargetPrice = targetPrice;
    this.demoDirection = this.demoTargetPrice > this.demoCurrentPrice ? 1 : -1;
    
    console.log(`New target: ${this.demoCurrentPrice} -> ${this.demoTargetPrice} (move: ${randomMove})`);
  }

  private runDemoStep() {
    // Check if we reached the target
    if (Math.abs(this.demoCurrentPrice - this.demoTargetPrice) < 0.1) {
      this.demoCurrentPrice = this.demoTargetPrice;
      this.generateNewTarget(); // Generate new target
    } else {
      // Move towards target (0.2 per step for smooth movement)
      this.demoCurrentPrice += this.demoDirection * 0.2;
    }
    
    // Update simulator state
    this.state.price = this.demoCurrentPrice;
    this.state.schoolCenter = this.demoCurrentPrice;
    
    this.updateProfit();
    this.notifyListeners();
  }

  isDemoActive(): boolean {
    return this.isDemoRunning;
  }

  getDemoStatus(): string {
    // Check if auto-rebalancing (not demo-specific)
    if (this.isAutoRebalancing) return '리밸런스 중...';
    
    // Demo-specific status
    if (!this.isDemoRunning) return '';
    
    return ''; // Return to normal after rebalance
  }

  // New methods for setting deposit and APR
  setDepositAndApr(depositAmount: number, aprRate: number) {
    this.depositAmount = depositAmount;
    this.aprRate = aprRate / 100; // Convert percentage to decimal
    console.log(`Set deposit: $${depositAmount}, APR: ${aprRate}%`);
  }

  startDemoWithSettings() {
    if (this.depositAmount > 0) {
      this.startProfitTracking();
      this.startDemo();
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

  // 시뮬레이션 속도 설정 메서드
  setSimulationSpeed(speed: number) {
    this.simulationSpeed = speed;
    console.log(`Simulation speed set to ${speed}x`);
  }

  getSimulationSpeed(): number {
    return this.simulationSpeed;
  }


}