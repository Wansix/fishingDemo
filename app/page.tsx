'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Bell, BellOff, Settings, Slash } from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChallengeCards from '@/components/ChallengeCards';
import AprSelector from '@/components/AprSelector';
import FishScene from '@/components/FishScene';
import RecastDialog from '@/components/RecastDialog';
import HarvestDialog from '@/components/HarvestDialog';

import PriceControl from '@/components/PriceControl';
import TimeWidget from '@/components/TimeWidget';
import { PriceSimulator, PriceSimState } from '@/lib/priceSim';
import { COPY } from '@/lib/copy';

export default function Home() {
  const [simulator] = useState(() => new PriceSimulator());
  const [simState, setSimState] = useState<PriceSimState>(simulator.getState());
  const [selectedChallenge, setSelectedChallenge] = useState<'coffee' | 'meal' | null>('coffee');
  const [selectedApr, setSelectedApr] = useState<number>(200);
  const [isRecastDialogOpen, setIsRecastDialogOpen] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [alertAmount, setAlertAmount] = useState(5); // 알림 금액 설정 (기본 $5)
  const [isRunning, setIsRunning] = useState(false);
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [isHarvestDialogOpen, setIsHarvestDialogOpen] = useState(false);
  const [lastAlertAmount, setLastAlertAmount] = useState(0); // 마지막으로 알림을 보낸 금액
  const [autoRebalanceEnabled, setAutoRebalanceEnabled] = useState(false); // 자동 리밸런싱 설정
  const [compoundingEnabled, setCompoundingEnabled] = useState(false); // 복리 재투자 설정
  const [managementFeeRate, setManagementFeeRate] = useState(20); // 운영진 수수료율 (기본 20%)
  const [userCount, setUserCount] = useState(100); // 유저 수 (기본 100명)
  const [managementRevenue, setManagementRevenue] = useState(0); // 운영진 누적 수익
  const [isRebalanceToastOpen, setIsRebalanceToastOpen] = useState(false); // 리밸런싱 토스트 상태
  const [currentRebalanceToast, setCurrentRebalanceToast] = useState<HTMLElement | null>(null); // 현재 리밸런싱 토스트 요소
  const [isHarvestToastOpen, setIsHarvestToastOpen] = useState(false); // 수확 알림 토스트 상태
  const [currentHarvestToast, setCurrentHarvestToast] = useState<HTMLElement | null>(null); // 현재 수확 알림 토스트 요소
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
      // 토스트 정리
      if (toastRef.current && document.body.contains(toastRef.current)) {
        document.body.removeChild(toastRef.current);
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [simulator]);

  useEffect(() => {
    const currentAmount = Math.floor(simState.harvestableProfit / alertAmount) * alertAmount; // 설정한 금액의 배수로 계산
    
    if (alertsEnabled && currentAmount >= alertAmount && currentAmount > lastAlertAmount) {
      console.log('Triggering harvest toast for amount:', currentAmount);
      setLastAlertAmount(currentAmount);
      showHarvestToast();
    }
  }, [simState.harvestableProfit, alertsEnabled, alertAmount, lastAlertAmount]);

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

  // 토스트 재사용 및 메모리 누수 방지
  const toastRef = useRef<HTMLElement | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string) => {
    console.log('Showing toast:', message);
    
    // 기존 토스트가 있으면 재사용
    if (toastRef.current) {
      // 기존 타이머 취소
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      // 내용만 업데이트
      toastRef.current.textContent = message;
      toastRef.current.style.opacity = '1';
      toastRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
    } else {
      // 새 토스트 생성
      const toast = document.createElement('div');
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
      toastRef.current = toast;
    }
    
    // 3초 후 숨기기
    toastTimeoutRef.current = setTimeout(() => {
      if (toastRef.current) {
        toastRef.current.style.opacity = '0';
        toastRef.current.style.transform = 'translate(-50%, -50%) scale(0.8)';
      }
    }, 3000);
  };

  const showHarvestDialog = () => {
    setIsHarvestDialogOpen(true);
  };

  const showHarvestToast = () => {
    console.log('🔍 showHarvestToast 호출됨');
    console.log('isHarvestToastOpen:', isHarvestToastOpen);
    console.log('currentHarvestToast:', currentHarvestToast);
    
    // 기존 수확 알림 토스트가 열려있으면 즉시 제거
    if (isHarvestToastOpen && currentHarvestToast) {
      console.log('🗑️ 기존 토스트 즉시 제거 중...');
      if (document.body.contains(currentHarvestToast)) {
        document.body.removeChild(currentHarvestToast);
        console.log('✅ 기존 토스트 DOM에서 제거됨');
      }
      // 상태를 즉시 리셋
      setIsHarvestToastOpen(false);
      setCurrentHarvestToast(null);
    }
    
    console.log('🆕 새로운 토스트 생성 중...');
    setIsHarvestToastOpen(true);
    const toast = document.createElement('div');
    setCurrentHarvestToast(toast); // 토스트 요소를 상태에 저장
    
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
    
    const currentAmount = Math.floor(simState.harvestableProfit / alertAmount) * alertAmount;
    toast.innerHTML = `
      <div style="margin-bottom: 16px; font-size: 20px;">🎉 $${currentAmount} 수익 달성!</div>
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
        setIsHarvestToastOpen(false); // 토스트 상태 리셋
        setCurrentHarvestToast(null); // 토스트 요소 참조 리셋
      }, 300);
    };
    
    yesButton?.addEventListener('click', () => {
      const harvestAmount = simulator.harvestHarvestable();
      if (harvestAmount > 0) {
        // 운영진 수수료 계산
        const managementFee = harvestAmount * (managementFeeRate / 100);
        const userReceives = harvestAmount - managementFee;
        
        // 운영진 수익 누적
        setManagementRevenue(prev => prev + managementFee);
        
        if (compoundingEnabled) {
          // 복리 재투자: 사용자가 받는 금액(수수료 제외)을 예치금에 추가
          simulator.addToDeposit(userReceives);
          const newDepositAmount = simulator.getDepositAmount();
          showToast(`🔄 복리 재투자! $${userReceives.toFixed(2)}가 예치금에 추가되었습니다. (수수료 $${managementFee.toFixed(2)} 차감)`);
        } else {
          showToast(`☕ 수확 완료! $${userReceives.toFixed(2)}를 획득했습니다. (수수료 $${managementFee.toFixed(2)} 차감)`);
        }
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
    console.log('🔍 handleHarvest 호출됨');
    console.log('compoundingEnabled:', compoundingEnabled);
    
    const harvestAmount = simulator.harvestHarvestable();
    console.log('harvestAmount:', harvestAmount);
    
    if (harvestAmount > 0) {
      // 운영진 수수료 계산
      const managementFee = harvestAmount * (managementFeeRate / 100);
      const userReceives = harvestAmount - managementFee;
      
      console.log(`💰 수수료 계산: 총 ${harvestAmount.toFixed(2)}, 수수료 ${managementFee.toFixed(2)} (${managementFeeRate}%), 사용자 수령 ${userReceives.toFixed(2)}`);
      
      // 운영진 수익 누적
      setManagementRevenue(prev => prev + managementFee);
      
      if (compoundingEnabled) {
        console.log('🔄 복리 재투자 실행 중...');
        // 복리 재투자: 사용자가 받는 금액(수수료 제외)을 예치금에 추가
        const oldDepositAmount = simulator.getDepositAmount();
        console.log('기존 예치금:', oldDepositAmount);
        
        simulator.addToDeposit(userReceives);
        
        const newDepositAmount = simulator.getDepositAmount();
        console.log('새로운 예치금:', newDepositAmount);
        
        showToast(`🔄 복리 재투자! $${userReceives.toFixed(2)}가 예치금에 추가되었습니다. (수수료 $${managementFee.toFixed(2)} 차감) 새로운 예치금: $${newDepositAmount.toFixed(2)}`);
      } else {
        console.log('☕ 일반 수확 실행 중...');
        showToast(`☕ 수확 완료! $${userReceives.toFixed(2)}를 획득했습니다. (운영진 수수료 $${managementFee.toFixed(2)} 차감)`);
      }
      setLastAlertAmount(0); // 수확 후 알림 카운터 리셋
    } else {
      console.log('⚠️ 수확할 금액이 없음');
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

  // 수동 제어 시작/종료 핸들러
  const handleManualControlStart = () => {
    simulator.startManualControl();
  };

  const handleManualControlStop = () => {
    simulator.stopManualControl();
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
      <style dangerouslySetInnerHTML={{
        __html: `
          .alert-amount-input::placeholder {
            color: #94a3b8 !important;
            opacity: 1 !important;
          }
          .alert-amount-input::-webkit-input-placeholder {
            color: #94a3b8 !important;
            opacity: 1 !important;
          }
          .alert-amount-input::-moz-placeholder {
            color: #94a3b8 !important;
            opacity: 1 !important;
          }
          .alert-amount-input:-ms-input-placeholder {
            color: #94a3b8 !important;
            opacity: 1 !important;
          }
        `
      }} />
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

      {/* Management Settings */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              🏛️ 운영진 설정
            </motion.h2>
            <motion.p
              className="text-xl text-slate-300 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              플랫폼 운영진의 수수료와 사용자 규모를 설정하세요
            </motion.p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-6xl mx-auto">
            {/* Management Fee Rate Card */}
            <motion.div
              className="group relative overflow-hidden rounded-3xl border-2 border-orange-500/20 bg-gradient-to-br from-orange-900/20 to-orange-800/30 p-8 transition-all duration-300 hover:border-orange-400/40 hover:shadow-2xl hover:shadow-orange-500/20 cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/20 text-3xl group-hover:scale-110 transition-transform duration-300">
                    💰
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">수수료율</h3>
                    <p className="text-orange-200/80">수확 시 차감되는 운영진 수수료</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-orange-200">현재 수수료율</span>
                    <span className="text-4xl font-bold text-orange-400">{managementFeeRate}%</span>
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={managementFeeRate}
                      onChange={(e) => setManagementFeeRate(parseInt(e.target.value))}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #f97316 0%, #f97316 ${managementFeeRate * 2}%, #374151 ${managementFeeRate * 2}%, #374151 100%)`
                      }}
                    />
                    <div className="flex justify-between text-sm text-orange-300/60">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* User Count Card */}
            <motion.div
              className="group relative overflow-hidden rounded-3xl border-2 border-blue-500/20 bg-gradient-to-br from-blue-900/20 to-blue-800/30 p-8 transition-all duration-300 hover:border-blue-400/40 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20 text-3xl group-hover:scale-110 transition-transform duration-300">
                    👥
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">사용자 수</h3>
                    <p className="text-blue-200/80">플랫폼의 총 사용자 수</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200">총 사용자</span>
                    <span className="text-4xl font-bold text-blue-400">{userCount.toLocaleString()}명</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-blue-300 min-w-fit">사용자 수:</span>
                    <input
                      type="number"
                      value={userCount}
                      onChange={(e) => setUserCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 px-4 py-3 rounded-xl bg-blue-900/40 text-white text-lg font-medium border border-blue-600/30 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all duration-200"
                      min="1"
                      step="1"
                      placeholder="100"
                      style={{
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.1)',
                        color: '#ffffff'
                      }}
                    />
                    <span className="text-sm text-blue-300 min-w-fit">명</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

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
          <div className="mb-8 flex justify-center">
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
                    ${simulator.getDepositAmount().toFixed(2)}
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
                
                {/* Management Revenue (Total Platform Revenue) */}
                <div className="border-l border-slate-600/50 pl-8 text-center min-w-[140px]">
                  <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">운영진 수익</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    ${(managementRevenue * userCount).toFixed(2)}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-3 ml-6">
                  <div className="flex items-center space-x-2">
                    <motion.button
                      onClick={() => {
                        console.log('Alert button clicked, current state:', alertsEnabled);
                        setAlertsEnabled(!alertsEnabled);
                      }}
                      className="flex items-center space-x-2 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300"
                      style={{
                        background: alertsEnabled ? '#2563eb' : '#374151',
                        color: 'white',
                        boxShadow: alertsEnabled ? '0 4px 15px rgba(37, 99, 235, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.2)'
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {alertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    </motion.button>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-slate-300">$</span>
                        <input
                          type="number"
                          value={alertAmount}
                          onChange={(e) => setAlertAmount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="alert-amount-input w-16 px-3 py-2 rounded-lg text-sm font-medium border border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all duration-200 hover:border-slate-500"
                          min="1"
                          step="1"
                          placeholder="5"
                          style={{
                            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.1)',
                            color: '#ffffff !important',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        />
                      </div>
                      <span className="text-sm text-slate-300 font-medium whitespace-nowrap">모이면 알림</span>
                    </div>
                  </div>
                  
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
                  
                  <motion.button
                    onClick={() => {
                      console.log('Compound reinvest button clicked, current state:', compoundingEnabled);
                      setCompoundingEnabled(!compoundingEnabled);
                    }}
                    className="flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300"
                    style={{
                      background: compoundingEnabled ? '#7c3aed' : '#374151',
                      color: 'white',
                      boxShadow: compoundingEnabled ? '0 4px 15px rgba(124, 58, 237, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-xl">🔄</span>
                    <span>수확시 재투자(복리)</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Fish Scene */}
          <div className="flex space-x-8">
                      {/* Left Column - Price & Simulation Info */}
          <div className="w-80 space-y-6">
            {/* Current SOL Price */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-300 mb-4">현재 SOL 가격</h3>
              <div className="text-4xl font-bold text-blue-400 mb-2">
                ${simState.price.toFixed(2)}
              </div>
              <div className="text-sm text-slate-400">
                그물 범위: ${simulator.getNetRange().lower.toFixed(2)} ~ ${simulator.getNetRange().upper.toFixed(2)}
              </div>
            </div>

            {/* Simulation Time - 실제 동작하는 TimeWidget */}
            <TimeWidget 
              isRunning={isDemoActive} 
              timeUnit={currentTimeUnit}
              onTimeUnitChange={handleTimeUnitChange}
            />
          </div>

            {/* Right Column - Game Screen */}
            <div className="flex-1">
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
                    onManualControlStart={handleManualControlStart}
                    onManualControlStop={handleManualControlStop}
                  />
                  
                  <FishScene 
                    state={simState} 
                    onRecast={handleRecast}
                    demoStatus={simulator.getDemoStatus()}
                    simulator={simulator}
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
