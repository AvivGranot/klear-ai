import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        className
      )}
      style={style}
    />
  )
}

// Pre-built skeleton components for common patterns
function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("p-4 border border-gray-200 dark:border-gray-700 rounded-lg", className)}>
      <Skeleton className="h-4 w-3/4 mb-4" />
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  )
}

function SkeletonText({ lines = 3, className }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  )
}

function SkeletonAvatar({ size = "md", className }: SkeletonProps & { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  }
  return <Skeleton className={cn("rounded-full", sizes[size], className)} />
}

function SkeletonTable({ rows = 5, cols = 4, className }: SkeletonProps & { rows?: number; cols?: number }) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-6 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonChart({ className }: SkeletonProps) {
  return (
    <div className={cn("flex items-end justify-around gap-2 h-48", className)}>
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton
          key={i}
          className="w-8"
          style={{ height: `${Math.random() * 60 + 40}%` }}
        />
      ))}
    </div>
  )
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonText,
  SkeletonAvatar,
  SkeletonTable,
  SkeletonChart,
}
