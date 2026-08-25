import React from 'react';
import { ViewType } from '../../types';

interface SideNavBarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onNewScan: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  currentView,
  onNavigate,
  onNewScan,
  mobileOpen,
  setMobileOpen,
}) => {
  const navItems = [
    { id: 'dashboard' as ViewType, label: '대시보드', icon: 'dashboard' },
    { id: 'upload' as ViewType, label: '새 점검', icon: 'add_moderator' },
    { id: 'history' as ViewType, label: '점검 기록', icon: 'history' },
    { id: 'guide' as ViewType, label: '보안 가이드', icon: 'menu_book' },
  ];

  const handleNav = (view: ViewType) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  const isNavActive = (id: ViewType) => {
    if (id === 'dashboard') return currentView === 'dashboard' || currentView === 'detail' || currentView === 'compare';
    if (id === 'upload') return currentView === 'upload' || currentView === 'scanning';
    return currentView === id;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div 
            className="p-5 border-b border-slate-100 cursor-pointer select-none"
            onClick={() => handleNav('dashboard')}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <span className="material-symbols-outlined text-[20px]">shield</span>
              </div>
              <div>
                <h1 className="font-bold text-[18px] text-slate-900 leading-tight tracking-tight">
                  VibeGuard
                </h1>
                <p className="text-[12px] font-normal text-slate-500">
                  AI Security Platform
                </p>
              </div>
            </div>
          </div>

          {/* Scan CTA Button */}
          <div className="p-4">
            <button
              onClick={() => {
                onNewScan();
                setMobileOpen(false);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium py-2.5 px-4 rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>신규 프로젝트 점검</span>
            </button>
          </div>

          {/* Main Nav Tabs */}
          <div className="px-3 py-1 space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Navigation
            </div>
            {navItems.map((item) => {
              const active = isNavActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] transition-colors cursor-pointer ${
                    active
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-normal'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[19px] ${
                    active ? 'text-blue-600' : 'text-slate-400'
                  }`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Tabs */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-1">
          <button
            onClick={() => {
              alert('VibeGuard 보안 설정: API Key 자동 마스킹 및 실시간 감사 규칙이 활성화되어 있습니다.');
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-[13px] font-normal text-left cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-400">settings</span>
            <span>보안 정책 설정</span>
          </button>
          <button
            onClick={() => {
              window.open('https://github.com', '_blank');
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-[13px] font-normal text-left cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-400">help_outline</span>
            <span>문서 및 지원</span>
          </button>
        </div>
      </aside>
    </>
  );
};
