import React from "react";
import { cn } from "@/lib/utils";

interface DigitalSealProps {
  className?: string;
  text?: string;
}

export default function DigitalSeal({ className, text = "OFFICIAL VERIFIED" }: DigitalSealProps) {
  return (
    <div className={cn("relative w-24 h-24 flex items-center justify-center opacity-80 select-none pointer-events-none", className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow">
        <defs>
          <path id="circlePath" d="M50,50 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0" />
        </defs>
        
        {/* Outer Ring */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#dc2626" strokeWidth="1" />
        
        {/* Text */}
        <text fill="#dc2626" fontSize="10" fontWeight="bold" letterSpacing="1">
          <textPath xlinkHref="#circlePath" startOffset="0%">
            {text} • {text} •
          </textPath>
        </text>

        {/* Central Emblem */}
        <circle cx="50" cy="50" r="25" fill="none" stroke="#dc2626" strokeWidth="2" />
        <path d="M50 30 L60 50 L50 70 L40 50 Z" fill="#dc2626" />
        <text x="50" y="55" textAnchor="middle" fill="#dc2626" fontSize="12" fontWeight="black">
          GOVT
        </text>
      </svg>
    </div>
  );
}
