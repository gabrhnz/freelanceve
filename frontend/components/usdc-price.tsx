import { cn } from "@/lib/utils"

function formatUsdc(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

interface UsdcPriceProps {
  amount: number
  size?: "sm" | "md" | "lg" | "xl"
  showIcon?: boolean
  className?: string
}

export function UsdcPrice({ amount, size = "md", showIcon = true, className }: UsdcPriceProps) {
  const sizeClasses = {
    sm: "text-[14px]",
    md: "text-[18px]",
    lg: "text-[24px]",
    xl: "text-[32px]",
  }

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-bold", sizeClasses[size], className)}>
      {showIcon && (
        <span
          className={cn(
            "bg-[#2775CA] rounded-full flex items-center justify-center text-white font-bold",
            iconSizes[size]
          )}
          style={{ fontSize: size === "sm" ? "8px" : size === "md" ? "10px" : size === "lg" ? "12px" : "14px" }}
        >
          $
        </span>
      )}
      <span>{formatUsdc(amount)}</span>
      <span className="text-[#2775CA]">USDC</span>
    </span>
  )
}

// Badge variant for highlighting
interface UsdcBadgeProps {
  amount: number
  className?: string
}

export function UsdcBadge({ amount, className }: UsdcBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 bg-[#2775CA]/10 border-2 border-[#2775CA] rounded-full px-4 py-2",
        className
      )}
    >
      <div className="w-6 h-6 bg-[#2775CA] rounded-full flex items-center justify-center">
        <span className="text-white font-bold text-[12px]">$</span>
      </div>
      <span className="text-[#2775CA] font-bold text-[14px]">{formatUsdc(amount)} USDC</span>
    </div>
  )
}

// Compact price display for cards
interface UsdcPriceCompactProps {
  amount: number
  label?: string
  className?: string
}

export function UsdcPriceCompact({ amount, label = "Starting at", className }: UsdcPriceCompactProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-[12px] text-[#9B9B9B] font-medium">{label}</span>
      <span className="text-[20px] font-bold flex items-center gap-1">
        <span className="text-[#2775CA]">$</span>
        {formatUsdc(amount)}
      </span>
    </div>
  )
}
