import React from 'react';
import {
  Radio,
  Laptop,
  Smartphone,
  Globe,
  Bluetooth,
  SunMedium,
  Wifi,
  HelpCircle
} from 'lucide-react';
import { UserRole } from '../types';
import { Language, translations } from '../services/i18n';

interface NavbarProps {
  currentRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  roomId: string;
  isConnected: boolean;
  lang: Language;
  onToggleLang: () => void;
  wakeLockActive: boolean;
  onOpenBluetoothGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSwitchRole,
  roomId,
  isConnected,
  lang,
  onToggleLang,
  wakeLockActive,
  onOpenBluetoothGuide,
}) => {
  const t = translations[lang];

  return (
    <header className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 sm:px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20 text-slate-950">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                {t.appTitle}
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Wi-Fi + BT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Center: Device Role Switcher */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => onSwitchRole('host')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentRole === 'host'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'uz' ? 'PC (Host)' : 'PC (Host)'}</span>
            <span className="sm:hidden">PC</span>
          </button>

          <button
            onClick={() => onSwitchRole('client')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentRole === 'client'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'uz' ? 'Telefon (Pult)' : 'Phone (Remote)'}</span>
            <span className="sm:hidden">Phone</span>
          </button>
        </div>

        {/* Right: Status Pill & Language */}
        <div className="flex items-center gap-2">
          {/* Room PIN badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-400 font-mono">PIN:</span>
            <span className="font-bold text-cyan-300 font-mono">{roomId}</span>
          </div>

          {/* Screen Keep Awake Indicator */}
          {wakeLockActive && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold"
              title="Ekran o'chmasin"
            >
              <SunMedium className="w-3.5 h-3.5 animate-spin-slow" />
              <span className="hidden lg:inline">{t.screenAwake}</span>
            </div>
          )}

          {/* Bluetooth Guide */}
          <button
            onClick={onOpenBluetoothGuide}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Bluetooth Qo'llanma"
          >
            <Bluetooth className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{lang.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
