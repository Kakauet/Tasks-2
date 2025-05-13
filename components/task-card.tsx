"use client"

import type React from "react"

import { useState, useCallback, type DragEvent } from "react"
import { type Task, useTaskContext } from "@/context/task-context"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

// Hooks personalizados
import { useDialogState } from "@/hooks/use-dialog-state"

// Componentes
import { TaskDialog } from "@/components/task-dialog"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { TagBadge } from "@/components/ui/tag-badge"

// UI Components
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Icons
import { Calendar, Trash2, Clock, CheckCircle, Circle, AlertCircle } from "lucide-react"

interface TaskCardProps {
  task: Task
  index: number
}

// Mapeos de prioridad y estado
const PRIORITY_MAP = {
  low: { icon: <Circle className="h-4 w-4 text-green-500" />, text: "Baja", color: "rgb(16 185 129)" },
  medium: { icon: <Clock className="h-4 w-4 text-yellow-500" />, text: "Media", color: "rgb(245 158 11)" },
  high: { icon: <AlertCircle className="h-4 w-4 text-red-500" />, text: "Alta", color: "rgb(239 68 68)" },
}

const STATUS_MAP = {
  todo: { icon: <Circle className="h-4 w-4 text-slate-500" />, text: "Por hacer" },
  inProgress: { icon: <Clock className="h-4 w-4 text-blue-500" />, text: "En progreso" },
  done: { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: "Completada" },
}

export function TaskCard({ task, index }: TaskCardProps) {
  // Estado y contexto
  const { tags, deleteTask } = useTaskContext()
  const editDialog = useDialogState(false)
  const deleteDialog = useDialogState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Procesamiento de datos de tarea
  const taskTags = tags.filter((tag) => task.tags.includes(tag.id))
  const completedSteps = task.steps.filter((step) => step.completed).length
  const totalSteps = task.steps.length
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  // Función para obtener el color de la fecha de vencimiento
  const getDueDateColor = useCallback(() => {
    if (!task.dueDate) return ""

    const today = new Date()
    const dueDate = new Date(task.dueDate)

    if (dueDate < today) return "text-red-500"
    if (dueDate < new Date(today.setDate(today.getDate() + 1))) return "text-yellow-500"
    return "text-green-500"
  }, [task.dueDate])

  // Handlers
  const handleDeleteTask = useCallback(() => {
    deleteDialog.startProcessing()
    deleteTask(task.id)
    setTimeout(deleteDialog.endProcessing, 100)
  }, [task.id, deleteTask, deleteDialog])

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData("taskId", task.id)
      e.dataTransfer.setData("sourceStatus", task.status)
      e.dataTransfer.setData("sourceIndex", index.toString())
      setIsDragging(true)
    },
    [task.id, task.status, index],
  )

  // Componente para metadatos de la tarea
  const TaskMetadata = () => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 my-3">
      {/* Estado */}
      <MetadataItem
        icon={STATUS_MAP[task.status].icon}
        text={STATUS_MAP[task.status].text}
        tooltip={`Estado: ${STATUS_MAP[task.status].text}`}
      />

      {/* Prioridad */}
      <MetadataItem
        icon={PRIORITY_MAP[task.priority].icon}
        text={`Prioridad ${PRIORITY_MAP[task.priority].text}`}
        tooltip={`Prioridad: ${PRIORITY_MAP[task.priority].text}`}
      />

      {/* Fecha límite */}
      {task.dueDate && (
        <MetadataItem
          icon={<Calendar className="h-3.5 w-3.5" />}
          text={formatDistanceToNow(new Date(task.dueDate), { addSuffix: true, locale: es })}
          tooltip={`Fecha límite: ${new Date(task.dueDate).toLocaleDateString()}`}
          className={getDueDateColor()}
        />
      )}
    </div>
  )

  // Componente para un elemento de metadatos
  const MetadataItem = ({
    icon,
    text,
    tooltip,
    className = "",
  }: {
    icon: React.ReactNode
    text: string
    tooltip: string
    className?: string
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center gap-1.5 text-xs ${className}`}>
          {icon}
          <span className="text-muted-foreground">{text}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )

  return (
    <>
      <TooltipProvider>
        <Card
          className={cn(
            "group relative overflow-hidden transition-all duration-200 cursor-pointer",
            "border border-border/60 hover:border-primary/30 hover:shadow-md",
            "bg-card/80 backdrop-blur-sm",
            isDragging && "opacity-50 border-dashed",
            task.status === "done" && "opacity-90",
          )}
          draggable={true}
          onDragStart={handleDragStart}
          onDragEnd={() => setIsDragging(false)}
          onClick={editDialog.open}
        >
          {/* Barra de prioridad */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1.5"
            style={{ backgroundColor: PRIORITY_MAP[task.priority].color }}
          />

          <CardContent className="p-4 pl-6">
            {/* Header: título y botón de eliminar */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-base leading-tight truncate">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{task.description}</p>
                )}
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 shrink-0 -mt-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteDialog.open()
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                    <span className="sr-only">Eliminar tarea</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Eliminar tarea</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Metadatos: estado, prioridad y fecha */}
            <TaskMetadata />

            {/* Barra de progreso */}
            {totalSteps > 0 && (
              <div className="mt-3 mb-1">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progreso</span>
                  <span
                    className={cn(
                      progress === 100 ? "text-green-500 font-medium" : "",
                      progress > 0 && progress < 100 ? "text-blue-500" : "",
                    )}
                  >
                    {completedSteps}/{totalSteps}
                    {progress === 100 && " ✓"}
                  </span>
                </div>
                <Progress
                  value={progress}
                  className={cn(
                    "h-2",
                    progress === 100 ? "bg-green-100 dark:bg-green-950/30" : "bg-blue-100 dark:bg-blue-950/30",
                  )}
                  indicatorClassName={progress === 100 ? "bg-green-500" : ""}
                />
              </div>
            )}

            {/* Etiquetas */}
            {taskTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {taskTags.map((tag) => (
                  <TagBadge key={tag.id} id={tag.id} name={tag.name} color={tag.color} size="sm" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TooltipProvider>

      {/* Diálogos */}
      <TaskDialog open={editDialog.isOpen} onOpenChange={editDialog.setIsOpen} defaultValues={task} mode="edit" />

      <ConfirmationDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setIsOpen}
        title="¿Estás seguro?"
        description="Esta acción no se puede deshacer. La tarea será eliminada permanentemente."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteTask}
        isProcessing={deleteDialog.isProcessing}
        variant="destructive"
      />
    </>
  )
}
