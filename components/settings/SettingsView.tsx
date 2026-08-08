'use client';

import React, { useState, useEffect } from 'react';
import { useMedia } from '@/context/MediaContext';
import {
  GOOGLE_APPS_SCRIPT_CODE,
  getStoredSheetsWebAppUrl,
  setStoredSheetsWebAppUrl,
  resetToDefaultSheetsWebAppUrl,
  isUsingCustomSheetsUrl,
  DEFAULT_GOOGLE_APPS_SCRIPT_URL,
  getStoredAutoSync,
  setStoredAutoSync,
  testSheetsConnection,
} from '@/lib/google-sheets';
import { 
  RotateCw, Volume2, VolumeX, Database, Info, Sparkles, Check, 
  Copy, ExternalLink, RefreshCw, Server, ShieldCheck, AlertCircle, Code2, ChevronDown, ChevronUp
} from 'lucide-react';

interface SettingsViewProps {
  continuousPlay: boolean;
  isMuted: boolean;
  onToggleContinuousPlay: () => void;
  onToggleMute: () => void;
  mediaCount: number;
}

export function SettingsView({
  continuousPlay,
  isMuted,
  onToggleContinuousPlay,
  onToggleMute,
  mediaCount,
}: SettingsViewProps) {
  const { isSheetsSyncing, lastSheetsSyncTime, handleManualSheetsSync } = useMedia();

  const [webAppUrl, setWebAppUrl] = useState(() => getStoredSheetsWebAppUrl());
  const [autoSync, setAutoSync] = useState(() => getStoredAutoSync());
  const [isCopied, setIsCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [manualSyncStatus, setManualSyncStatus] = useState<string | null>(null);

  const handleSaveUrl = async () => {
    setStoredSheetsWebAppUrl(webAppUrl);
    setTestResult(null);
    if (webAppUrl.trim()) {
      setIsTesting(true);
      const res = await testSheetsConnection(webAppUrl.trim());
      setTestResult(res);
      setIsTesting(false);
    }
  };

  const handleResetDefaultUrl = () => {
    const defaultUrl = resetToDefaultSheetsWebAppUrl();
    setWebAppUrl(defaultUrl);
    setTestResult({ success: true, message: 'Đã khôi phục về URL Google Apps Script mặc định của hệ thống!' });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleToggleAutoSync = () => {
    const nextVal = !autoSync;
    setAutoSync(nextVal);
    setStoredAutoSync(nextVal);
  };

  const handleRunManualSync = async () => {
    if (!webAppUrl.trim()) {
      setManualSyncStatus('Vui lòng nhập và lưu URL Google Apps Script Web App trước!');
      return;
    }
    setManualSyncStatus('Đang đồng bộ dữ liệu với Google Sheets...');
    const ok = await handleManualSheetsSync();
    if (ok) {
      setManualSyncStatus('✔ Đồng bộ thành công 2 chiều với Google Sheets!');
    } else {
      setManualSyncStatus('❌ Lỗi đồng bộ. Hãy kiểm tra URL Apps Script của bạn.');
    }
    setTimeout(() => setManualSyncStatus(null), 4000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-6 space-y-6 text-zinc-100 pb-24">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
          <span>Cài đặt & Cơ sở dữ liệu</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Quản lý phát nhạc/video và kết nối Cơ sở dữ liệu Google Sheets + Google Apps Script
        </p>
      </div>

      <div className="space-y-5">
        {/* GOOGLE SHEETS & APPS SCRIPT DATABASE INTEGRATION CARD */}
        <div className="p-5 bg-zinc-900 border border-emerald-500/30 rounded-2xl space-y-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/10 border-b border-l border-emerald-500/20 text-[10px] font-semibold text-emerald-400 rounded-bl-xl">
            Google Sheets DB Cloud
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Cơ sở dữ liệu Google Sheets & Apps Script</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Đồng bộ và lưu trữ toàn bộ thư viện video, audio, ảnh trực tiếp trên Google Sheets miễn phí không giới hạn.
              </p>
            </div>
          </div>

          {/* WEB APP URL INPUT */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="block text-xs font-semibold text-zinc-300">
                1. URL Ứng dụng Web (Google Apps Script Web App URL)
              </label>
              <div className="flex items-center space-x-2">
                {isUsingCustomSheetsUrl() ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    URL tùy chỉnh cá nhân
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    URL hệ thống mặc định (Gán cứng)
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                onClick={handleSaveUrl}
                disabled={isTesting}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5 shrink-0"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>{isTesting ? 'Đang thử...' : 'Lưu URL'}</span>
              </button>
            </div>

            {isUsingCustomSheetsUrl() && (
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={handleResetDefaultUrl}
                  className="text-[11px] text-zinc-400 hover:text-emerald-400 underline transition-colors"
                >
                  ↩ Khôi phục về URL Google Apps Script mặc định của hệ thống
                </button>
              </div>
            )}

            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* SYNC CONTROLS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">Tự động đồng bộ</h4>
                <p className="text-[10px] text-zinc-400">Tự lưu khi thêm/sửa/xóa media</p>
              </div>
              <button
                onClick={handleToggleAutoSync}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  autoSync ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {autoSync ? 'Đang BẬT' : 'TẮT'}
              </button>
            </div>

            <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">Đồng bộ thủ công</h4>
                <p className="text-[10px] text-zinc-400">
                  {lastSheetsSyncTime ? `Lần cuối: ${lastSheetsSyncTime}` : 'Chưa đồng bộ'}
                </p>
              </div>
              <button
                onClick={handleRunManualSync}
                disabled={isSheetsSyncing}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center space-x-1.5 active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSheetsSyncing ? 'animate-spin' : ''}`} />
                <span>{isSheetsSyncing ? 'Đang tải...' : 'Đồng bộ ngay'}</span>
              </button>
            </div>
          </div>

          {manualSyncStatus && (
            <p className="text-xs text-center font-medium text-indigo-300 animate-pulse">
              {manualSyncStatus}
            </p>
          )}

          {/* APPS SCRIPT CODE GENERATOR & GUIDANCE */}
          <div className="p-4 bg-zinc-950 border border-zinc-800/90 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 flex items-center space-x-1.5">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>2. Mã nguồn Google Apps Script (Code.gs)</span>
              </span>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center space-x-1 shadow-md shadow-emerald-600/20 active:scale-95"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Đã sao chép!' : 'Sao chép Code'}</span>
              </button>
            </div>

            {/* Step-by-step instructions */}
            <div className="space-y-1.5 text-[11px] text-zinc-400 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <p className="font-semibold text-zinc-200 text-xs mb-1">📌 Hướng dẫn tạo Database trên Google Sheets (3 phút):</p>
              <p>1️⃣ Truy cập <a href="https://sheets.google.com" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline inline-flex items-center">sheets.google.com <ExternalLink className="w-3 h-3 ml-0.5 inline" /></a> và tạo một Bảng tính mới (Blank Spreadsheet).</p>
              <p>2️⃣ Bấm chọn menu <span className="text-zinc-200 font-medium">Tiện ích mở rộng (Extensions)</span> → <span className="text-zinc-200 font-medium">Apps Script</span>.</p>
              <p>3️⃣ Bấm nút <span className="text-emerald-400 font-medium">&quot;Sao chép Code&quot;</span> ở trên, dán đè toàn bộ vào file <code className="text-indigo-300">Code.gs</code> trong Apps Script rồi bấm biểu tượng Đĩa tròn để Lưu (Save).</p>
              <p>4️⃣ Bấm <span className="text-zinc-200 font-medium">Triển khai (Deploy)</span> → <span className="text-zinc-200 font-medium">Triển khai mới (New deployment)</span>. Chọn loại biểu tượng bánh răng là <span className="text-zinc-200 font-medium">Ứng dụng web (Web app)</span>.</p>
              <p>5️⃣ Mục <span className="text-amber-300 font-medium">&quot;Ai có quyền truy cập&quot; (Who has access)</span>: Chọn <span className="text-amber-300 font-semibold">&quot;Bất kỳ ai&quot; (Anyone)</span>. Bấm Triển khai và sao chép URL dán vào ô số 1 ở trên!</p>
            </div>

            {/* Toggle View Apps Script Code */}
            <button
              onClick={() => setShowCode((prev) => !prev)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 pt-1 font-medium"
            >
              <span>{showCode ? 'Ẩn mã Google Apps Script' : 'Xem mã Google Apps Script (Code.gs)'}</span>
              {showCode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showCode && (
              <pre className="p-3 bg-zinc-900 text-emerald-300 rounded-lg text-[10px] font-mono overflow-x-auto max-h-60 border border-zinc-800">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            )}
          </div>
        </div>

        {/* PLAYER SETTINGS CARD */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Trình phát & Tự động phát (Playback Engine)</span>
          </h3>

          <div className="space-y-3 divide-y divide-zinc-800/80">
            {/* Continuous Play Setting */}
            <div className="pt-3 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-xs text-zinc-200">Chế độ Continuous Play (Phát liên tục)</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Tự động chuyển và phát media tiếp theo trong feed khi nội dung hiện tại kết thúc.
                </p>
              </div>
              <button
                onClick={onToggleContinuousPlay}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 border ${
                  continuousPlay
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 ${continuousPlay ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                <span>{continuousPlay ? 'Đang BẬT' : 'Đang TẮT'}</span>
              </button>
            </div>

            {/* Mute Setting */}
            <div className="pt-3 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-xs text-zinc-200">Chế độ Tắt âm mặc định (Mute)</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Tắt âm thanh toàn cục khi bắt đầu tự động phát để tránh gián đoạn.</p>
              </div>
              <button
                onClick={onToggleMute}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 border ${
                  isMuted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isMuted ? 'Muted' : 'Âm thanh On'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* LOCAL STORAGE STATS CARD */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span>Lưu trữ Cục bộ (Browser IndexedDB)</span>
          </h3>

          <div className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-zinc-300">
              <span>Tổng số nội dung trong ứng dụng:</span>
              <span className="font-mono font-bold text-indigo-400">{mediaCount} items</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Trạng thái bộ nhớ đệm:</span>
              <span className="font-mono text-emerald-400">IndexedDB Active</span>
            </div>
            <p className="text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/80">
              ✔ Trình duyệt luôn lưu dữ liệu tại máy cá nhân đồng thời tự động đồng bộ lên Google Sheets khi có kết nối!
            </p>
          </div>
        </div>

        {/* APP INFO CARD */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Info className="w-4 h-4 text-indigo-400" />
            <span>My Media Feed v1.1 - Cloud Sync Edition</span>
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Ứng dụng lưu trữ và thưởng thức nội dung cá nhân kết hợp lưu trữ siêu tốc IndexedDB local và cơ sở dữ liệu Google Sheets + Google Apps Script Cloud.
          </p>
        </div>
      </div>
    </div>
  );
}

