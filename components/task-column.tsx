"use client"

import { useTaskContext, type Task, type TaskStatus } from "@/context/task-context"
import { TaskCard } from "@/components/task-card"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Clock, PlusCircle } from "lucide-react"
import { useState, useRef, type DragEvent } from "react"
import { TaskDialog } from "@/components/task-dialog"
import { Button } from "@/components/ui/button"

interface TaskColumnProps {
  title: string
  tasks: Task[]
  status: TaskStatus
}

export function TaskColumn({ title, tasks, status }: TaskColumnProps) {
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const tasksContainerRef = useRef<HTMLDivElement>(null)
  const { moveTask, reorderTasks } = useTaskContext()

  const getStatusIcon = () => {
    switch (status) {
      case "todo":
        return <Circle className="h-5 w-5 text-muted-foreground" />
      case "inProgress":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "done":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
    }
  }

  const getColumnColor = () => {
    switch (status) {
      case "todo":
        return "border-t-slate-500"
      case "inProgress":
        return "border-t-blue-500"
      case "done":
        return "border-t-green-500"
    }
  }

  const getColumnGradient = () => {
    switch (status) {
      case "todo":
        return "from-slate-500/30 to-transparent backdrop-blur-md"
      case "inProgress":
        return "from-blue-500/30 to-transparent backdrop-blur-md"
      case "done":
        return "from-green-500/30 to-transparent backdrop-blur-md"
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()

    // Determinar la posición del cursor
    if (tasksContainerRef.current && tasks.length > 0) {
      const containerRect = tasksContainerRef.current.getBoundingClientRect()
      const mouseY = e.clientY - containerRect.top

      // Encontrar el índice más cercano
      const taskElements = Array.from(tasksContainerRef.current.querySelectorAll(".task-card"))

      let closestIndex = -1
      let closestDistance = Number.MAX_VALUE

      taskElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect()
        const taskMiddle = rect.top + rect.height / 2 - containerRect.top
        const distance = Math.abs(mouseY - taskMiddle)

        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      // Si el cursor está más cerca de la parte inferior de la tarea, incrementar el índice
      if (closestIndex >= 0) {
        const closestRect = taskElements[closestIndex].getBoundingClientRect()
        const taskMiddle = closestRect.top + closestRect.height / 2 - containerRect.top

        if (mouseY > taskMiddle && closestIndex < tasks.length - 1) {
          closestIndex++
        }
      }

      setDragOverIndex(mouseY < 10 ? 0 : closestIndex)
    } else {
      // Si no hay tareas, el índice es 0
      setDragOverIndex(0)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("taskId")
    const sourceStatus = e.dataTransfer.getData("sourceStatus")
    const sourceIndex = Number.parseInt(e.dataTransfer.getData("sourceIndex"))

    if (taskId) {
      if (sourceStatus === status) {
        // Reordenar dentro de la misma columna
        if (dragOverIndex !== null && sourceIndex !== dragOverIndex) {
          reorderTasks(status, sourceIndex, dragOverIndex)
        }
      } else {
        // Mover a otra columna con posición específica
        moveTask(taskId, status, dragOverIndex !== null ? dragOverIndex : tasks.length)
      }
    }

    setDragOverIndex(null)
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl overflow-hidden task-column h-auto w-full border border-white/20 dark:border-gray-800/20 shadow-lg",
        `border-t-4 ${getColumnColor()}`,
      )}
    >
      <div className={cn("flex items-center justify-between p-4 bg-gradient-to-b z-10 relative", getColumnGradient())}>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="font-semibold">{title}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        {/* Botón de añadir eliminado */}
      </div>
      <div
        ref={tasksContainerRef}
        className="flex-1 overflow-auto p-4 max-h-[calc(100vh-220px)] min-h-[200px]"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-status={status}
      >
        {tasks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed p-4 glass">
            <p className="text-sm text-muted-foreground">No hay tareas en esta columna</p>
            {/* Modificar el botón de añadir para que sea perfectamente redondo */}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 rounded-full add-button"
              onClick={() => setIsTaskDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir tarea
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {tasks.map((task, index) => (
              <div key={task.id} className="relative">
                {dragOverIndex === index && (
                  <div className="absolute inset-x-0 -top-2 h-0.5 bg-primary rounded-full animate-pulse" />
                )}
                <TaskCard task={task} index={index} />
                {dragOverIndex === tasks.length && index === tasks.length - 1 && (
                  <div className="absolute inset-x-0 -bottom-2 h-0.5 bg-primary rounded-full animate-pulse" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <TaskDialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen} defaultValues={{ status }} />
    </div>
  )
}
