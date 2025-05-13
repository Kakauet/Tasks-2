"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { useDrag, useDrop } from "react-dnd"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import type { TaskStep } from "@/context/task-context"

interface DraggableStepProps {
  step: TaskStep
  index: number
  moveStep: (dragIndex: number, hoverIndex: number) => void
  toggleStep: (id: string) => void
  deleteStep: (id: string) => void
  updateStepText: (id: string, text: string) => void
}

interface DragItem {
  index: number
  id: string
  type: string
}

export function DraggableStep({ step, index, moveStep, toggleStep, deleteStep, updateStepText }: DraggableStepProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(step.text)
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Enfocar el input cuando se activa la edición
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleDoubleClick = () => {
    if (!step.completed) {
      setIsEditing(true)
    }
  }

  const handleBlur = () => {
    if (editText.trim()) {
      updateStepText(step.id, editText)
    } else {
      setEditText(step.text)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (editText.trim()) {
        updateStepText(step.id, editText)
      } else {
        setEditText(step.text)
      }
      setIsEditing(false)
    } else if (e.key === "Escape") {
      setEditText(step.text)
      setIsEditing(false)
    }
  }

  const [{ handlerId }, drop] = useDrop({
    accept: "STEP",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      // No reemplazar elementos consigo mismos
      if (dragIndex === hoverIndex) {
        return
      }

      // Determinar rectángulo en pantalla
      const hoverBoundingRect = ref.current?.getBoundingClientRect()

      // Obtener punto medio vertical
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

      // Determinar posición del mouse
      const clientOffset = monitor.getClientOffset()

      // Obtener píxeles al borde superior
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top

      // Solo realizar el movimiento cuando el mouse haya cruzado la mitad de la altura del elemento
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Realizar la acción
      moveStep(dragIndex, hoverIndex)

      item.index = hoverIndex
    },
  })

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: "STEP",
    item: () => {
      return { id: step.id, index }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  // Configura el drag preview como todo el componente
  dragPreview(drop(ref))

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      ref={ref}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 mb-2 backdrop-blur-md transition-all duration-300",
        "bg-gradient-to-r from-white/10 to-white/5 dark:from-black/20 dark:to-black/10",
        "border-white/20 dark:border-gray-800/50 shadow-sm hover:shadow-md",
        isDragging && "opacity-40 border-dashed border-blue-400/50 bg-blue-50/10",
        step.completed && "opacity-70",
        isHovered && !step.completed && "border-blue-200/30 bg-blue-50/5",
      )}
      style={{
        opacity: isDragging ? 0.4 : 1,
      }}
      data-handler-id={handlerId}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Grip handle for dragging */}
      <div
        ref={drag}
        className={cn(
          "cursor-grab touch-manipulation px-1",
          isDragging && "cursor-grabbing",
          "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300",
          "transition-colors duration-200",
        )}
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="relative">
        <Checkbox
          checked={step.completed}
          onCheckedChange={() => toggleStep(step.id)}
          className={cn(
            "transition-all duration-300",
            step.completed ? "bg-green-500/80 border-green-600/30" : "",
            "focus:ring-2 focus:ring-blue-400/30",
          )}
        />
      </div>

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 bg-transparent border-b border-gray-300/30 focus:border-blue-400/50 focus:outline-none"
          autoFocus
        />
      ) : (
        <span
          className={cn(
            "flex-1 px-2 font-medium transition-all duration-200",
            step.completed && "text-muted-foreground line-through",
            !step.completed && isHovered && "text-blue-900 dark:text-blue-300",
          )}
          onDoubleClick={handleDoubleClick}
        >
          {step.text}
        </span>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => deleteStep(step.id)}
        className={cn(
          "rounded-full opacity-60 hover:opacity-100 transition-opacity duration-200",
          "hover:bg-red-100/30 hover:text-red-500",
          "dark:hover:bg-red-900/20",
          !isHovered && !isDragging && "md:opacity-0",
        )}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </motion.div>
  )
}
