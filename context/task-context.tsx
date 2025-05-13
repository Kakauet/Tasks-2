"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"
import { addDays, format, parseISO, addWeeks, addMonths, addYears, isBefore, isAfter, isSameDay } from "date-fns"

// Tipos y interfaces
export type TaskStatus = "todo" | "inProgress" | "done"
export type TaskPriority = "low" | "medium" | "high"
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly"

export interface TaskStep {
  id: string
  text: string
  completed: boolean
}

export interface TaskTag {
  id: string
  name: string
  color: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  steps: TaskStep[]
  tags: string[] // IDs de tags
  createdAt: string
  updatedAt: string
}

export interface EventRecurrence {
  type: RecurrenceType
  interval: number // Cada cuántos días/semanas/meses/años
  endDate?: string // Fecha de finalización opcional
  occurrences?: number // Número de ocurrencias opcional
}

export interface Event {
  id: string
  title: string
  description: string
  date: string // Fecha de inicio
  endDate?: string // Fecha de fin para eventos de varios días
  startTime?: string // Add start time
  endTime?: string // Add end time
  isAllDay?: boolean // Add all-day flag
  isMultiDay?: boolean // Flag para eventos de varios días
  isGraded: boolean
  grade?: string
  tags: string[] // IDs of tags
  recurrence?: EventRecurrence
  parentEventId?: string // Para eventos recurrentes generados
  color?: string // Color personalizado para el evento
}

// Define the application state type
export interface AppState {
  tasks: Task[]
  events: Event[]
  tags: TaskTag[]
}

// Interfaz del contexto
interface TaskContextType {
  tasks: Task[]
  events: Event[]
  tags: TaskTag[]
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void
  updateTask: (id: string, task: Partial<Task>) => void
  deleteTask: (id: string) => void
  addEvent: (event: Omit<Event, "id">) => void
  updateEvent: (id: string, event: Partial<Event>) => void
  deleteEvent: (id: string) => void
  addTag: (tag: Omit<TaskTag, "id">) => void
  updateTag: (id: string, tag: Partial<TaskTag>) => void
  deleteTag: (id: string) => void
  moveTask: (id: string, status: TaskStatus, targetIndex?: number) => void
  reorderTasks: (status: TaskStatus, sourceIndex: number, targetIndex: number) => void
  moveEvent: (id: string, newDate: string) => void
  addStep: (taskId: string, step: Omit<TaskStep, "id">) => void
  updateStep: (taskId: string, stepId: string, step: Partial<TaskStep>) => void
  deleteStep: (taskId: string, stepId: string) => void
  addTagToTask: (taskId: string, tagId: string) => void
  removeTagFromTask: (taskId: string, tagId: string) => void
  getEventsForDateRange: (startDate: Date, endDate: Date) => Event[]
  getEventsForDate: (date: Date) => Event[]
  reorderSteps: (taskId: string, sourceIndex: number, targetIndex: number) => void
  // Add undo/redo functionality
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

// Funciones auxiliares
const generateRecurringEvents = (baseEvent: Omit<Event, "id">, recurrence: EventRecurrence): Event[] => {
  if (recurrence.type === "none") {
    return []
  }

  const recurringEvents: Event[] = []
  const startDate = parseISO(baseEvent.date)
  let currentDate = startDate
  let occurrenceCount = 0
  const maxOccurrences = recurrence.occurrences || 10 // Limitar a 10 por defecto si no se especifica
  const endDate = recurrence.endDate ? parseISO(recurrence.endDate) : addYears(startDate, 1) // Limitar a 1 año por defecto

  // Calcular la duración del evento en días si es un evento de varios días
  let eventDuration = 0
  if (baseEvent.isMultiDay && baseEvent.endDate) {
    const eventEndDate = parseISO(baseEvent.endDate)
    // Calcular la diferencia en días
    eventDuration = Math.ceil((eventEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Generar eventos recurrentes hasta alcanzar el límite de ocurrencias o la fecha de finalización
  while (occurrenceCount < maxOccurrences && currentDate <= endDate) {
    // Saltar la primera ocurrencia ya que es el evento base
    if (occurrenceCount > 0) {
      const eventDate = format(currentDate, "yyyy-MM-dd")

      // Calcular la fecha de finalización para eventos de varios días
      let eventEndDate: string | undefined = undefined
      if (baseEvent.isMultiDay && eventDuration > 0) {
        eventEndDate = format(addDays(currentDate, eventDuration), "yyyy-MM-dd")
      }

      const newEvent: Event = {
        ...baseEvent,
        id: uuidv4(),
        date: eventDate,
        endDate: eventEndDate,
        parentEventId: baseEvent.id, // Referencia al evento padre
      }
      recurringEvents.push(newEvent)
    }

    // Calcular la siguiente fecha según el tipo de recurrencia
    switch (recurrence.type) {
      case "daily":
        currentDate = addDays(currentDate, recurrence.interval)
        break
      case "weekly":
        currentDate = addWeeks(currentDate, recurrence.interval)
        break
      case "monthly":
        currentDate = addMonths(currentDate, recurrence.interval)
        break
      case "yearly":
        currentDate = addYears(currentDate, recurrence.interval)
        break
    }

    occurrenceCount++
  }

  return recurringEvents
}

export function TaskProvider({ children }: { children: ReactNode }) {
  // Estado de historial para undo/redo
  const [past, setPast] = useState<AppState[]>([])
  const [present, setPresent] = useState<AppState>({
    tasks: [],
    events: [],
    tags: [],
  })
  const [future, setFuture] = useState<AppState[]>([])

  // Estados derivados
  const canUndo = past.length > 0
  const canRedo = future.length > 0

  // Extraer estado actual
  const { tasks, events, tags } = present

  // Cargar datos de localStorage al iniciar
  useEffect(() => {
    const loadInitialState = () => {
      const savedTasks = localStorage.getItem("tasks")
      const savedEvents = localStorage.getItem("events")
      const savedTags = localStorage.getItem("tags")

      const initialState: AppState = {
        tasks: savedTasks ? JSON.parse(savedTasks) : [],
        events: savedEvents ? JSON.parse(savedEvents) : [],
        tags: savedTags ? JSON.parse(savedTags) : [],
      }

      // Si no hay etiquetas, crear etiquetas por defecto
      if (!savedTags) {
        initialState.tags = [
          { id: uuidv4(), name: "Trabajo", color: "#3b82f6" },
          { id: uuidv4(), name: "Personal", color: "#10b981" },
          { id: uuidv4(), name: "Urgente", color: "#ef4444" },
          { id: uuidv4(), name: "Estudio", color: "#8b5cf6" },
        ]
      }

      setPresent(initialState)
    }

    loadInitialState()
  }, [])

  // Guardar datos en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks))
    localStorage.setItem("events", JSON.stringify(events))
    localStorage.setItem("tags", JSON.stringify(tags))
  }, [tasks, events, tags])

  // Configurar atajos de teclado para undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Solo activar si no hay input o textarea enfocado
      const activeElement = document.activeElement
      const isInputActive =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true"

      if (isInputActive) return

      // Ctrl+Z: Undo
      if (e.ctrlKey && !e.shiftKey && e.key === "z") {
        e.preventDefault()
        if (canUndo) undo()
      }

      // Ctrl+Shift+Z o Ctrl+Y: Redo
      if ((e.ctrlKey && e.shiftKey && e.key === "z") || (e.ctrlKey && e.key === "y")) {
        e.preventDefault()
        if (canRedo) redo()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [canUndo, canRedo])

  // Registrar un cambio de estado
  const recordChange = useCallback(
    (newState: AppState) => {
      // No registrar si el estado no ha cambiado
      if (JSON.stringify(present) === JSON.stringify(newState)) {
        return
      }

      setPast((prev) => [...prev, present])
      setPresent(newState)
      setFuture([]) // Limpiar el futuro cuando se hace un nuevo cambio
    },
    [present],
  )

  // Deshacer el último cambio
  const undo = useCallback(() => {
    if (past.length === 0) return

    const previous = past[past.length - 1]
    const newPast = past.slice(0, -1)

    setFuture([present, ...future])
    setPresent(previous)
    setPast(newPast)
  }, [past, present, future])

  // Rehacer un cambio previamente deshecho
  const redo = useCallback(() => {
    if (future.length === 0) return

    const next = future[0]
    const newFuture = future.slice(1)

    setPast([...past, present])
    setPresent(next)
    setFuture(newFuture)
  }, [past, present, future])

  // Función auxiliar para crear un nuevo objeto de estado
  const createNewState = useCallback(
    (updates: Partial<AppState>): AppState => {
      return {
        tasks: updates.tasks !== undefined ? updates.tasks : tasks,
        events: updates.events !== undefined ? updates.events : events,
        tags: updates.tags !== undefined ? updates.tags : tags,
      }
    },
    [tasks, events, tags],
  )

  // Funciones de gestión de tareas
  const addTask = useCallback(
    (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString()
      const newTask: Task = {
        ...task,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      }

      const newTasks = [...tasks, newTask]
      recordChange(createNewState({ tasks: newTasks }))
    },
    [tasks, recordChange, createNewState],
  )

  const updateTask = useCallback(
    (id: string, task: Partial<Task>) => {
      const newTasks = tasks.map((t) => (t.id === id ? { ...t, ...task, updatedAt: new Date().toISOString() } : t))
      recordChange(createNewState({ tasks: newTasks }))
    },
    [tasks, recordChange, createNewState],
  )

  const deleteTask = useCallback(
    (id: string) => {
      const newTasks = tasks.filter((t) => t.id !== id)
      recordChange(createNewState({ tasks: newTasks }))
    },
    [tasks, recordChange, createNewState],
  )

  // Funciones de gestión de eventos
  const addEvent = useCallback(
    (event: Omit<Event, "id">) => {
      const eventId = uuidv4()
      const newEvent: Event = {
        ...event,
        id: eventId,
      }

      let newEvents = [...events, newEvent]

      // Si el evento tiene recurrencia, generar los eventos recurrentes
      if (event.recurrence && event.recurrence.type !== "none") {
        const recurringEvents = generateRecurringEvents({ ...newEvent, id: eventId }, event.recurrence)
        if (recurringEvents.length > 0) {
          newEvents = [...newEvents, ...recurringEvents]
        }
      }

      recordChange(createNewState({ events: newEvents }))
    },
    [events, recordChange, createNewState],
  )

  const updateEvent = useCallback(
    (id: string, event: Partial<Event>) => {
      // Primero, filtrar cualquier evento recurrente asociado con este evento
      const filteredEvents = events.filter((e) => e.parentEventId !== id)

      // Actualizar el evento principal
      const updatedEvents = filteredEvents.map((e) => (e.id === id ? { ...e, ...event } : e))

      // Si estamos actualizando la recurrencia, regenerar los eventos recurrentes
      if (event.recurrence) {
        const updatedEvent = updatedEvents.find((e) => e.id === id)
        if (updatedEvent && event.recurrence.type !== "none") {
          // Generar nuevos eventos recurrentes
          const recurringEvents = generateRecurringEvents(updatedEvent, event.recurrence as EventRecurrence)
          if (recurringEvents.length > 0) {
            updatedEvents.push(...recurringEvents)
          }
        }
      }

      recordChange(createNewState({ events: updatedEvents }))
    },
    [events, recordChange, createNewState],
  )

  const deleteEvent = useCallback(
    (id: string) => {
      // Eliminar el evento principal y todas sus instancias recurrentes
      const newEvents = events.filter((e) => e.id !== id && e.parentEventId !== id)
      recordChange(createNewState({ events: newEvents }))
    },
    [events, recordChange, createNewState],
  )

  // Funciones de gestión de etiquetas
  const addTag = useCallback(
    (tag: Omit<TaskTag, "id">) => {
      const newTag: TaskTag = {
        ...tag,
        id: uuidv4(),
      }
      const newTags = [...tags, newTag]
      recordChange(createNewState({ tags: newTags }))
    },
    [tags, recordChange, createNewState],
  )

  const updateTag = useCallback(
    (id: string, tag: Partial<TaskTag>) => {
      const newTags = tags.map((t) => (t.id === id ? { ...t, ...tag } : t))
      recordChange(createNewState({ tags: newTags }))
    },
    [tags, recordChange, createNewState],
  )

  const deleteTag = useCallback(
    (id: string) => {
      // Eliminar etiqueta de todas las tareas
      const newTasks = tasks.map((task) => ({
        ...task,
        tags: task.tags.filter((tagId) => tagId !== id),
      }))

      // Eliminar etiqueta de todos los eventos
      const newEvents = events.map((event) => ({
        ...event,
        tags: event.tags.filter((tagId) => tagId !== id),
      }))

      // Eliminar la etiqueta en sí
      const newTags = tags.filter((t) => t.id !== id)

      recordChange(
        createNewState({
          tasks: newTasks,
          events: newEvents,
          tags: newTags,
        }),
      )
    },
    [tasks, events, tags, recordChange, createNewState],
  )

  // Funciones de movimiento y reordenamiento
  const moveTask = useCallback(
    (id: string, status: TaskStatus, targetIndex?: number) => {
      const taskToMove = tasks.find((t) => t.id === id)
      if (!taskToMove) return

      // Eliminar la tarea de su posición actual
      const remainingTasks = tasks.filter((t) => t.id !== id)

      // Crear una copia de la tarea con el nuevo estado
      const updatedTask = {
        ...taskToMove,
        status,
        updatedAt: new Date().toISOString(),
      }

      // Si no se especifica un índice de destino, añadir al final
      if (targetIndex === undefined) {
        recordChange(createNewState({ tasks: [...remainingTasks, updatedTask] }))
        return
      }

      // Obtener tareas en el estado de destino
      const tasksInTargetStatus = remainingTasks.filter((t) => t.status === status)

      // Asegurar que el índice de destino sea válido
      const validTargetIndex = Math.max(0, Math.min(targetIndex, tasksInTargetStatus.length))

      // Insertar la tarea en la posición correcta
      const result = [...remainingTasks]
      const insertIndex = remainingTasks.findIndex((t) => t.status === status) + validTargetIndex
      result.splice(insertIndex, 0, updatedTask)

      recordChange(createNewState({ tasks: result }))
    },
    [tasks, recordChange, createNewState],
  )

  const reorderTasks = useCallback(
    (status: TaskStatus, sourceIndex: number, targetIndex: number) => {
      // Obtener tareas del estado específico
      const tasksInStatus = tasks.filter((t) => t.status === status)

      // Asegurar que los índices sean válidos
      if (
        sourceIndex < 0 ||
        sourceIndex >= tasksInStatus.length ||
        targetIndex < 0 ||
        targetIndex >= tasksInStatus.length
      ) {
        return
      }

      // Crear una copia de las tareas en ese estado
      const reorderedTasks = [...tasksInStatus]

      // Mover la tarea de la posición de origen a la de destino
      const [movedTask] = reorderedTasks.splice(sourceIndex, 1)
      reorderedTasks.splice(targetIndex, 0, movedTask)

      // Reemplazar las tareas del estado específico en la lista completa
      const newTasks = [...tasks.filter((t) => t.status !== status), ...reorderedTasks]

      recordChange(createNewState({ tasks: newTasks }))
    },
    [tasks, recordChange, createNewState],
  )

  const moveEvent = useCallback(
    (id: string, newDate: string) => {
      // Encontrar el evento a mover
      const eventToMove = events.find((e) => e.id === id)
      if (!eventToMove) return

      let newEvents = [...events]

      // Si es un evento hijo recurrente, solo mover este evento específico
      if (eventToMove.parentEventId) {
        newEvents = events.map((e) => (e.id === id ? { ...e, date: newDate } : e))
      } else {
        // Si es un evento de varios días, calcular la nueva fecha de fin
        let newEndDate = eventToMove.endDate
        if (eventToMove.isMultiDay && eventToMove.endDate) {
          const startDate = parseISO(eventToMove.date)
          const endDate = parseISO(eventToMove.endDate)
          const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

          // Calcular la nueva fecha de fin manteniendo la misma duración
          newEndDate = format(addDays(parseISO(newDate), duration), "yyyy-MM-dd")
        }

        // Actualizar el evento
        newEvents = events.map((e) => (e.id === id ? { ...e, date: newDate, endDate: newEndDate } : e))
      }

      recordChange(createNewState({ events: newEvents }))
    },
    [events, recordChange, createNewState],
  )

  // Funciones de gestión de pasos
  const addStep = useCallback(
    (taskId: string, step: Omit<TaskStep, "id">) => {
      const newTasks = tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              steps: [...t.steps, { ...step, id: uuidv4() }],
              updatedAt: new Date().toISOString(),
            }
          : t,
      )

      recordChange(createNewState({ tasks: newTasks }))
    },
    [tasks, recordChange, createNewState],
  )

  const updateStep = useCallback(
    (taskId: string, stepId: string, step: Partial<TaskStep>) => {
      const newTasks = tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              steps: t.steps.map((s) => (s.id === stepId ? { ...s, ...step } : s)),
              updatedAt: new Date().toISOString(),
            }
          : t,
      )

      recordChange(createNewState({ tasks: newTasks }))
    },
    [tasks, recordChange, createNewState],
  )

  const deleteStep = useCallback(
    (taskId: string, stepId: string) => {
      const newTasks = tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              steps: t.steps.filter((s) => s.id !== stepId),
              updatedAt: new Date().toISOString(),
            }
          : t,
      )

      recordChange(createNewState({ tasks: newTasks }))
    },
    [tasks, recordChange, createNewState],
  )

  const reorderSteps = useCallback(
    (taskId: string, sourceIndex: number, targetIndex: number) => {
      const newTasks = tasks.map((t) => {
        if (t.id === taskId) {
          const steps = [...t.steps]
          const [movedStep] = steps.splice(sourceIndex, 1)
          steps.splice(targetIndex, 0, movedStep)
          return {
            ...t,
            steps,
            updatedAt: new Date().toISOString(),
          }
        }
        return t
      })

      recordChange(createNewState({ tasks: newTasks }))
    },
    [tasks, recordChange, createNewState],
  )

  // Funciones de gestión de etiquetas en tareas
  const addTagToTask = useCallback(
    (taskId: string, tagId: string) => {
      const newTasks = tasks.map((t) =>
        t.id === taskId && !t.tags.includes(tagId)
          ? {
              ...t,
              tags: [...t.tags, tagId],
              updatedAt: new Date().toISOString(),
            }
          : t,
      )

      recordChange(createNewState({ tasks: newTasks }))
    },
    [tasks, recordChange, createNewState],
  )

  const removeTagFromTask = useCallback(
    (taskId: string, tagId: string) => {
      const newTasks = tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              tags: t.tags.filter((id) => id !== tagId),
              updatedAt: new Date().toISOString(),
            }
          : t,
      )

      recordChange(createNewState({ tasks: newTasks }))
    },
    [tasks, recordChange, createNewState],
  )

  // Funciones de consulta de eventos
  const getEventsForDateRange = useCallback(
    (startDate: Date, endDate: Date): Event[] => {
      return events.filter((event) => {
        const eventStartDate = parseISO(event.date)

        // Para eventos de un solo día
        if (!event.isMultiDay || !event.endDate) {
          return eventStartDate >= startDate && eventStartDate <= endDate
        }

        // Para eventos de varios días
        const eventEndDate = parseISO(event.endDate)

        // El evento está en el rango si:
        // 1. La fecha de inicio está dentro del rango, o
        // 2. La fecha de fin está dentro del rango, o
        // 3. El evento abarca todo el rango (empieza antes y termina después)
        return (
          (eventStartDate >= startDate && eventStartDate <= endDate) ||
          (eventEndDate >= startDate && eventEndDate <= endDate) ||
          (eventStartDate <= startDate && eventEndDate >= endDate)
        )
      })
    },
    [events],
  )

  const getEventsForDate = useCallback(
    (date: Date): Event[] => {
      return events.filter((event) => {
        // Para eventos de un solo día
        if (!event.isMultiDay || !event.endDate) {
          return isSameDay(parseISO(event.date), date)
        }

        // Para eventos de varios días
        const eventStartDate = parseISO(event.date)
        const eventEndDate = parseISO(event.endDate)

        // El evento está en esta fecha si la fecha está entre la fecha de inicio y fin (inclusive)
        return (
          (isSameDay(eventStartDate, date) || isAfter(date, eventStartDate)) &&
          (isSameDay(eventEndDate, date) || isBefore(date, eventEndDate))
        )
      })
    },
    [events],
  )

  // Valor del contexto
  const contextValue: TaskContextType = {
    tasks,
    events,
    tags,
    addTask,
    updateTask,
    deleteTask,
    addEvent,
    updateEvent,
    deleteEvent,
    addTag,
    updateTag,
    deleteTag,
    moveTask,
    reorderTasks,
    moveEvent,
    addStep,
    updateStep,
    deleteStep,
    addTagToTask,
    removeTagFromTask,
    getEventsForDateRange,
    getEventsForDate,
    reorderSteps,
    canUndo,
    canRedo,
    undo,
    redo,
  }

  return <TaskContext.Provider value={contextValue}>{children}</TaskContext.Provider>
}

export function useTaskContext() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider")
  }
  return context
}
