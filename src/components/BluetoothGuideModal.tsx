import React, { useState } from 'react';
import {
  X,
  Bluetooth,
  Wifi,
  Smartphone,
  Laptop,
  Headphones,
  CheckCircle2,
  ExternalLink,
  Volume2,
  Radio,
  Sliders,
  SunMedium
} from 'lucide-react';
import { Language, translations } from '../services/i18n';

interface BluetoothGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const BluetoothGuideModal: React.FC<BluetoothGuideModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'hub' | 'windows' | 'webbluetooth'>('hub');
  const t = translations[lang];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Bluetooth className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {lang === 'uz' ? 'Bluetooth & Wi-Fi Ovoz Qo\'llanmasi' : 'Bluetooth & Wi-Fi Audio Guide'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'uz' ? 'PC dan telefonga va quloqchinga ovoz chiqarish usullari' : 'How to route PC YouTube audio to phone & Bluetooth'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('hub')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'hub'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-4 h-4" />
            {lang === 'uz' ? '1. SoundSync Usuli (Tavsiya etiladi)' : '1. SoundSync Hub (Recommended)'}
          </button>

          <button
            onClick={() => setActiveTab('windows')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'windows'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            {lang === 'uz' ? '2. Windows Bluetooth Audio' : '2. Windows Bluetooth Audio'}
          </button>

          <button
            onClick={() => setActiveTab('webbluetooth')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'webbluetooth'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            {lang === 'uz' ? '3. Web Bluetooth API' : '3. Web Bluetooth API'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {activeTab === 'hub' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-cyan-300 mb-1">
                    {lang === 'uz'
                      ? 'Eng qulay va tezkor yechim (Wi-Fi + Bluetooth)'
                      : 'Fastest & Easiest Setup (Wi-Fi + Bluetooth)'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {lang === 'uz'
                      ? 'Kompyuter va telefoningiz bitta Wi-Fi routerga ulangan bo\'lsa, kompyuterdagi YouTube ovozi ushbu ilova orqali telefonga oqib keladi. Telefoningizga esa oddiy Bluetooth quloqchin ulangan bo\'lsa, tovush bevosita quloqchinda yangraydi!'
                      : 'Connect PC and Phone to the same Wi-Fi. The PC streams YouTube audio to your phone via this app, and your phone sends it straight to your connected Bluetooth headphones!'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">
                      {lang === 'uz' ? 'Quloqchinni telefonga ulang' : 'Connect earbuds to your phone'}
                    </strong>
                    <span className="text-xs text-slate-400">
                      {lang === 'uz'
                        ? 'Telefon sozlamalari (Settings -> Bluetooth) orqali AirPods, Galaxy Buds yoki boshqa Bluetooth dinamikni ulang.'
                        : 'Go to Phone Settings -> Bluetooth and pair your Bluetooth earphones or speaker.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">
                      {lang === 'uz' ? 'Bitta Wi-Fi ga ulaning va QR kodni skanerlang' : 'Connect to same Wi-Fi & Scan QR'}
                    </strong>
                    <span className="text-xs text-slate-400">
                      {lang === 'uz'
                        ? 'Telefon kamerasi bilan kompyuter ekranidagi QR kodni skanerlang yoki PIN kodni kiriting.'
                        : 'Scan the QR code on your PC screen with your phone camera or type the 4-digit PIN.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">
                      {lang === 'uz' ? 'Kompyuterda "Ovozni Telefonga Uzatish" tugmasini bosing' : 'Click "Stream Audio to Phone" on PC'}
                    </strong>
                    <span className="text-xs text-slate-400">
                      {lang === 'uz'
                        ? 'Chiquvchi oynada YouTube qo\'shig\'i ochilgan brauzer sahifasini (Chrome Tab) tanlang va "Ovozni ulashish" (Share Audio) ni belgilang.'
                        : 'Select the YouTube browser tab in the prompt and ensure "Share Audio" checkbox is ticked.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">
                      {lang === 'uz' ? 'Ekran o\'chmaydi + Tovush pulti' : 'Screen Stays Awake + Remote Control'}
                    </strong>
                    <span className="text-xs text-slate-400">
                      {lang === 'uz'
                        ? '"Ekran o\'chmasin" (Wake Lock) avtomatik yoqiladi — telefoningiz uyqu rejimiga o\'tmaydi. Telefonda ovoz balandligini 150% gacha boshqaring!'
                        : '"Screen Keep-Awake" is automatically active so your screen stays on without sleeping. Control volume up to 150% directly from your phone!'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'windows' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-cyan-400" />
                  Windows 10/11 "Bluetooth Audio Receiver"
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {lang === 'uz'
                    ? 'Agar telefoningizni to\'g\'ridan-to\'g\'ri kompyuterga Bluetooth orqali ulab, telefondagi musiqani kompyuter karnaylariga yoki aksincha chiqarmoqchi bo\'lsangiz, Microsoft rasmiy dasturi mavjud:'
                    : 'To pair your phone directly to Windows via Bluetooth as an A2DP audio sink, use the official Microsoft Store tool:'}
                </p>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-400">
                  <li>
                    {lang === 'uz'
                      ? 'Windows sozlamalarida (Settings -> Bluetooth) telefoningizni PC ga ulang.'
                      : 'Go to Windows Settings -> Bluetooth & devices -> Add device and pair your phone.'}
                  </li>
                  <li>
                    {lang === 'uz'
                      ? 'Microsoft Store dan bepul "Bluetooth Audio Receiver" dasturini o\'rnating.'
                      : 'Install the free "Bluetooth Audio Receiver" app from the Microsoft Store.'}
                  </li>
                  <li>
                    {lang === 'uz'
                      ? 'Dasturni ochib, ulangan telefonni tanlang va "Open Connection" tugmasini bosing.'
                      : 'Open the app, select your paired phone, and click "Open Connection".'}
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'webbluetooth' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  Web Bluetooth API
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {lang === 'uz'
                    ? 'Brauzer orqali to\'g\'ridan-to\'g\'ri Bluetooth qurilmalarini qidirish Chrome va Edge brauzerlarida ishlaydi (Android va Windows/Mac/Linux).'
                    : 'Direct browser Bluetooth device pairing is supported on Chrome and Edge for Android and Desktop.'}
                </p>
                <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg text-xs text-cyan-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
                  {lang === 'uz'
                    ? 'Ilovadagi "Bluetooth Quloqchinni ulash" tugmasini bosib, yaqin-atrofdagi Bluetooth qurilmalarni qidirishingiz mumkin.'
                    : 'You can click "Pair Bluetooth Device" in the app header to trigger native Bluetooth pairing.'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <SunMedium className="w-4 h-4 text-amber-400" />
            <span>
              {lang === 'uz' ? 'Ekran doim faol (O\'chmasin)' : 'Screen Keep Awake Enabled'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-xs hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20"
          >
            {lang === 'uz' ? 'Tushundim' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
