"use client";

import React from "react";
import { motion } from "motion/react";

// =========================================================================
// 1. INSTITUTION TECHNICAL SEAL SVG (Official Technical Emblem)
// =========================================================================
export function InstitutionTechnicalSealSVG({
  size = 120,
  className = "",
  showGlow = true,
}: {
  size?: number;
  className?: string;
  showGlow?: boolean;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background radial glow */}
      {showGlow && (
        <div className="absolute inset-0 rounded-full bg-cyan-500/20 dark:bg-cyan-500/25 blur-xl pointer-events-none animate-pulse-gentle" />
      )}

      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="relative z-10 drop-shadow-md"
      >
        <defs>
          <linearGradient id="techSealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <filter id="sealGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Rotating Technical Gear Teeth */}
        <g className="animate-spin-slow origin-center">
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="url(#techSealGrad)"
            strokeWidth="2.5"
            strokeDasharray="6 8"
            opacity="0.8"
          />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 360) / 12;
            return (
              <rect
                key={i}
                x="96.5"
                y="5"
                width="7"
                height="9"
                rx="2"
                fill="url(#techSealGrad)"
                transform={`rotate(${angle} 100 100)`}
              />
            );
          })}
        </g>

        {/* Counter-Rotating Precision Circuit Ring */}
        <g className="animate-spin-reverse-slow origin-center">
          <circle
            cx="100"
            cy="100"
            r="72"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.5"
            strokeDasharray="14 10"
            opacity="0.6"
          />
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i * 360) / 6 + 15;
            return (
              <circle
                key={i}
                cx="100"
                cy="28"
                r="3"
                fill="#22d3ee"
                transform={`rotate(${angle} 100 100)`}
              />
            );
          })}
        </g>

        {/* Animated Stroke Dash Circle */}
        <circle
          cx="100"
          cy="100"
          r="58"
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          className="animate-svg-dash"
          opacity="0.85"
        />

        {/* Inner Solid Tech Shield */}
        <circle cx="100" cy="100" r="48" fill="#0f172a" stroke="url(#goldGrad)" strokeWidth="2.5" />

        {/* Center Graphic: Technical Compass & Book Core */}
        <g className="animate-pulse-gentle origin-center">
          {/* Stylized Book/Wings */}
          <path
            d="M74 116 Q100 126 100 100 Q100 126 126 116 Q100 108 74 116 Z"
            fill="url(#goldGrad)"
          />
          {/* Technical Caliper/Compass */}
          <path
            d="M100 70 L82 110 M100 70 L118 110 M88 98 L112 98"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Center Tech Core Node */}
          <circle cx="100" cy="70" r="5" fill="#22d3ee" filter="url(#sealGlow)" />
          <circle cx="100" cy="70" r="2.5" fill="#ffffff" />
        </g>

        {/* Orbiting Satellite Node */}
        <g className="animate-spin-slow origin-center">
          <circle cx="100" cy="14" r="3.5" fill="#f43f5e" filter="url(#sealGlow)" />
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 2. STUDENT ACHIEVEMENT TROPHY SVG (Student-Facing Colorful Vector)
// =========================================================================
export function StudentAchievementTrophySVG({
  size = 140,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Soft Ambient Floating Glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-purple-500/20 blur-xl pointer-events-none animate-pulse-gentle" />

      <svg viewBox="0 0 200 200" width={size} height={size} className="relative z-10">
        <defs>
          <linearGradient id="trophyGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <linearGradient id="trophyCupShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
        </defs>

        {/* Floating Sparkles & Stars */}
        <g className="animate-float">
          {/* Top Star 1 */}
          <path
            d="M50 40 L53 48 L61 50 L53 52 L50 60 L47 52 L39 50 L47 48 Z"
            fill="#fbbf24"
            className="animate-pulse-gentle"
          />
          {/* Top Star 2 */}
          <path
            d="M150 44 L152 50 L158 52 L152 54 L150 60 L148 54 L142 52 L148 50 Z"
            fill="#38bdf8"
            className="animate-pulse-gentle"
          />
          {/* Sparkle 3 */}
          <circle cx="158" cy="110" r="3" fill="#f43f5e" className="animate-ping" />
        </g>

        {/* Trophy Body with Floating Animation */}
        <g className="animate-float origin-center" style={{ animationDuration: "3.5s" }}>
          {/* Left Handle */}
          <path
            d="M68 64 C42 64 42 102 72 106"
            fill="none"
            stroke="url(#trophyGold)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Right Handle */}
          <path
            d="M132 64 C158 64 158 102 128 106"
            fill="none"
            stroke="url(#trophyGold)"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Main Cup */}
          <path
            d="M66 52 L134 52 C134 94 116 116 100 120 C84 116 66 94 66 52 Z"
            fill="url(#trophyGold)"
            filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))"
          />

          {/* Cup Front Shine Highlight */}
          <path
            d="M74 56 C74 76 82 96 92 108 C80 96 74 76 74 56 Z"
            fill="url(#trophyCupShine)"
          />

          {/* Golden Star on Cup Front */}
          <polygon
            points="100,66 104,78 116,78 106,86 110,98 100,90 90,98 94,86 84,78 96,78"
            fill="#ffffff"
            opacity="0.95"
          />

          {/* Stem & Connector */}
          <path d="M93 120 L107 120 L104 142 L96 142 Z" fill="url(#trophyGold)" />
          <ellipse cx="100" cy="142" rx="14" ry="4" fill="#a16207" />

          {/* Pedestal Base */}
          <rect
            x="76"
            y="146"
            width="48"
            height="22"
            rx="6"
            fill="url(#pedestalGrad)"
            stroke="#818cf8"
            strokeWidth="1.5"
          />
          {/* Pedestal Plaque */}
          <rect x="84" y="152" width="32" height="10" rx="2" fill="#fbbf24" />
          <line x1="88" y1="157" x2="112" y2="157" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 3. QUIZ ARENA BANNER SVG (Student High-Energy Vectors)
// =========================================================================
export function QuizArenaBannerSVG({
  size = 130,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/25 via-indigo-500/25 to-pink-500/25 blur-xl pointer-events-none animate-pulse-gentle" />

      <svg viewBox="0 0 200 200" width={size} height={size} className="relative z-10">
        <defs>
          <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="quizRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        {/* Rotating Arena Orbit Rings */}
        <g className="animate-spin-slow origin-center">
          <ellipse
            cx="100"
            cy="100"
            rx="80"
            ry="30"
            fill="none"
            stroke="url(#quizRingGrad)"
            strokeWidth="2"
            strokeDasharray="10 8"
            transform="rotate(-25 100 100)"
          />
        </g>
        <g className="animate-spin-reverse-slow origin-center">
          <ellipse
            cx="100"
            cy="100"
            rx="75"
            ry="26"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="1.5"
            strokeDasharray="6 12"
            transform="rotate(35 100 100)"
          />
        </g>

        {/* Central Speed Lightning Bolt */}
        <g className="animate-float origin-center">
          {/* Background Glow Bolt */}
          <polygon
            points="106,30 68,102 98,102 88,170 142,88 112,88"
            fill="#fbbf24"
            opacity="0.3"
            filter="blur(4px)"
          />
          {/* Foreground Crisp Bolt */}
          <polygon
            points="106,30 68,102 98,102 88,170 142,88 112,88"
            fill="url(#boltGrad)"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Inner Light Core */}
          <polygon
            points="104,40 76,96 100,96 94,146 130,94 110,94"
            fill="#ffffff"
            opacity="0.75"
          />
        </g>

        {/* Floating Question & Check Cards */}
        <g className="animate-float" style={{ animationDuration: "3s" }}>
          {/* Floating '?' Card */}
          <rect
            x="34"
            y="54"
            width="28"
            height="34"
            rx="6"
            fill="#4f46e5"
            stroke="#a5b4fc"
            strokeWidth="1.5"
            transform="rotate(-15 48 71)"
          />
          <text
            x="44"
            y="76"
            fill="#ffffff"
            fontSize="18"
            fontWeight="black"
            fontFamily="sans-serif"
            transform="rotate(-15 48 71)"
          >
            ?
          </text>

          {/* Floating 'A+' / Check Card */}
          <rect
            x="138"
            y="108"
            width="30"
            height="36"
            rx="6"
            fill="#059669"
            stroke="#6ee7b7"
            strokeWidth="1.5"
            transform="rotate(12 153 126)"
          />
          <text
            x="144"
            y="131"
            fill="#ffffff"
            fontSize="14"
            fontWeight="black"
            fontFamily="sans-serif"
            transform="rotate(12 153 126)"
          >
            A+
          </text>
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 4. SERVER DATABASE CONSOLE SVG (Backend / Admin Professional SVG)
// =========================================================================
export function ServerDatabaseConsoleSVG({
  size = 130,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-2xl bg-indigo-500/10 dark:bg-cyan-500/15 blur-xl pointer-events-none" />

      <svg viewBox="0 0 200 200" width={size} height={size} className="relative z-10">
        <defs>
          <linearGradient id="serverChassis" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="dataStream" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>

        {/* Server Blade 1 (Top) */}
        <g>
          <rect
            x="35"
            y="42"
            width="130"
            height="28"
            rx="6"
            fill="url(#serverChassis)"
            stroke="#334155"
            strokeWidth="1.5"
          />
          {/* Drive bay slots */}
          <line x1="45" y1="56" x2="95" y2="56" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          {/* LED activity indicators */}
          <circle cx="120" cy="56" r="3" fill="#10b981" className="animate-pulse" />
          <circle cx="132" cy="56" r="3" fill="#06b6d4" className="animate-ping" style={{ animationDuration: "2s" }} />
          <circle cx="144" cy="56" r="3" fill="#6366f1" />
          <circle cx="154" cy="56" r="2" fill="#94a3b8" />
        </g>

        {/* Server Blade 2 (Middle) */}
        <g>
          <rect
            x="35"
            y="78"
            width="130"
            height="28"
            rx="6"
            fill="url(#serverChassis)"
            stroke="#334155"
            strokeWidth="1.5"
          />
          <line x1="45" y1="92" x2="95" y2="92" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="120" cy="92" r="3" fill="#10b981" className="animate-pulse" style={{ animationDelay: "0.5s" }} />
          <circle cx="132" cy="92" r="3" fill="#fbbf24" className="animate-pulse" />
          <circle cx="144" cy="92" r="3" fill="#10b981" />
          <circle cx="154" cy="92" r="2" fill="#94a3b8" />
        </g>

        {/* Server Blade 3 (Bottom) */}
        <g>
          <rect
            x="35"
            y="114"
            width="130"
            height="28"
            rx="6"
            fill="url(#serverChassis)"
            stroke="#334155"
            strokeWidth="1.5"
          />
          <line x1="45" y1="128" x2="95" y2="128" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="120" cy="128" r="3" fill="#10b981" />
          <circle cx="132" cy="128" r="3" fill="#10b981" className="animate-pulse" style={{ animationDelay: "1s" }} />
          <circle cx="144" cy="128" r="3" fill="#06b6d4" />
          <circle cx="154" cy="128" r="2" fill="#94a3b8" />
        </g>

        {/* Vertical Data Bus & Packet Wave */}
        <path
          d="M26 56 L35 56 M26 92 L35 92 M26 128 L35 128 M26 56 L26 148 L100 148 L100 162"
          fill="none"
          stroke="url(#dataStream)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 4"
          className="animate-svg-dash"
        />

        {/* Central Terminal Connection Node */}
        <circle cx="100" cy="162" r="5" fill="#22d3ee" className="animate-pulse" />
        <circle cx="100" cy="162" r="2" fill="#ffffff" />
      </svg>
    </div>
  );
}

// =========================================================================
// 5. ANIMATED EMPTY STATE SVG (Universal Clean Vector)
// =========================================================================
export function AnimatedEmptyStateSVG({
  size = 140,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-full bg-slate-200/50 dark:bg-slate-800/40 blur-lg pointer-events-none" />

      <svg viewBox="0 0 200 200" width={size} height={size} className="relative z-10">
        <defs>
          <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
          <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* Ground Soft Shadow */}
        <ellipse cx="100" cy="165" rx="55" ry="8" fill="#cbd5e1" opacity="0.4" />

        {/* Floating Blank Document */}
        <g className="animate-float" style={{ animationDuration: "4s" }}>
          {/* Doc shadow */}
          <rect x="62" y="44" width="76" height="96" rx="8" fill="#000000" opacity="0.06" />
          {/* Doc Base */}
          <rect
            x="60"
            y="42"
            width="76"
            height="96"
            rx="8"
            fill="url(#docGrad)"
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />
          {/* Doc Header Bar */}
          <rect x="72" y="56" width="36" height="6" rx="3" fill="#94a3b8" />
          {/* Skeleton Lines */}
          <rect x="72" y="70" width="52" height="4" rx="2" fill="#e2e8f0" />
          <rect x="72" y="80" width="44" height="4" rx="2" fill="#e2e8f0" />
          <rect x="72" y="90" width="48" height="4" rx="2" fill="#e2e8f0" />
          <rect x="72" y="100" width="32" height="4" rx="2" fill="#e2e8f0" />
        </g>

        {/* Magnifying Glass with subtle bobbing */}
        <g className="animate-float" style={{ animationDuration: "3.2s" }}>
          {/* Glass Lens Rim */}
          <circle
            cx="124"
            cy="114"
            r="26"
            fill="#ffffff"
            fillOpacity="0.75"
            stroke="url(#lensGrad)"
            strokeWidth="4"
          />
          {/* Glass Glare */}
          <path
            d="M110 106 A18 18 0 0 1 134 100"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Handle */}
          <line
            x1="142"
            y1="132"
            x2="164"
            y2="154"
            stroke="url(#lensGrad)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="164" cy="154" r="3.5" fill="#06b6d4" />
        </g>
      </svg>
    </div>
  );
}

// =========================================================================
// 6. LIVE QUIZ BROADCAST ARENA SVG (Host Presentation Animated Vector)
// =========================================================================
export function LiveQuizBroadcastArenaSVG({
  size = 140,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background Pulsing Neon Cyan & Indigo Glow Aura */}
      <div className="absolute inset-0 rounded-full bg-linear-to-tr from-cyan-500/30 via-indigo-600/25 to-blue-500/30 blur-2xl pointer-events-none animate-pulse" />

      <svg viewBox="0 0 200 200" width={size} height={size} className="relative z-10">
        <defs>
          <linearGradient id="broadcastGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="neonSweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="centerCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="60%" stopColor="#0284c7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Concentric Pulsing Broadcast Waves */}
        <circle cx="100" cy="100" r="92" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" className="animate-spin-slow origin-center" />
        <circle cx="100" cy="100" r="78" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.6" className="animate-spin-reverse-slow origin-center" />
        <circle cx="100" cy="100" r="64" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="12 4" opacity="0.8" />

        {/* Radar Scanner Beam Slice */}
        <g className="animate-spin origin-center" style={{ animationDuration: "6s" }}>
          <path d="M100 100 L160 70 A70 70 0 0 0 100 30 Z" fill="url(#neonSweepGrad)" opacity="0.35" />
          <line x1="100" y1="100" x2="160" y2="70" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Corner Neon Crosshairs / HUD Reticle */}
        <path d="M40 70 L40 40 L70 40" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <path d="M160 70 L160 40 L130 40" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <path d="M40 130 L40 160 L70 160" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <path d="M160 130 L160 160 L130 160" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

        {/* Floating Satellite Nodes */}
        <g className="animate-pulse">
          <circle cx="48" cy="100" r="4" fill="#22d3ee" />
          <circle cx="152" cy="100" r="4" fill="#22d3ee" />
          <circle cx="100" cy="48" r="4" fill="#818cf8" />
          <circle cx="100" cy="152" r="4" fill="#818cf8" />
        </g>

        {/* Central Broadcast Tower / Satellite Dish Core */}
        <circle cx="100" cy="100" r="32" fill="#0f172a" stroke="url(#broadcastGrad)" strokeWidth="3" />
        <circle cx="100" cy="100" r="22" fill="url(#centerCoreGlow)" />

        {/* Antenna / Broadcast Transmitter Icon in Core */}
        <g className="origin-center">
          <circle cx="100" cy="94" r="5" fill="#ffffff" className="animate-ping" style={{ animationDuration: "1.5s" }} />
          <circle cx="100" cy="94" r="5" fill="#ffffff" />
          <path d="M92 108 L100 95 L108 108" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M88 88 A16 16 0 0 1 112 88" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          <path d="M84 82 A22 22 0 0 1 116 82" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
}
