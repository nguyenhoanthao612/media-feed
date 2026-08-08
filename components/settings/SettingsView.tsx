'use client';

import React from 'react';
import { RotateCw, Volume2, VolumeX, Trash2, Database, Info, Sparkles, Check } from 'lucide-react';

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
  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-6 space-y-6 text-zinc-100 pb-24">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
          <span>Cài đặt & Tùy chọn</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Tùy chỉnh trải nghiệm xem/nghe media cá nhân của bạn</p>
      </div>

      <div className="space-y-4">
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
                <p className="text-[11px] text-zinc-400 mt-0.5">Tự động chuyển và phát media tiếp theo trong feed khi nội dung hiện tại kết thúc.</p>
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

        {/* STORAGE & DATABASE STATS CARD */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span>Lưu trữ & Dữ liệu (IndexedDB)</span>
          </h3>

          <div className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-zinc-300">
              <span>Tổng số nội dung trong thư viện:</span>
              <span className="font-mono font-bold text-indigo-400">{mediaCount} items</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Phương thức lưu trữ:</span>
              <span className="font-mono text-emerald-400">IndexedDB Persistent Store</span>
            </div>
            <p className="text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/80">
              ✔ Tất cả các tệp video, âm thanh và ảnh tải lên được lưu trực tiếp bền vững trong trình duyệt của bạn. Dữ liệu sẽ KHÔNG bị mất khi tải lại trang!
            </p>
          </div>
        </div>

        {/* APP INFO CARD */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Info className="w-4 h-4 text-indigo-400" />
            <span>My Media Feed v1.0</span>
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Ứng dụng lưu trữ và thưởng thức nội dung cá nhân gồm Video, Audio, Hình ảnh và Ảnh kèm Âm thanh với giao diện Vertical Scrolling Feed hiện đại, hỗ trợ tự động chuyển bài liên tục.
          </p>
        </div>
      </div>
    </div>
  );
}
