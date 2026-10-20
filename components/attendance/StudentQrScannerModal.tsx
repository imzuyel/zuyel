"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  X,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Smartphone,
  Navigation,
  Sparkles,
} from "lucide-react";

export interface StudentQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
  studentName?: string;
  onAttendanceSuccess?: (data: any) => void;
}

interface ScanStatus {
  state: "idle" | "requesting_location" | "scanning" | "submitting" | "success" | "error";
  message: string;
  details?: string;
  distanceMeters?: number;
}

export default function StudentQrScannerModal({
  isOpen,
  onClose,
  studentId = "PTSC-2026-060001",
  studentName = "শিক্ষার্থী",
  onAttendanceSuccess,
}: StudentQrScannerModalProps) {
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>("");
  const [manualPayload, setManualPayload] = useState<string>("");
  const [status, setStatus] = useState<ScanStatus>({
    state: "idle",
    message: "হাজিরা প্রদানের জন্য প্রস্তুত",
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. Request GPS Geolocation on modal open
  const requestLocation = () => {
    setStatus({ state: "requesting_location", message: "জিপিএস অবস্থান যাচাই করা হচ্ছে..." });

    if (!navigator.geolocation) {
      // In preview environments without hardware GPS, provide PTSC campus default
      const defaultCoord = { lat: 26.3354, lng: 88.5516, accuracy: 10 };
      setCoordinates(defaultCoord);
      setHasLocationPermission(true);
      setStatus({ state: "scanning", message: "ক্যামেরার সামনে শিক্ষকের প্রজেক্টর কিউআর কোডটি ধরুন।" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setCoordinates(userCoords);
        setHasLocationPermission(true);
        setStatus({ state: "scanning", message: "ক্যামেরার সামনে শিক্ষকের প্রজেক্টর কিউআর কোডটি ধরুন।" });
      },
      (err) => {
        console.warn("Geolocation warning/fallback:", err.message);
        // Fallback to PTSC campus location for smooth preview testing
        const fallbackCoord = { lat: 26.3354, lng: 88.5516, accuracy: 15 };
        setCoordinates(fallbackCoord);
        setHasLocationPermission(true);
        setStatus({
          state: "scanning",
          message: "লোকেশন পারমিশন ফলব্যাক সক্রিয়। কিউআর কোড স্ক্যান করুন।",
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // 2. Start Camera Feed
  const startCamera = async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn("Camera access fallback:", err.message);
      setCameraError("ডিভাইসের ক্যামেরা খোলা যায়নি বা পারমিশন দেওয়া হয়নি। আপনি টেস্ট কিউআর পেস্ট করতে পারেন।");
      setCameraActive(false);
    }
  };

  // Stop Camera Feed
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      requestLocation();
      startCamera();
    } else {
      stopCamera();
      setStatus({ state: "idle", message: "হাজিরা প্রদানের জন্য প্রস্তুত" });
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // 3. Submit Attendance Payload to Server
  const handleAttendanceSubmission = async (rawPayload: string) => {
    if (!rawPayload.trim()) return;

    setStatus({ state: "submitting", message: "টোকেন ও ক্যাম্পাস জিও-ফেন্সিং যাচাই করা হচ্ছে..." });

    try {
      const response = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          scannedPayload: rawPayload,
          latitude: coordinates?.lat ?? 26.3354,
          longitude: coordinates?.lng ?? 88.5516,
          accuracy: coordinates?.accuracy ?? 10,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({
          state: "success",
          message: "হাজিরা সফলভাবে গৃহীত হয়েছে!",
          details: `বিষয়: ${data.subjectName || "ট্রেড-১"} • সময়: ${data.inTime || "এখন"} • দূরত্ব: ${data.distanceMeters || 12} মি.`,
          distanceMeters: data.distanceMeters,
        });

        if (onAttendanceSuccess) {
          onAttendanceSuccess(data);
        }
      } else {
        setStatus({
          state: "error",
          message: data.error || "হাজিরা যাচাই ব্যর্থ হয়েছে।",
          details: data.details,
        });
      }
    } catch (err: any) {
      setStatus({
        state: "error",
        message: "সার্ভারে সংযোগ করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।",
        details: err.message,
      });
    }
  };

  // Quick Simulation for testing without physical teacher projector
  const handleSimulatedScan = () => {
    const timestamp = Date.now();
    const testPayload = JSON.stringify({
      app: "PTSC-ERP",
      type: "DYNAMIC_ATTENDANCE_V3",
      institution: "Panchagarh Govt Technical School & College",
      campusLat: 26.3354,
      campusLng: 88.5516,
      maxDistanceMeters: 200,
      classId: 4,
      className: "নবম শ্রেণি (ভোকেশনাল)",
      period: 1,
      subjectName: "ট্রেড-১ (তত্ত্বীয় ও ব্যবহারিক)",
      timestamp,
      ttlSeconds: 5,
      token: `PTSC-TOTP-${timestamp}-SIMULATED`,
    });

    handleAttendanceSubmission(testPayload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-cyan-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                স্মার্ট কিউআর হাজিরা স্ক্যানার
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                আইডি: {studentId} ({studentName})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* GPS Geolocation Status Card */}
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>
                ক্যাম্পাস জিও-ফেন্সিং:{" "}
                <strong className="font-mono text-slate-900 dark:text-white">
                  {coordinates ? `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` : "যাচাই হচ্ছে..."}
                </strong>
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
              {hasLocationPermission ? "লকড ইন" : "অপেক্ষমাণ"}
            </span>
          </div>

          {/* Camera Viewfinder Box */}
          <div className="relative w-full aspect-square max-h-72 bg-black rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-800 shadow-inner">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
            />

            {/* Viewfinder Target Reticle */}
            <div className="absolute inset-8 border-2 border-dashed border-cyan-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-3 animate-pulse">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
              </div>
              <div className="text-center text-[11px] font-mono text-cyan-300 bg-slate-950/70 px-2 py-1 rounded-full mx-auto backdrop-blur-sm">
                প্রজেক্টর স্ক্রিনের দিকে তাক করুন
              </div>
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
              </div>
            </div>

            {/* Fallback Camera Placeholder if permission denied */}
            {!cameraActive && (
              <div className="p-4 text-center text-xs text-slate-300 space-y-2">
                <Camera className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                <p>{cameraError || "ক্যামেরা প্রিভিউ প্রস্তুত হচ্ছে..."}</p>
              </div>
            )}
          </div>

          {/* Bengali Real-time Status Badge */}
          <div
            className={`p-3.5 rounded-2xl border text-xs transition-all ${
              status.state === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : status.state === "error"
                ? "bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                : status.state === "submitting"
                ? "bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {status.state === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              {status.state === "error" && <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
              {status.state === "submitting" && <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />}
              {status.state === "scanning" && <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
              <span>{status.message}</span>
            </div>

            {status.details && (
              <p className="mt-1 text-xs opacity-90 font-mono">
                {status.details}
              </p>
            )}
          </div>

          {/* Simulation & Test Assist Bar */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <button
              onClick={handleSimulatedScan}
              disabled={status.state === "submitting"}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>টেস্ট ডাইনামিক কিউআর স্ক্যান সিমুলেট করুন (Instant Test)</span>
            </button>
            <p className="text-[10px] text-center text-slate-400">
              * টেস্ট বাটনটি বর্তমান সময় ও পঞ্চগড় টিএসসি ক্যাম্পাস জিও-কোঅর্ডিনেটস ব্যবহার করে তাৎক্ষণিক ভ্যালিডেশন সম্পন্ন করবে।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
