import React, { useId } from "react";
import { cn } from "@/lib/utils";

interface DigitalSealProps {
  className?: string;
  text?: string;
  color?: string;
  subText?: string;
  animated?: boolean;
}

export default function DigitalSeal({
  className,
  text = "PTSC OFFICIAL VERIFIED",
  color = "#dc2626",
  subText = "GOVT OF BANGLADESH",
  animated = true,
}: DigitalSealProps) {
  const uniqueId = useId().replace(/:/g, "_");
  const pathId = `sealCirclePath_${uniqueId}`;

  return (
    <div
      className={cn(
        "relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center opacity-85 print:opacity-100 select-none pointer-events-none drop-shadow-sm",
        className
      )}
      style={{ color }}
    >
      <svg
        viewBox="0 0 200 200"
        className={cn(
          "w-full h-full",
          animated && "animate-spin-slow print:animate-none print:transform-none"
        )}
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
      >
        <defs>
          {/* Path for outer circular text */}
          <path
            id={pathId}
            d="M 100, 100 m -72, 0 a 72,72 0 1,1 144,0 a 72,72 0 1,1 -144,0"
          />
        </defs>

        {/* Outer Serrated / Beaded Ring */}
        <circle
          cx="100"
          cy="100"
          r="94"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 3"
        />

        {/* Outer Solid Border Ring */}
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
        />

        {/* Inner Border Ring */}
        <circle
          cx="100"
          cy="100"
          r="58"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* Circular Curved Text along Path */}
        <text
          fill="currentColor"
          fontSize="11.5"
          fontWeight="800"
          letterSpacing="2.2"
          className="font-serif uppercase"
        >
          <textPath href={`#${pathId}`} xlinkHref={`#${pathId}`} startOffset="0%">
            ★ {text} ★ {subText}
          </textPath>
        </text>

        {/* Central Seal Core Emblem */}
        <circle
          cx="100"
          cy="100"
          r="48"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />

        {/* Star Polygon Center */}
        <polygon
          points="100,66 104,78 116,78 107,85 110,97 100,90 90,97 93,85 84,78 96,78"
          fill="currentColor"
          opacity="0.9"
        />

        {/* Center Typography */}
        <text
          x="100"
          y="114"
          textAnchor="middle"
          fill="currentColor"
          fontSize="14"
          fontWeight="900"
          letterSpacing="1"
          className="font-sans"
        >
          PTSC
        </text>

        <text
          x="100"
          y="128"
          textAnchor="middle"
          fill="currentColor"
          fontSize="8.5"
          fontWeight="800"
          letterSpacing="1.5"
          className="font-mono uppercase"
        >
          GOVT 18017
        </text>

        {/* Bottom Micro Star */}
        <polygon
          points="100,135 101.5,140 106,140 102.5,143 104,148 100,145 96,148 97.5,143 94,140 98.5,140"
          fill="currentColor"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}
