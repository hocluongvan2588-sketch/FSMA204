export interface WatermarkConfig {
  text: string
  opacity: number
  fontSize: number
  color: string
  rotation: number
}

/**
 * Get watermark configuration for free tier
 */
export function getWatermarkConfig(): WatermarkConfig {
  return {
    text: "FoodTrace Free - Nâng cấp để xóa watermark",
    opacity: 0.15,
    fontSize: 24,
    color: "#64748b",
    rotation: -45,
  }
}

/**
 * Check if watermark should be applied based on package name (CLIENT-SAFE)
 */
export function shouldApplyWatermark(packageName: string): boolean {
  return packageName.toLowerCase().includes("free")
}

/**
 * Generate watermark SVG for PDF exports
 */
export function generateWatermarkSVG(config: WatermarkConfig): string {
  return `
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="position: absolute; top: 0; left: 0; pointer-events: none;">
      <defs>
        <pattern id="watermark-pattern" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
          <text 
            x="200" 
            y="200" 
            transform="rotate(${config.rotation} 200 200)"
            fontSize="${config.fontSize}" 
            fill="${config.color}" 
            opacity="${config.opacity}"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontWeight="600"
          >
            ${config.text}
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#watermark-pattern)" />
    </svg>
  `
}

/**
 * Watermark overlay component for print pages
 */
export function WatermarkOverlay({ packageName }: { packageName: string }) {
  if (!shouldApplyWatermark(packageName)) {
    return null
  }

  const config = getWatermarkConfig()

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 select-none print:block"
      style={{
        background: `repeating-linear-gradient(
          ${config.rotation}deg,
          transparent,
          transparent 200px,
          rgba(100, 116, 139, 0.05) 200px,
          rgba(100, 116, 139, 0.05) 201px
        )`,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="text-slate-400 font-semibold select-none whitespace-nowrap"
          style={{
            fontSize: `${config.fontSize}px`,
            opacity: config.opacity,
            transform: `rotate(${config.rotation}deg)`,
          }}
        >
          {config.text}
        </div>
      </div>
    </div>
  )
}
