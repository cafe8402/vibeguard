import React, { useState } from 'react';
import { ViewType } from '../../types';

interface TopNavBarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onTriggerLiveScan: () => void;
  onOpenMobileMenu: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentView,
  onNavigate,
  onTriggerLiveScan,
  onOpenMobileMenu,
  searchQuery,
  setSearchQuery,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isDashboardOrCompare = currentView === 'dashboard' || currentView === 'compare' || currentView === 'detail';

  return (
    <header className="sticky top-0 right-0 z-30 flex justify-between items-center px-4 sm:px-8 py-3.5 bg-white border-b border-slate-200">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          aria-label="Toggle navigation"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        <div 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <span className="material-symbols-outlined text-[18px]">security</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="font-semibold text-[17px] sm:text-[18px] text-slate-900 tracking-tight">
              VibeGuard
            </h2>
            <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Enterprise v2.4
            </span>
          </div>
        </div>

        {/* Sub Navigation Tabs for Overview / Compare */}
        {isDashboardOrCompare && (
          <div className="hidden lg:flex items-center gap-1 ml-6 border-l border-slate-200 pl-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`text-[13px] font-medium transition-all px-3 py-1.5 rounded-md cursor-pointer ${
                currentView === 'dashboard' || currentView === 'detail'
                  ? 'text-blue-600 bg-blue-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onNavigate('compare')}
              className={`text-[13px] font-medium transition-all px-3 py-1.5 rounded-md cursor-pointer ${
                currentView === 'compare'
                  ? 'text-blue-600 bg-blue-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Compare
            </button>
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vulnerabilities..."
            className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48 lg:w-64 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all cursor-pointer relative"
            aria-label="알림"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100 px-1">
                <span className="text-[12px] font-semibold text-slate-900">Notifications</span>
                <span className="text-[11px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  2 New
                </span>
              </div>
              <div className="space-y-1.5 text-[13px]">
                <div 
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('detail');
                  }}
                  className="p-2.5 rounded-lg bg-red-50/50 hover:bg-red-50 border border-red-100 transition-colors cursor-pointer flex gap-2.5 items-start"
                >
                  <span className="material-symbols-outlined text-red-600 text-[18px] shrink-0 mt-0.5">error</span>
                  <div>
                    <p className="font-semibold text-red-900 text-[12px]">Critical Vulnerability Detected</p>
                    <p className="text-slate-600 text-[12px] mt-0.5">src/admin.js: Hardcoded credentials</p>
                  </div>
                </div>
                <div 
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('compare');
                  }}
                  className="p-2.5 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 transition-colors cursor-pointer flex gap-2.5 items-start"
                >
                  <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 mt-0.5">verified</span>
                  <div>
                    <p className="font-semibold text-emerald-900 text-[12px]">Re-scan Score: +36 Pts</p>
                    <p className="text-slate-600 text-[12px] mt-0.5">SQL Injection remediated</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Account */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-2"
            aria-label="사용자 프로필"
          >
            <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[11px] font-semibold">
              AG
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="font-semibold text-[13px] text-slate-900">Security Auditor</p>
                <p className="text-[11px] text-slate-500">auditor@vibeguard.io</p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onNavigate('history');
                }}
                className="w-full text-left px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px] text-slate-400">history</span>
                점검 히스토리
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onNavigate('guide');
                }}
                className="w-full text-left px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px] text-slate-400">menu_book</span>
                보안 감사 가이드
              </button>
            </div>
          )}
        </div>

        {/* Live Scan Header Action Button */}
        <button
          onClick={onTriggerLiveScan}
          className="bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-medium px-3.5 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-98"
        >
          <span className="material-symbols-outlined text-[16px]">play_arrow</span>
          <span className="hidden sm:inline">실시간 점검 시작</span>
          <span className="sm:hidden">점검</span>
        </button>
      </div>
    </header>
  );
};
