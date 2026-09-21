"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Loader2, Headphones, Clock } from "lucide-react";

interface VoicePlayerProps {
  assignmentId: string;
}

interface SavedVoice {
  data: string;
  mimeType: string;
  duration: number;
  updatedAt: string;
}

export default function VoicePlayer({ assignmentId }: VoicePlayerProps) {
  const [voice, setVoice] = useState<SavedVoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/assignments/${assignmentId}/voice`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: { voice: SavedVoice | null } | null) => {
        if (cancelled) return;
        if (d?.voice) setVoice(d.voice);
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [assignmentId]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }

  function formatTime(s: number) {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-[#1e5eb8] animate-spin" />
        <p className="text-xs font-black text-gray-500">جاري تحميل الملاحظة الصوتية...</p>
      </div>
    );
  }

  if (!voice) return null;

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl border-2 border-[#1e5eb8]/20 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-l from-[#1e5eb8] via-[#2b6fc9] to-[#1e5eb8]" />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1e5eb8] flex items-center justify-center shadow-sm">
              <Headphones className="w-4.5 h-4.5 text-white" strokeWidth={2.5} style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <p className="text-sm font-black text-[#1e5eb8] leading-tight">
                ملاحظة صوتية من أستاذ المادة
              </p>
              <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                متطلبات البحث مباشرة من الدكتور
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-50 border border-[#1e5eb8]/20 rounded-lg px-2.5 py-1">
            <Clock className="w-3 h-3 text-[#1e5eb8]" />
            <span className="text-[11px] font-mono font-black text-[#1e5eb8]">
              {formatTime(voice.duration)}
            </span>
          </div>
        </div>

        {/* Player Row */}
        <div className="flex items-center gap-3">
          {/* Play button */}
          <button
            onClick={togglePlay}
            className="group relative w-12 h-12 rounded-full bg-[#1e5eb8] hover:bg-[#1650a0] flex items-center justify-center shadow-md hover:shadow-lg transition-all flex-shrink-0 active:scale-95"
            aria-label={isPlaying ? "إيقاف" : "تشغيل"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" strokeWidth={2.5} fill="currentColor" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" strokeWidth={2.5} fill="currentColor" />
            )}
            {!isPlaying && (
              <span className="absolute inset-0 rounded-full bg-[#1e5eb8] animate-ping opacity-20" />
            )}
          </button>

          {/* Progress */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[10px] font-mono font-black mb-1.5">
              <span className="text-[#1e5eb8]">{formatTime(currentTime)}</span>
              <span className="text-gray-400">{formatTime(audioDuration || voice.duration)}</span>
            </div>

            {/* Bar */}
            <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 right-0 bg-gradient-to-l from-[#1e5eb8] to-[#2b6fc9] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Mini waveform */}
            <div className="flex items-center justify-between mt-1.5 gap-0.5">
              {Array.from({ length: 60 }).map((_, i) => {
                const reached = (i / 60) * 100 <= progress;
                const height = 3 + Math.abs(Math.sin(i * 0.5)) * 4;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-200 ${
                      reached ? "bg-[#1e5eb8]" : "bg-gray-200"
                    }`}
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-black text-gray-600">
              متاح دائماً — اسمعه في أي وقت
            </p>
          </div>
          <p className="text-[9px] font-mono font-bold text-gray-400">
            {new Date(voice.updatedAt).toLocaleDateString("ar-EG")}
          </p>
        </div>

        <audio
          ref={audioRef}
          src={`data:${voice.mimeType};base64,${voice.data}`}
          onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
          onLoadedMetadata={(e) => setAudioDuration((e.target as HTMLAudioElement).duration)}
          onEnded={() => { setIsPlaying(false); setCurrentTime(0); }}
        />
      </div>
    </div>
  );
}
