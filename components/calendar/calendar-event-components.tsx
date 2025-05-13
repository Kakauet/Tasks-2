"use client"

import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { Event, Task, TaskTag } from "@/context/task-context"

// UI Components
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { TagBadge } from "@/components/ui/tag-badge"

// Icons
import { CalendarDays, Clock, Trash2 } from "lucide-react"

/**
 * Componente para renderizar un evento de un solo día
 */
export function SingleDayEvent({ event, onEdit }: { event: Event; onEdit: (event: Event) => void }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="text-xs p-1 rounded-sm border truncate calendar-event"
            style={{
              backgroundColor: `${event.color || "#3b82f6"}20`,
              borderColor: `${event.color || "#3b82f6"}40`,
              borderLeftColor: event.isGraded ? "#ef4444" : event.color || "#3b82f6",
              borderLeftWidth: "2px",
              color: event.color || "#3b82f6",
            }}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("eventId", event.id)
              e.currentTarget.classList.add("opacity-50")
            }}
            onDragEnd={(e) => {
              e.currentTarget.classList.remove("opacity-50")
            }}
            onClick={(e) => {
              e.stopPropagation()
              onEdit(event)
            }}
          >
            {event.startTime && !event.isAllDay && <span className="mr-1 opacity-80">{event.startTime}</span>}
            {event.title}
            {event.recurrence && <span className="ml-1 opacity-80">↻</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="glass">
          <div className="text-xs space-y-1">
            <p className="font-bold">{event.title}</p>
            {event.startTime && !event.isAllDay && (
              <p>
                {event.startTime} - {event.endTime || "?"}
              </p>
            )}
            {event.isAllDay && <p>Todo el día</p>}
            {event.description && <p>{event.description}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Componente para renderizar un evento de varios días
 */
export function MultiDayEvent({
  event,
  position,
  onEdit,
}: {
  event: Event
  position: "start" | "middle" | "end" | null
  onEdit: (event: Event) => void
}) {
  return (
    <div
      className={cn(
        "text-xs p-1 truncate text-white calendar-event multi-day-event",
        position === "start"
          ? "multi-day-event-start rounded-l-md"
          : position === "end"
            ? "multi-day-event-end rounded-r-md"
            : "multi-day-event-middle",
      )}
      style={{
        backgroundColor: event.color || "#3b82f6",
        opacity: 0.9,
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
        marginLeft: position === "middle" || position === "end" ? "-1px" : "0",
        marginRight: position === "middle" || position === "start" ? "-1px" : "0",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: position === "middle" ? `${event.color || "#3b82f6"}80` : `${event.color || "#3b82f6"}`,
        borderLeftWidth: position === "middle" || position === "end" ? "0" : "1px",
        borderRightWidth: position === "middle" || position === "start" ? "0" : "1px",
        zIndex: position === "start" ? 2 : position === "end" ? 2 : 1,
      }}
      draggable={position === "start"}
      onDragStart={(e) => {
        if (position === "start") {
          e.dataTransfer.setData("eventId", event.id)
          e.currentTarget.classList.add("opacity-50")
        }
      }}
      onDragEnd={(e) => {
        e.currentTarget.classList.remove("opacity-50")
      }}
      onClick={(e) => {
        e.stopPropagation()
        onEdit(event)
      }}
    >
      {position === "start" && (
        <>
          <CalendarDays className="inline-block h-3 w-3 mr-1" />
          {event.title}
        </>
      )}
      {position === "middle" && <span className="opacity-0">.</span>}
      {position === "end" && <span className="opacity-0">.</span>}
    </div>
  )
}

/**
 * Componente para renderizar una tarea en el calendario
 */
export function TaskItem({ task }: { task: Task }) {
  return (
    <div
      className="text-xs p-1 rounded-sm bg-green-500/10 border border-green-500/20 truncate calendar-event"
      style={{
        borderLeftColor: task.priority === "high" ? "#ef4444" : task.priority === "medium" ? "#f59e0b" : "#10b981",
        borderLeftWidth: "2px",
      }}
    >
      {task.title}
    </div>
  )
}

/**
 * Componente para renderizar el detalle de un evento
 */
export function EventDetail({
  event,
  tags,
  onEdit,
  onDelete,
}: {
  event: Event
  tags: TaskTag[]
  onEdit: (event: Event) => void
  onDelete: (eventId: string) => void
}) {
  const eventTags = event.tags ? tags.filter((tag) => event.tags.includes(tag.id)) : []

  return (
    <div
      className="rounded-md border p-3 hover:bg-muted/50 cursor-pointer card-hover-effect glass calendar-event-clickable"
      onClick={() => onEdit(event)}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium" style={{ color: event.color || "#3b82f6" }}>
            {event.title}
          </h4>
          {event.isMultiDay && event.endDate && (
            <div className="text-xs flex items-center text-muted-foreground mt-1">
              <CalendarDays className="h-3 w-3 mr-1" />
              <span>
                {format(parseISO(event.date), "d MMM", { locale: es })} -
                {format(parseISO(event.endDate), "d MMM", { locale: es })}
              </span>
            </div>
          )}
          {event.startTime && !event.isAllDay && (
            <div className="text-xs flex items-center text-muted-foreground mt-1">
              <Clock className="h-3 w-3 mr-1" />
              <span>
                {event.startTime} - {event.endTime || "?"}
              </span>
            </div>
          )}
          {event.isAllDay && <div className="text-xs text-muted-foreground mt-1">Todo el día</div>}
          {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
          {event.recurrence && (
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <span className="mr-1">↻</span>
              {event.recurrence.type === "daily" && "Repetición diaria"}
              {event.recurrence.type === "weekly" && "Repetición semanal"}
              {event.recurrence.type === "monthly" && "Repetición mensual"}
              {event.recurrence.type === "yearly" && "Repetición anual"}
            </div>
          )}
          {eventTags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {eventTags.map((tag) => (
                <TagBadge key={tag.id} id={tag.id} name={tag.name} color={tag.color} size="sm" />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-start">
          {event.isGraded && (
            <Badge variant="outline" className="ml-2">
              {event.grade ? `Nota: ${event.grade}` : "Sin calificar"}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 ml-1"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(event.id)
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Componente para renderizar el detalle de una tarea
 */
export function TaskDetail({ task, tags }: { task: Task; tags: TaskTag[] }) {
  const taskTags = task.tags ? tags.filter((tag) => task.tags.includes(tag.id)) : []

  return (
    <div className="rounded-md border p-3 hover:bg-muted/50 glass card-hover-effect">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">{task.title}</h4>
          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
          {taskTags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {taskTags.map((tag) => (
                <TagBadge key={tag.id} id={tag.id} name={tag.name} color={tag.color} size="sm" />
              ))}
            </div>
          )}
        </div>
        <Badge
          variant={task.status === "done" ? "default" : task.status === "inProgress" ? "secondary" : "outline"}
          className="ml-2"
        >
          {task.status === "todo" ? "Por hacer" : task.status === "inProgress" ? "En progreso" : "Completada"}
        </Badge>
      </div>
    </div>
  )
}
