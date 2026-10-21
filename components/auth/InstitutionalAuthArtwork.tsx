"use client";

import React from "react";

interface InstitutionalAuthArtworkProps {
  isDark?: boolean;
  className?: string;
}

export default function InstitutionalAuthArtwork({
  isDark = true,
  className = "",
}: InstitutionalAuthArtworkProps) {
  // Theme-adaptive crisp color tokens
  const strokePrimary = isDark ? "#10b981" : "#059669";
  const strokeSecondary = isDark ? "#06b6d4" : "#0284c7";
  const strokeAccent = isDark ? "#8b5cf6" : "#6366f1";
  const strokeSubtle = isDark ? "#334155" : "#cbd5e1";
  const fillSurface = isDark ? "#0f172a" : "#ffffff";
  const fillSurfaceAlt = isDark ? "#1e293b" : "#f1f5f9";
  const glowOpacity = isDark ? "0.35" : "0.15";

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none transition-opacity duration-700 ${className}`}
      style={{ opacity: isDark ? 0.82 : 0.48 }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover animate-svg-drift"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Neon Glow Filters */}
          <filter id="cleanNeonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="cleanNeonCyan" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="cleanNeonViolet" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Laser Gradients for Electric Lightning Pulses */}
          <linearGradient id="laserStreamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="30%" stopColor="#34d399" stopOpacity={isDark ? "0.9" : "0.6"} />
            <stop offset="70%" stopColor="#06b6d4" stopOpacity={isDark ? "0.95" : "0.65"} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="laserStreamGradReverse" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="40%" stopColor="#06b6d4" stopOpacity={isDark ? "0.85" : "0.5"} />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>

          {/* Gradients for 3D Isometric Shading */}
          <linearGradient id="isoTabletTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? "#1e293b" : "#f8fafc"} />
            <stop offset="100%" stopColor={isDark ? "#0f172a" : "#e2e8f0"} />
          </linearGradient>

          <linearGradient id="isoTabletSide" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isDark ? "#0f172a" : "#cbd5e1"} />
            <stop offset="100%" stopColor={isDark ? "#020617" : "#94a3b8"} />
          </linearGradient>

          <linearGradient id="chartBarEmerald" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>

          <linearGradient id="chartBarCyan" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          <linearGradient id="chartBarPurple" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          {/* Pillar / Arch Gradient */}
          <linearGradient id="cleanPillarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isDark ? "#1e293b" : "#e2e8f0"} stopOpacity="0.75" />
            <stop offset="100%" stopColor={isDark ? "#020617" : "#cbd5e1"} stopOpacity="0.1" />
          </linearGradient>

          {/* Center Ambient Core Aura */}
          <radialGradient id="portalCenterAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isDark ? "#10b981" : "#059669"} stopOpacity={glowOpacity} />
            <stop offset="50%" stopColor={isDark ? "#06b6d4" : "#0284c7"} stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft Background Radial Aura */}
        <circle cx="720" cy="450" r="460" fill="url(#portalCenterAura)" />

        {/* ======================================================== */}
        {/* 1. LEFT FLANK: 3D ISOMETRIC DIGITAL STUDENT HUB & ERP   */}
        {/* ======================================================== */}
        <g transform="translate(60, 110)">
          {/* Isometric Workstation / Digital Tablet Foundation */}
          <g>
            {/* Tablet Top Surface (Isometric Rhombus) */}
            <polygon
              points="140,60 260,120 140,180 20,120"
              fill="url(#isoTabletTop)"
              stroke={strokePrimary}
              strokeWidth="1.8"
            />
            {/* Tablet Left Thickness */}
            <polygon
              points="20,120 140,180 140,195 20,135"
              fill="url(#isoTabletSide)"
              stroke={strokeSubtle}
              strokeWidth="1"
            />
            {/* Tablet Right Thickness */}
            <polygon
              points="140,180 260,120 260,135 140,195"
              fill={isDark ? "#090d16" : "#64748b"}
              stroke={strokeSubtle}
              strokeWidth="1"
            />

            {/* Glowing Screen Area on Tablet */}
            <polygon
              points="140,75 240,125 140,170 40,120"
              fill={isDark ? "#064e3b33" : "#d1fae5"}
              stroke={strokeSecondary}
              strokeWidth="1"
              strokeDasharray="4 3"
            />

            {/* 3D Isometric Bar Chart Columns (Student Academic Analytics) */}
            {/* Bar 1 (Emerald) */}
            <g transform="translate(70, 95)">
              <polygon points="12,0 24,6 12,12 0,6" fill="#34d399" />
              <polygon points="0,6 12,12 12,38 0,32" fill="url(#chartBarEmerald)" />
              <polygon points="12,12 24,6 24,32 12,38" fill="#047857" />
            </g>
            {/* Bar 2 (Cyan) */}
            <g transform="translate(100, 105)">
              <polygon points="12,0 24,6 12,12 0,6" fill="#38bdf8" />
              <polygon points="0,6 12,12 12,50 0,44" fill="url(#chartBarCyan)" />
              <polygon points="12,12 24,6 24,44 12,50" fill="#0369a1" />
            </g>
            {/* Bar 3 (Purple) */}
            <g transform="translate(130, 115)">
              <polygon points="12,0 24,6 12,12 0,6" fill="#c084fc" />
              <polygon points="0,6 12,12 12,30 0,24" fill="url(#chartBarPurple)" />
              <polygon points="12,12 24,6 24,24 12,30" fill="#6d28d9" />
            </g>
            {/* Bar 4 (Emerald Peak) */}
            <g transform="translate(160, 110)">
              <polygon points="12,0 24,6 12,12 0,6" fill="#34d399" />
              <polygon points="0,6 12,12 12,62 0,56" fill="url(#chartBarEmerald)" />
              <polygon points="12,12 24,6 24,56 12,62" fill="#047857" />
            </g>
          </g>

          {/* Floating Academic Tech Badge "A+" */}
          <g className="animate-ambient-float">
            <rect
              x="220"
              y="40"
              width="60"
              height="30"
              rx="8"
              fill={fillSurface}
              stroke={strokePrimary}
              strokeWidth="1.5"
              filter="url(#cleanNeonGlow)"
            />
            <text
              x="250"
              y="60"
              textAnchor="middle"
              fill={strokePrimary}
              fontSize="12"
              fontFamily="monospace"
              fontWeight="900"
            >
              A+ GRADE
            </text>
          </g>

          {/* Floating ERP Core Node Badge */}
          <g transform="translate(10, 220)">
            <rect
              x="0"
              y="0"
              width="100"
              height="28"
              rx="7"
              fill={fillSurfaceAlt}
              stroke={strokeSecondary}
              strokeWidth="1.2"
            />
            <circle cx="16" cy="14" r="5" fill="#22d3ee" className="animate-pulse" />
            <text
              x="55"
              y="18"
              textAnchor="middle"
              fill={isDark ? "#e2e8f0" : "#0f172a"}
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              SIS • LIVE
            </text>
          </g>

          {/* Clean High-Tech Bus Lines with Animated Electric Flow */}
          <path
            d="M 140 195 L 140 280 L 220 320 L 320 320"
            stroke={strokePrimary}
            strokeWidth="1.8"
            strokeDasharray="6 6"
            className="animate-svg-dash-flow"
            fill="none"
            opacity={isDark ? "0.7" : "0.45"}
          />
          <path
            d="M 260 135 L 340 175 L 340 260 L 400 290"
            stroke={strokeSecondary}
            strokeWidth="1.5"
            strokeDasharray="5 5"
            className="animate-svg-dash-flow"
            fill="none"
            opacity={isDark ? "0.6" : "0.35"}
          />

          {/* Data Junction Nodes */}
          <circle cx="140" cy="280" r="5" fill="#34d399" filter="url(#cleanNeonGlow)" className="animate-pulse" />
          <circle cx="220" cy="320" r="4.5" fill="#22d3ee" filter="url(#cleanNeonCyan)" />
          <circle cx="340" cy="260" r="5" fill="#a78bfa" filter="url(#cleanNeonViolet)" />
        </g>

        {/* ======================================================== */}
        {/* 2. CENTER BACKGROUND: PTSC ACADEMIC FAÇADE & ERP NEXUS   */}
        {/* ======================================================== */}
        <g transform="translate(480, 50)" opacity={isDark ? "0.38" : "0.22"}>
          {/* Classical Pediment Crown */}
          <polygon
            points="240,40 40,120 440,120"
            fill="url(#cleanPillarGrad)"
            stroke={strokePrimary}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Central PTSC Seal Emplacement */}
          <circle cx="240" cy="90" r="18" fill={fillSurface} stroke={strokePrimary} strokeWidth="2" />
          <circle cx="240" cy="90" r="8" fill="#10b981" />

          {/* Horizontal Entablature */}
          <rect x="30" y="120" width="420" height="15" fill="url(#cleanPillarGrad)" stroke={strokeSubtle} strokeWidth="1" />

          {/* 4 Majestic Institutional Pillars */}
          {[70, 180, 300, 410].map((xPos, idx) => (
            <g key={idx}>
              <rect x={xPos - 8} y="135" width="34" height="10" rx="2" fill="url(#cleanPillarGrad)" stroke={strokeSubtle} strokeWidth="1" />
              <rect x={xPos - 4} y="145" width="26" height="400" fill="url(#cleanPillarGrad)" stroke={strokeSubtle} strokeWidth="1" />
              {/* Internal Pillar Optical Fiber Channel */}
              <line
                x1={xPos + 9}
                y1="150"
                x2={xPos + 9}
                y2="540"
                stroke={idx % 2 === 0 ? strokePrimary : strokeSecondary}
                strokeWidth="1.5"
                strokeDasharray="8 6"
                className="animate-svg-dash-flow"
                opacity={isDark ? "0.65" : "0.4"}
              />
              <rect x={xPos - 8} y="545" width="34" height="14" rx="2" fill="url(#cleanPillarGrad)" stroke={strokeSubtle} strokeWidth="1" />
            </g>
          ))}

          {/* Concentric ERP Core Energy Waves */}
          <circle
            cx="240"
            cy="360"
            r="120"
            stroke={strokeSecondary}
            strokeWidth="1.2"
            strokeDasharray="6 8"
            fill="none"
            className="animate-[spin_90s_linear_infinite]"
            style={{ transformOrigin: "240px 360px" }}
          />
          <circle
            cx="240"
            cy="360"
            r="180"
            stroke={strokePrimary}
            strokeWidth="1"
            strokeDasharray="8 12"
            fill="none"
            className="animate-[spin_120s_linear_infinite]"
            style={{ transformOrigin: "240px 360px" }}
          />
        </g>

        {/* ======================================================== */}
        {/* 3. RIGHT FLANK: 3D GRADUATION MORTARBOARD & DIPLOMA HUB  */}
        {/* ======================================================== */}
        <g transform="translate(1040, 120)">
          {/* Isometric 3D Floating Graduation Mortarboard with Faceted Shading */}
          <g className="animate-ambient-float" style={{ animationDelay: "1.5s" }}>
            {/* Top Rhombus Face */}
            <polygon
              points="140,20 230,60 140,100 50,60"
              fill={isDark ? "#064e3b" : "#ccfbf1"}
              stroke={strokePrimary}
              strokeWidth="2.2"
              filter="url(#cleanNeonGlow)"
            />
            {/* Left Bevel Depth */}
            <polygon
              points="50,60 140,100 140,114 50,74"
              fill={isDark ? "#022c22" : "#5eead4"}
              stroke={strokePrimary}
              strokeWidth="1.2"
            />
            {/* Right Bevel Depth */}
            <polygon
              points="140,100 230,60 230,74 140,114"
              fill={isDark ? "#047857" : "#2dd4bf"}
              stroke={strokePrimary}
              strokeWidth="1.2"
            />
            {/* Skull Cap Base Underneath */}
            <path
              d="M 95 90 Q 140 125 185 90 L 180 130 Q 140 160 100 130 Z"
              fill={fillSurfaceAlt}
              stroke={strokeSecondary}
              strokeWidth="1.6"
            />
            {/* Golden Button & Tassel */}
            <circle cx="140" cy="60" r="5.5" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2" />
            <path
              d="M 140 60 Q 180 75 195 110 L 198 150"
              stroke="#fbbf24"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="198" cy="150" r="4" fill="#fbbf24" />
          </g>

          {/* 3D Isometric Rolled Diploma / Certificate */}
          <g transform="translate(40, 220)">
            <rect
              x="30"
              y="10"
              width="130"
              height="26"
              rx="13"
              fill={isDark ? "#1e293b" : "#f1f5f9"}
              stroke={strokePrimary}
              strokeWidth="1.5"
            />
            {/* Red Ribbon Band */}
            <rect x="85" y="10" width="16" height="26" fill="#ef4444" />
            <polygon points="87,36 93,48 99,36" fill="#ef4444" />
            <polygon points="91,36 97,48 103,36" fill="#dc2626" />
            {/* Golden Seal */}
            <circle cx="93" cy="23" r="6" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
          </g>

          {/* Clean Orbital Halo & Satellite Nodes */}
          <g>
            <ellipse
              cx="140"
              cy="280"
              rx="125"
              ry="50"
              stroke={strokeSecondary}
              strokeWidth="1.6"
              strokeDasharray="6 6"
              fill="none"
              transform="rotate(-12 140 280)"
              className="animate-svg-dash-flow"
              opacity={isDark ? "0.6" : "0.35"}
            />
            {/* Revolving Satellites */}
            <circle cx="45" cy="295" r="5" fill="#06b6d4" filter="url(#cleanNeonCyan)" />
            <circle cx="235" cy="255" r="4.5" fill="#a78bfa" filter="url(#cleanNeonViolet)" />
          </g>

          {/* Floating Tech Badge "BTEB CERTIFIED" */}
          <g transform="translate(140, 360)">
            <rect
              x="0"
              y="0"
              width="120"
              height="28"
              rx="8"
              fill={fillSurface}
              stroke={strokePrimary}
              strokeWidth="1.4"
              filter="url(#cleanNeonGlow)"
            />
            <text
              x="60"
              y="18"
              textAnchor="middle"
              fill={strokePrimary}
              fontSize="9.5"
              fontFamily="monospace"
              fontWeight="900"
            >
              BTEB CERTIFIED
            </text>
          </g>
        </g>

        {/* ======================================================== */}
        {/* 4. DYNAMIC ELECTRIC LIGHTNING SWEEP PULSES & SPARKS      */}
        {/* ======================================================== */}
        {/* Top Horizontal Electric Spark Sweep */}
        <line
          x1="0"
          y1="85"
          x2="1440"
          y2="85"
          stroke="url(#laserStreamGrad)"
          strokeWidth="2.5"
          className="animate-electric-sweep"
        />

        {/* Bottom Horizontal Electric Spark Sweep */}
        <line
          x1="0"
          y1="815"
          x2="1440"
          y2="815"
          stroke="url(#laserStreamGradReverse)"
          strokeWidth="2.2"
          className="animate-electric-sweep"
          style={{ animationDelay: "2s" }}
        />

        {/* Transverse Subtle Diagonal Lightning Current Arc */}
        <path
          d="M 0 760 Q 400 700 720 720 T 1440 680"
          stroke="url(#laserStreamGrad)"
          strokeWidth="1.6"
          strokeDasharray="12 16"
          fill="none"
          className="animate-svg-dash-flow"
          opacity={isDark ? "0.55" : "0.3"}
        />

        {/* Sparkling Cyber Tech Micro-Nodes */}
        <g className="animate-electric-sparkle">
          <circle cx="360" cy="85" r="3.5" fill="#34d399" />
          <circle cx="720" cy="85" r="4" fill="#22d3ee" />
          <circle cx="1080" cy="85" r="3.5" fill="#a78bfa" />
          <circle cx="480" cy="815" r="3.5" fill="#22d3ee" />
          <circle cx="960" cy="815" r="4" fill="#34d399" />
          <circle cx="1200" cy="700" r="3" fill="#a78bfa" />
        </g>
      </svg>
    </div>
  );
}
