"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TagBadgeProps {
  id: string
  name: string
  color: string
  selected?: boolean
  onClick?: (id: string) => void
  className?: string
  size?: "default" | "sm"
}

/**
 * Componente reutilizable para mostrar etiquetas con estilos consistentes
 */
export function TagBadge({ id, name, color, selected = false, onClick, className, size = "default" }: TagBadgeProps) {
  return (
    <Badge
      variant={selected ? "default" : "outline"}
      className={cn(
        "cursor-pointer",
        size === "sm" && "text-xs px-2 py-0.5 h-5",
        onClick && "hover:opacity-80",
        className,
      )}
      style={{
        backgroundColor: selected ? color : `${color}20`,
        borderColor: selected ? color : `${color}40`,
        color: selected ? "white" : color,
      }}
      onClick={() => onClick?.(id)}
    >
      {name}
    </Badge>
  )
}
