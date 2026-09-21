"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, Send, Loader2, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";

interface VoiceRecorderProps {
  assignmentId: string;
}

interface SavedVoice {
  data: string;
  mimeType: string;
  duration: number;
  updatedAt: string;
}

export default function VoiceRecorder({ assignmentId }: VoiceRecorderProps) {
  const [saved, setSaved] = useState<SavedVoice | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewTime, setPreviewTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/assignments/${assignmentId}/voice`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: { voice: SavedVoice | null } | null) => {
        if (cancelled) return;
        if (d?.voice) setSaved(d.voice);
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [assignmentId]);

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recording]);

  async function startRecording() {
    setError(""); setSuccess("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);
    } catch {
      setError("تعذر الوصول للمايكروفون. تأكد من الأذونات.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  function resetRecording() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingTime(0);
    setPreviewTime(0);
    setPreviewDuration(0);
    setIsPreviewPlaying(false);
  }

  function togglePreview() {
    if (!previewAudioRef.current) return;
    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      previewAudioRef.current.play();
      setIsPreviewPlaying(true);
    }
  }

  async function saveRecording() {
    if (!recordedBlob) return;
    setSaving(true); setError("");
    try {
      const base64 = await blobToBase64(recordedBlob);
      const res = await fetch(`/api/assignments/${assignmentId}/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: base64,
          mimeType: recordedBlob.type || "audio/webm",
          duration: recordingTime,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) { setError(data.error || "تعذر الحفظ"); return; }
      setSaved({
        data: base64,
        mimeType: recordedBlob.type || "audio/webm",
        duration: recordingTime,
        updatedAt: new Date().toISOString(),
      });
      setSuccess("تم إرسال التسجيل — الطلاب هيشوفوه فوراً");
      resetRecording();
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSaved() {
    if (!confirm("هل أنت متأكد من حذف التسجيل؟ الطلاب مش هيسمعوه بعد كده.")) return;
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/voice`, { method: "DELETE" });
      if (res.ok) {
        setSaved(null);
        setSuccess("تم حذف التسجيل");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("تعذر الحذف");
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-[#1e5eb8] animate-spin" />
        <p className="text-xs font-black text-gray-500">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-[#1e5eb8]/20 shadow-sm overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-l from-[#1e5eb8] via-[#2b6fc9] to-[#1e5eb8]" />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1e5eb8] flex items-center justify-center shadow-sm">
              <Mic className="text-white" strokeWidth={2.5} style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <p className="text-sm font-black text-[#1e5eb8] leading-tight">
                ملاحظة صوتية للطلاب
              </p>
              <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                اشرح متطلبات البحث بصوتك
              </p>
            </div>
          </div>
          {saved && (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-700">نشط</span>
            </div>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-xs font-bold text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-xs font-bold text-emerald-800">{success}</p>
          </div>
        )}

        {/* Saved */}
        {saved && !recordedBlob && !recording && (
          <div className="bg-blue-50/60 border border-[#1e5eb8]/20 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs font-black text-[#1e5eb8]">التسجيل نشط — الطلاب يسمعوه حالياً</p>
              <span className="text-xs font-mono font-black text-[#1e5eb8] bg-white rounded-lg px-2 py-0.5 border border-[#1e5eb8]/20">
                {formatTime(saved.duration)}
              </span>
            </div>

            <audio controls src={`data:${saved.mimeType};base64,${saved.data}`} className="w-full h-9" />

            <button
              onClick={deleteSaved}
              className="bg-white hover:bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> حذف التسجيل
            </button>
          </div>
        )}

        {/* Recording */}
        {recording && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <p className="text-sm font-black text-red-700">جاري التسجيل...</p>
            </div>
            <p className="text-3xl font-black font-mono text-red-900">{formatTime(recordingTime)}</p>

            {/* Animated bars */}
            <div className="flex items-center justify-center gap-1 h-8">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full animate-pulse"
                  style={{
                    height: `${6 + Math.abs(Math.sin(i * 0.6 + recordingTime * 0.5)) * 18}px`,
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              ))}
            </div>

            <button
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 mx-auto transition"
            >
              <Square className="w-4 h-4" fill="currentColor" /> إيقاف التسجيل
            </button>
          </div>
        )}

        {/* Preview */}
        {recordedBlob && !recording && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-amber-900">راجع التسجيل قبل الإرسال</p>
              <span className="text-xs font-mono font-black text-amber-900">{formatTime(recordingTime)}</span>
            </div>

            {/* Preview player */}
            <div className="bg-white border border-amber-200 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePreview}
                  className="w-10 h-10 rounded-full bg-[#1e5eb8] hover:bg-[#1650a0] flex items-center justify-center shadow-sm flex-shrink-0 transition-colors"
                >
                  {isPreviewPlaying ? (
                    <Pause className="w-4 h-4 text-white" strokeWidth={2.5} fill="currentColor" />
                  ) : (
                    <Play className="w-4 h-4 text-white ml-0.5" strokeWidth={2.5} fill="currentColor" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] font-mono font-black mb-1">
                    <span className="text-[#1e5eb8]">{formatTime(previewTime)}</span>
                    <span className="text-gray-400">{formatTime(previewDuration || recordingTime)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1e5eb8] rounded-full transition-all"
                      style={{ width: `${previewDuration > 0 ? (previewTime / previewDuration) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {recordedUrl && (
                <audio
                  ref={previewAudioRef}
                  src={recordedUrl}
                  onTimeUpdate={(e) => setPreviewTime((e.target as HTMLAudioElement).currentTime)}
                  onLoadedMetadata={(e) => setPreviewDuration((e.target as HTMLAudioElement).duration)}
                  onEnded={() => { setIsPreviewPlaying(false); setPreviewTime(0); }}
                  className="hidden"
                />
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={saveRecording}
                disabled={saving}
                className="bg-[#1e5eb8] hover:bg-[#1650a0] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 transition shadow-sm"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {saving ? "جاري الإرسال..." : "إرسال للطلاب"}
              </button>
              <button
                onClick={resetRecording}
                className="bg-white hover:bg-gray-50 border border-amber-300 text-amber-900 px-3 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> إعادة
              </button>
            </div>
          </div>
        )}

        {/* Record Button */}
        {!recording && !recordedBlob && (
          <button
            onClick={startRecording}
            className="w-full bg-[#1e5eb8] hover:bg-[#1650a0] text-white py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <Mic className="w-4 h-4" strokeWidth={2.5} />
            {saved ? "تسجيل جديد (سيحدّث الحالي)" : "بدء التسجيل الصوتي"}
          </button>
        )}
      </div>
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
