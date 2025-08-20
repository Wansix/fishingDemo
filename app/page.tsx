'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Bell, BellOff, Settings, Slash } from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChallengeCards from '@/components/ChallengeCards';
import AprSelector from '@/components/AprSelector';
import FishScene from '@/components/FishScene';
import FishSceneOutOfRange from '@/components/FishSceneOutOfRange';
import RecastDialog from '@/components/RecastDialog';
import HarvestDialog from '@/components/HarvestDialog';
import PriceControl from '@/components/PriceControl';
import TimeWidget from '@/components/TimeWidget';
import { PriceSimulator, PriceSimState } from '@/lib/priceSim';
import { COPY } from '@/lib/copy';

export default function Home() {
  const [simulator] = useState(() => new PriceSimulator());
  const [simState, setSimState] = useState<PriceSimState>(simulator.getState());
  const [selectedChallenge, setSelectedChallenge] = useState<'coffee' | 'meal' | null>(null);
  const [selectedApr, setSelectedApr] = useState<number>(100);
  const [isRecastDialogOpen, setIsRecastDialogOpen] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [isHarvestDialogOpen, setIsHarvestDialogOpen] = useState(false);
  const [lastAlertAmount, setLastAlertAmount] = useState(0); // 마지막으로 알림을 보낸 금액
  const [autoRebalanceEnabled, setAutoRebalanceEnabled] = useState(false); // 자동 리밸런싱 설정
  const [isRebalanceToastOpen, setIsRebalanceToastOpen] = useState(false); // 리밸런싱 토스트 상태
  const [currentRebalanceToast, setCurrentRebalanceToast] = useState<HTMLElement | null>(null); // 현재 리밸런싱 토스트 요소
  const [hasStartedBefore, setHasStartedBefore] = useState(false); // 이전에 데모를 시작한 적이 있는지
  const [currentTimeUnit, setCurrentTimeUnit] = useState('10분'); // 현재 시간 단위

  useEffect(() => {
    const unsubscribe = simulator.subscribe((newState) => {
      setSimState(newState);
    });

    // 범위 벗어남 콜백 설정
    simulator.setOnOutOfRangeCallback(() => {
      showRebalanceToast();
    });

    // Don't start demo automatically

    return () => {
      unsubscribe();
      simulator.destroy();
    };
  }, [simulator]);

  useEffect(() => {
    const currentAmount = Math.floor(simState.harvestableProfit / 5) * 5; // 5의 배수로 계산
    console.log('Alert check:', { 
      alertsEnabled, 
      harvestableProfit: simState.harvestableProfit, 
      currentAmount, 
      lastAlertAmount 
    });
    
    if (alertsEnabled && currentAmount >= 5 && currentAmount > lastAlertAmount) {
      console.log('Triggering harvest toast for amount:', currentAmount);
      setLastAlertAmount(currentAmount);
      showHarvestToast();
    }
  }, [simState.harvestableProfit, alertsEnabled, lastAlertAmount]);

  useEffect(() => {
    simulator.setAutoRebalanceEnabled(autoRebalanceEnabled);
  }, [autoRebalanceEnabled, simulator]);

  useEffect(() => {
    simulator.setTimeUnit(currentTimeUnit);
  }, [currentTimeUnit, simulator]);

  // 범위 안으로 다시 들어오면 리밸런싱 토스트 자동 닫기
  useEffect(() => {
    const isInRange = () => {
      const range = simulator.getNetRange();
      return simState.schoolCenter >= range.lower && simState.schoolCenter <= range.upper;
    };

    if (isInRange() && isRebalanceToastOpen && currentRebalanceToast) {
      // 범위 안에 들어왔고 리밸런싱 토스트가 열려있으면 자동으로 닫기
      currentRebalanceToast.style.opacity = '0';
      currentRebalanceToast.style.transform = 'translate(-50%, -50%) scale(0.8)';
      setTimeout(() => {
        if (currentRebalanceToast && document.body.contains(currentRebalanceToast)) {
          document.body.removeChild(currentRebalanceToast);
        }
        setIsRebalanceToastOpen(false);
        setCurrentRebalanceToast(null);
      }, 300);
    }
  }, [simState.schoolCenter, isRebalanceToastOpen, currentRebalanceToast, simulator]);

  const showToast = (message: string) => {
    console.log('Showing toast:', message);
    const toast = document.createElement('div');
    
    // 인라인 스타일로 강제 적용 - 가운데 정렬
    toast.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      background: #2563eb !important;
      color: white !important;
      padding: 20px 32px !important;
      border-radius: 16px !important;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4) !important;
      z-index: 99999 !important;
      font-size: 18px !important;
      font-weight: 600 !important;
      min-width: 400px !important;
      text-align: center !important;
      opacity: 1 !important;
      transition: all 0.3s ease !important;
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -50%) scale(0.8)';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  };

  const showHarvestDialog = () => {
    setIsHarvestDialogOpen(true);
  };

  const showHarvestToast = () => {
    const toast = document.createElement('div');
    
    // 토스트 스타일
    toast.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      background: #1e293b !important;
      color: white !important;
      padding: 24px 32px !important;
      border-radius: 16px !important;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4) !important;
      z-index: 99999 !important;
      font-size: 18px !important;
      font-weight: 600 !important;
      min-width: 400px !important;
      text-align: center !important;
      opacity: 1 !important;
      transition: all 0.3s ease !important;
      border: 2px solid #10b981 !important;
    `;
    
    toast.innerHTML = `
      <div style="margin-bottom: 16px; font-size: 20px;">🎉 $5 수익 달성!</div>
      <div style="margin-bottom: 20px;">수확하시겠습니까?</div>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="harvest-yes" style="
          background: #10b981; 
          color: white; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 8px; 
          cursor: pointer;
          font-weight: 600;
        ">예</button>
        <button id="harvest-no" style="
          background: #6b7280; 
          color: white; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 8px; 
          cursor: pointer;
          font-weight: 600;
        ">아니오</button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // 버튼 이벤트 리스너
    const yesButton = toast.querySelector('#harvest-yes');
    const noButton = toast.querySelector('#harvest-no');
    
    const removeToast = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -50%) scale(0.8)';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    };
    
    yesButton?.addEventListener('click', () => {
      const harvestAmount = simulator.harvestHarvestable();
      if (harvestAmount > 0) {
        showToast(`☕ 수확 완료! $${harvestAmount.toFixed(2)}를 획득했습니다.`);
        setLastAlertAmount(0); // 수확 후 알림 카운터 리셋
      }
      removeToast();
    });
    
    noButton?.addEventListener('click', () => {
      removeToast();
    });
  };

  const showRebalanceToast = () => {
    // 이미 리밸런싱 토스트가 열려있으면 새로운 토스트를 표시하지 않음
    if (isRebalanceToastOpen) {
      return;
    }
    
    setIsRebalanceToastOpen(true);
    const toast = document.createElement('div');
    setCurrentRebalanceToast(toast); // 토스트 요소를 상태에 저장
    
    // 토스트 스타일
    toast.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      background: #1e293b !important;
      color: white !important;
      padding: 24px 32px !important;
      border-radius: 16px !important;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4) !important;
      z-index: 99999 !important;
      font-size: 18px !important;
      font-weight: 600 !important;
      min-width: 400px !important;
      text-align: center !important;
      opacity: 1 !important;
      transition: all 0.3s ease !important;
      border: 2px solid #f59e0b !important;
    `;
    
    toast.innerHTML = `
      <div style="margin-bottom: 16px; font-size: 20px;">⚠️ 범위를 벗어났습니다!</div>
      <div style="margin-bottom: 20px;">리밸런싱하시겠습니까?</div>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="rebalance-yes" style="
          background: #f59e0b; 
          color: white; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 8px; 
          cursor: pointer;
          font-weight: 600;
        ">예</button>
        <button id="rebalance-no" style="
          background: #6b7280; 
          color: white; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 8px; 
          cursor: pointer;
          font-weight: 600;
        ">아니오</button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // 버튼 이벤트 리스너
    const yesButton = toast.querySelector('#rebalance-yes');
    const noButton = toast.querySelector('#rebalance-no');
    
    const removeToast = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -50%) scale(0.8)';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
        setIsRebalanceToastOpen(false); // 토스트가 완전히 제거된 후 상태 리셋
        setCurrentRebalanceToast(null); // 토스트 요소 참조도 리셋
      }, 300);
    };
    
    yesButton?.addEventListener('click', () => {
      simulator.rebalance();
      showToast('그물이 현재 가격 주변으로 이동되었습니다!');
      removeToast();
    });
    
    noButton?.addEventListener('click', () => {
      removeToast();
    });
  };

  const handleHarvestConfirm = () => {
    const harvestAmount = simulator.harvestHarvestable();
    if (harvestAmount > 0) {
      showToast(`☕ 수확 완료! $${harvestAmount}를 획득했습니다.`);
    }
    setIsHarvestDialogOpen(false);
    // 알림 상태는 유지 (자동으로 끄지 않음)
  };

  const handleHarvestCancel = () => {
    setIsHarvestDialogOpen(false);
    // 알림 상태는 유지 (자동으로 끄지 않음)
  };

  const handleRecast = () => {
    console.log('Recast button clicked');
    simulator.rebalance();
    setIsRecastDialogOpen(false);
    showToast('그물이 현재 가격 주변으로 이동되었습니다!');
  };

  const handleHarvest = () => {
    const harvestAmount = simulator.harvestHarvestable();
    if (harvestAmount > 0) {
      showToast(`☕ 수확 완료! $${harvestAmount.toFixed(2)}를 획득했습니다.`);
      setLastAlertAmount(0); // 수확 후 알림 카운터 리셋
    }
  };

  const handleSelectChallenge = (type: 'coffee' | 'meal') => {
    setSelectedChallenge(type);
    showToast(`${type === 'coffee' ? '☕ 커피값' : '🍜 밥값'} 챌린지가 시작되었습니다!`);
  };

  const handleSelectApr = (apr: number) => {
    setSelectedApr(apr);
    showToast(`APR ${apr}%가 선택되었습니다!`);
  };

  const handleTimeUnitChange = (unit: string) => {
    setCurrentTimeUnit(unit);
    showToast(`시간 단위가 1초 = ${unit}로 설정되었습니다!`);
  };

  const handleStartDemo = () => {
    if (isDemoActive) {
      // 데모 중지
      console.log('Stop demo clicked');
      simulator.stopDemo();
      setIsDemoActive(false);
      showToast('⏹️ 데모가 중지되었습니다!');
    } else {
      // 데모 시작
      console.log('Start demo clicked. Challenge:', selectedChallenge, 'APR:', selectedApr);
      
      // Validation
      if (!selectedChallenge) {
        showToast('챌린지를 먼저 선택해주세요!');
        return;
      }
      
      if (!selectedApr || selectedApr === 0) {
        showToast('APR을 먼저 선택해주세요!');
        return;
      }

      // Set deposit amount based on challenge
      const depositAmount = selectedChallenge === 'coffee' ? 1000 : 5000;
      
      // Configure simulator with deposit and APR
      simulator.setDepositAndApr(depositAmount, selectedApr);
      
      // 처음 시작할 때만 수익 리셋
      if (!hasStartedBefore) {
        simulator.resetProfit();
        setHasStartedBefore(true);
      }
      
      // Start demo
      simulator.startDemoWithSettings();
      setIsDemoActive(true);
      
      const message = hasStartedBefore ? '🚀 데모가 재개되었습니다!' : '🚀 데모가 시작되었습니다!';
      showToast(message);
    }
  };

  const handleSetPriceRange = (min: number, max: number) => {
    simulator.setPriceRange(min, max);
    showToast(`가격 범위가 $${min} ~ $${max}로 설정되었습니다!`);
  };

  const handleResetToRandom = () => {
    simulator.resetToRandomMode();
    showToast('랜덤 가격 모드로 변경되었습니다!');
  };

  const handleStart = () => {
    simulator.start();
    setIsRunning(true);
    showToast('자동 시뮬레이션이 시작되었습니다!');
  };

  const handleStop = () => {
    simulator.stop();
    setIsRunning(false);
    showToast('자동 시뮬레이션이 정지되었습니다!');
  };

  const handleIncrementPrice = () => {
    simulator.incrementPrice();
  };

  const handleDecrementPrice = () => {
    simulator.decrementPrice();
  };

  const handleStartDemoOld = () => {
    simulator.startDemo();
    showToast('데모 시나리오가 시작되었습니다!');
  };

  const handleStopDemo = () => {
    simulator.stopDemo();
    showToast('데모가 정지되었습니다.');
  };

  const isInRange = () => {
    const range = simulator.getNetRange();
    return simState.schoolCenter >= range.lower && simState.schoolCenter <= range.upper;
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}>
          </div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-5xl md:text-6xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {COPY.heroTitle}
          </motion.h1>
          
          <motion.p
            className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {COPY.heroSubtitle}
          </motion.p>
        </div>
      </section>

      {/* Challenge Cards */}
      <ChallengeCards 
        onSelectChallenge={handleSelectChallenge} 
        selectedChallenge={selectedChallenge}
      />

      {/* APR Selector */}
      <AprSelector 
        selectedApr={selectedApr}
        onSelectApr={handleSelectApr}
      />

      {/* Demo Section */}
      <section id="demo" className="py-20" style={{ marginTop: '80px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              실시간 데모
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              물고기 떼의 움직임과 그물의 상태를 실시간으로 확인해보세요
            </p>
            
            {/* Start/Stop Demo Button */}
            <motion.button
              onClick={handleStartDemo}
              className="px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-300"
              style={{
                background: isDemoActive
                  ? 'linear-gradient(135deg, #dc2626, #b91c1c)' // 빨간색 (중지)
                  : (selectedChallenge && selectedApr) 
                    ? 'linear-gradient(135deg, #10b981, #059669)' // 초록색 (시작)
                    : '#6b7280', // 회색 (비활성화)
                color: 'white',
                boxShadow: isDemoActive
                  ? '0 15px 40px rgba(220, 38, 38, 0.4)' // 빨간색 그림자
                  : (selectedChallenge && selectedApr)
                    ? '0 15px 40px rgba(16, 185, 129, 0.4)' // 초록색 그림자
                    : '0 8px 20px rgba(0, 0, 0, 0.2)', // 기본 그림자
                minWidth: '280px',
                minHeight: '70px'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isDemoActive ? '⏹️ 데모 중지하기' : '🚀 데모 시작하기'}
            </motion.button>
          </div>

          {/* Earnings Widget */}
          <div className="mb-8 flex justify-end">
            <div 
              className="backdrop-blur-sm rounded-2xl p-8 border shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                borderColor: 'rgba(148, 163, 184, 0.2)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(148, 163, 184, 0.1)'
              }}
            >
              <div className="flex items-center space-x-10">
                {/* Challenge Type */}
                {selectedChallenge && (
                  <div className="text-center min-w-[100px]">
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-2xl">
                        {selectedChallenge === 'coffee' ? '☕' : '🍜'}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {selectedChallenge === 'coffee' ? '커피값' : '밥값'}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Deposit Amount */}
                <div className="border-l border-slate-600/50 pl-8 text-center min-w-[120px]">
                  <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">예치금</div>
                  <div className="text-xl font-bold text-blue-400">
                    {selectedChallenge === 'coffee' ? '$1,000' : selectedChallenge === 'meal' ? '$5,000' : '$0'}
                  </div>
                </div>
                
                {/* APR */}
                <div className="border-l border-slate-600/50 pl-8 text-center min-w-[100px]">
                  <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">연 이율</div>
                  <div className="text-xl font-bold text-yellow-400">
                    {selectedApr}%
                  </div>
                </div>
                
                {/* Accumulated Profit */}
                <div className="border-l border-slate-600/50 pl-8 text-center min-w-[140px]">
                  <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">누적 수익</div>
                  <div className="text-2xl font-bold text-green-400">
                    ${simState.accumulatedProfit.toFixed(2)}
                  </div>
                </div>
                
                {/* Harvestable Profit */}
                <div className="border-l border-slate-600/50 pl-8 text-center min-w-[140px]">
                  <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">수확가능</div>
                  <div className="text-2xl font-bold text-orange-400">
                    ${simState.harvestableProfit.toFixed(2)}
                  </div>
                </div>
                
                {/* Harvested Profit */}
                <div className="border-l border-slate-600/50 pl-8 text-center min-w-[140px]">
                  <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">수확한 수익</div>
                  <div className="text-2xl font-bold text-purple-400">
                    ${simState.harvestedProfit.toFixed(2)}
                  </div>
                </div>
                
                {/* Challenge Items Count */}
                {selectedChallenge && (
                  <div className="border-l border-slate-600/50 pl-8 text-center min-w-[120px]">
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-xl">
                        {selectedChallenge === 'coffee' ? '☕' : '🍜'}
                      </span>
                      <div className="text-xl font-bold text-orange-400">
                        {Math.floor(simState.accumulatedProfit / (selectedChallenge === 'coffee' ? 5 : 10))}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col space-y-3 ml-6">
                  <motion.button
                    onClick={() => {
                      console.log('Alert button clicked, current state:', alertsEnabled);
                      setAlertsEnabled(!alertsEnabled);
                    }}
                    className="flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300"
                    style={{
                      background: alertsEnabled ? '#2563eb' : '#374151',
                      color: 'white',
                      boxShadow: alertsEnabled ? '0 4px 15px rgba(37, 99, 235, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {alertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    <span>$5 모이면 알림</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={handleHarvest}
                    disabled={simState.harvestableProfit <= 0}
                    className="flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300"
                    style={{
                      background: simState.harvestableProfit > 0 ? '#16a34a' : '#4b5563',
                      color: 'white',
                      boxShadow: simState.harvestableProfit > 0 
                        ? '0 4px 15px rgba(22, 163, 74, 0.3)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}
                    whileHover={simState.harvestableProfit > 0 ? { scale: 1.05 } : {}}
                    whileTap={simState.harvestableProfit > 0 ? { scale: 0.95 } : {}}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>지금 수확</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => {
                      console.log('Auto rebalance button clicked, current state:', autoRebalanceEnabled);
                      setAutoRebalanceEnabled(!autoRebalanceEnabled);
                    }}
                    className="flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300"
                    style={{
                      background: autoRebalanceEnabled ? '#f59e0b' : '#374151',
                      color: 'white',
                      boxShadow: autoRebalanceEnabled ? '0 4px 15px rgba(245, 158, 11, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="relative inline-block">
                      <Settings className="w-4 h-4" />
                      {!autoRebalanceEnabled && (
                        <Slash 
                          className="absolute w-4 h-4 text-white pointer-events-none"
                          style={{
                            top: '0px',
                            left: '-1px',
                            filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))'
                          }}
                        />
                      )}
                    </div>
                    <span>자동 리밸런싱</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Fish Scene */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-2xl relative">
              {/* Price Control */}
              <PriceControl
                onSetRange={handleSetPriceRange}
                onResetToRandom={handleResetToRandom}
                currentRange={simulator.getCurrentRange()}
                onStart={handleStart}
                onStop={handleStop}
                isRunning={isRunning}
                onIncrementPrice={handleIncrementPrice}
                onDecrementPrice={handleDecrementPrice}
                onStartDemo={handleStartDemoOld}
                onStopDemo={handleStopDemo}
                isDemoRunning={simulator.isDemoActive()}
              />
              
              {isInRange() ? (
                <FishScene state={simState} />
              ) : (
                <FishSceneOutOfRange 
                  state={simState} 
                  onRecast={handleRecast}
                  demoStatus={simulator.getDemoStatus()}
                />
              )}
            </div>
            
            {/* Time Widget - Bottom Left */}
            <div 
              style={{ 
                position: 'absolute', 
                bottom: '80px', 
                left: '16px', 
                zIndex: 40 
              }}
            >
              <TimeWidget 
                isRunning={isDemoActive} 
                timeUnit={currentTimeUnit}
                onTimeUnitChange={handleTimeUnitChange}
              />
            </div>
            
            {/* X-Axis Labels - Outside container */}
            <div className="flex justify-between px-4 mt-2">
              {Array.from({ length: 11 }, (_, i) => {
                const price = 100 + (i * 10);
                const xPosition = ((price - 100) / (200 - 100)) * 90 + 5;
                return (
                  <div
                    key={i}
                    className="text-center"
                    style={{
                      position: 'absolute',
                      left: `${xPosition}%`,
                      transform: 'translateX(-50%)',
                      color: '#e2e8f0',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      padding: '4px 6px',
                      borderRadius: '6px',
                      border: '1px solid rgba(148, 163, 184, 0.3)'
                    }}
                  >
                    ${price}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-800/50" style={{ marginTop: '100px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              {COPY.howItWorks.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {COPY.howItWorks.steps.map((step, index) => (
              <motion.div
                key={index}
                className="bg-slate-900 rounded-2xl p-8 border border-slate-700 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-6">
                  {index + 1}
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {step}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-slate-500 text-sm">
              {COPY.howItWorks.disclaimer}
            </p>
          </div>
        </div>
      </section>

      <div style={{ marginTop: '100px' }}>
        <Footer />
      </div>

      {/* Recast Dialog */}
      <RecastDialog
        isOpen={isRecastDialogOpen}
        onClose={() => setIsRecastDialogOpen(false)}
        onConfirm={handleRecast}
      />

      {/* Harvest Dialog */}
      <HarvestDialog
        isOpen={isHarvestDialogOpen}
        onClose={() => setIsHarvestDialogOpen(false)}
        onConfirm={handleHarvestConfirm}
        onCancel={handleHarvestCancel}
      />
    </div>
  );
}