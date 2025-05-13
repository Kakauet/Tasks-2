"use client"

import { useState, useEffect, useCallback } from "react"
import { useTaskContext } from "@/context/task-context"
import { format, isSameMonth, isSameDay, isToday, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

// Hooks personalizados
import { useCalendar } from "@/hooks/use-calendar"
import { useDialogState } from "@/hooks/use-dialog-state"

// UI Components
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

// Custom Components
import { EventDialog } from "@/components/event-dialog"
import {
  SingleDayEvent,
  MultiDayEvent,
  TaskItem,
  EventDetail,
  TaskDetail,
} from "@/components/calendar/calendar-event-components"

// Icons
import { CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react"

// Define the Task type
interface Task {
  id: string
  title: string
  description?: string
  dueDate?: string
  priority?: "high" | "medium" | "low"
  completed?: boolean
  tags?: string[]
}

export function CalendarView() {
  const { events, tasks, tags, moveEvent, deleteEvent, getEventsForDate, getEventsForDateRange } = useTaskContext()

  // Estado de diálogos
  const eventDialog = useDialogState(false)
  const deleteDialog = useDialogState(false)

  // Estado adicional
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)

  // Hook de calendario
  const {
    currentDate,
    selectedDate,
    setSelectedDate,
    view,
    setView,
    calendarDays,
    weekDays,
    goToToday,
    prevMonth,
    nextMonth,
    prevWeek,
    nextWeek,
    isSunday,
    getMultiDayPosition,
    selectedDateEvents,
  } = useCalendar(getEventsForDate)

  // Obtener tareas para una fecha específica
  const getTasksForDate = useCallback(
    (date: Date): Task[] => {
      return tasks.filter((task) => task.dueDate && isSameDay(parseISO(task.dueDate), date))
    },
    [tasks],
  )

  // Tareas para la fecha seleccionada
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : []

  // Efecto para manejar el evento goToToday
  useEffect(() => {
    const handleGoToToday = () => {
      goToToday()
    }

    window.addEventListener("goToToday", handleGoToToday)
    return () => window.removeEventListener("goToToday", handleGoToToday)
  }, [goToToday])

  // Handlers para eventos
  const handleEditEvent = useCallback(
    (event: Event) => {
      setEditingEvent(event)
      eventDialog.open()
    },
    [eventDialog],
  )

  const handleDeleteEvent = useCallback(() => {
    if (eventToDelete) {
      deleteDialog.startProcessing()
      deleteEvent(eventToDelete)
      setTimeout(() => {
        setEventToDelete(null)
        deleteDialog.endProcessing()
      }, 100)
    }
  }, [eventToDelete, deleteEvent, deleteDialog])

  const handleCreateEvent = useCallback(() => {
    if (!selectedDate) {
      setSelectedDate(new Date())
    }
    setEditingEvent(null)
    eventDialog.open()
  }, [selectedDate, setSelectedDate, eventDialog])

  // Renderizado de la vista mensual
  const renderMonthView = useCallback(() => {
    return (
      <div className="calendar-grid">
        {/* Cabecera de días de la semana */}
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day, index) => (
          <div
            key={index}
            className={cn(
              "calendar-day-header",
              index === 6 && "text-red-500 font-medium", // Destacar el domingo en la cabecera
            )}
          >
            {day}
          </div>
        ))}

        {/* Días del mes */}
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDate(day)
          const dayTasks = getTasksForDate(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
          const isDomingo = isSunday(day)

          // Agrupar eventos de varios días
          const multiDayEvents = dayEvents.filter((event) => event.isMultiDay && event.endDate)
          const singleDayEvents = dayEvents.filter((event) => !event.isMultiDay || !event.endDate)

          return (
            <div
              key={index}
              className={cn(
                "min-h-[120px] transition-colors calendar-day-modern",
                isCurrentMonth ? "bg-card/50 backdrop-blur-sm" : "bg-muted/30",
                isToday(day) && "today",
                isSelected && "border-primary bg-primary/10 ring-2 ring-primary/30",
                isDomingo && "bg-red-50/30 dark:bg-red-900/10", // Fondo especial para domingos
                "hover:bg-muted/50 cursor-pointer",
              )}
              onClick={() => setSelectedDate(day)}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add("border-dashed", "border-primary")
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("border-dashed", "border-primary")
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove("border-dashed", "border-primary")
                const eventId = e.dataTransfer.getData("eventId")
                if (eventId) {
                  moveEvent(eventId, format(day, "yyyy-MM-dd"))
                }
              }}
              data-date={format(day, "yyyy-MM-dd")}
            >
              <div className="flex justify-between items-start">
                <span
                  className={cn(
                    "text-sm font-medium",
                    !isCurrentMonth && "text-muted-foreground",
                    isDomingo && "text-red-500", // Texto rojo para los números de los domingos
                  )}
                >
                  {format(day, "d")}
                </span>
                {isToday(day) && <span className="inline-block w-2 h-2 rounded-full bg-primary" />}
              </div>

              <div className="mt-1 space-y-1">
                {/* Eventos de varios días */}
                {multiDayEvents.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {multiDayEvents.slice(0, 2).map((event) => {
                      const position = getMultiDayPosition(event, day)
                      return <MultiDayEvent key={event.id} event={event} position={position} onEdit={handleEditEvent} />
                    })}
                    {multiDayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{multiDayEvents.length - 2} más</div>
                    )}
                  </div>
                )}

                {/* Eventos de un solo día */}
                {singleDayEvents.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {singleDayEvents.slice(0, 2).map((event) => (
                      <SingleDayEvent key={event.id} event={event} onEdit={handleEditEvent} />
                    ))}
                    {singleDayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{singleDayEvents.length - 2} más</div>
                    )}
                  </div>
                )}

                {/* Tareas */}
                {dayTasks.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {dayTasks.slice(0, 2).map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{dayTasks.length - 2} más</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }, [
    calendarDays,
    currentDate,
    selectedDate,
    getEventsForDate,
    getTasksForDate,
    isSunday,
    getMultiDayPosition,
    handleEditEvent,
    moveEvent,
    setSelectedDate,
  ])

  // Renderizado de la vista semanal
  const renderWeekView = useCallback(() => {
    return (
      <div className="grid grid-cols-1 gap-2">
        {weekDays.map((day, index) => {
          const dayEvents = getEventsForDate(day)
          const dayTasks = getTasksForDate(day)
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
          const isDomingo = isSunday(day)

          return (
            <div
              key={index}
              className={cn(
                "p-2 transition-colors calendar-day-modern",
                isToday(day) && "today",
                isSelected && "border-primary bg-primary/10",
                isDomingo && "bg-red-50/30 dark:bg-red-900/10", // Fondo especial para domingos en vista semanal
                "hover:bg-muted/50 cursor-pointer",
              )}
              onClick={() => setSelectedDate(day)}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add("border-dashed", "border-primary")
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("border-dashed", "border-primary")
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove("border-dashed", "border-primary")
                const eventId = e.dataTransfer.getData("eventId")
                if (eventId) {
                  moveEvent(eventId, format(day, "yyyy-MM-dd"))
                }
              }}
              data-date={format(day, "yyyy-MM-dd")}
            >
              <div className="flex justify-between items-center mb-2">
                <span
                  className={cn(
                    "font-medium",
                    isDomingo && "text-red-500", // Texto rojo para los domingos en vista semanal
                  )}
                >
                  {format(day, "EEEE d", { locale: es })}
                </span>
                {isToday(day) && (
                  <Badge variant="outline" className="border-primary text-primary">
                    Hoy
                  </Badge>
                )}
                {isDomingo && !isToday(day) && (
                  <Badge variant="outline" className="border-red-500 text-red-500">
                    Festivo
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                {/* Eventos */}
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-2 rounded-md calendar-event card-hover-effect"
                    style={{
                      backgroundColor: `${event.color || "#3b82f6"}15`,
                      borderLeft: `3px solid ${event.isGraded ? "#ef4444" : event.color || "#3b82f6"}`,
                    }}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("eventId", event.id)
                      e.currentTarget.classList.add("opacity-50")
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.classList.remove("opacity-50")
                    }}
                    onClick={() => handleEditEvent(event)}
                  >
                    <div className="font-medium flex items-center justify-between">
                      <span style={{ color: event.color || "#3b82f6" }}>{event.title}</span>
                    </div>
                    {event.isMultiDay && event.endDate && (
                      <div className="text-xs flex items-center text-muted-foreground mt-1">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        <span>
                          {format(parseISO(event.date), "d MMM", { locale: es })} -
                          {format(parseISO(event.endDate), "d MMM", { locale: es })}
                        </span>
                      </div>
                    )}
                    {event.startTime && !event.isAllDay && (
                      <div className="text-xs flex items-center text-muted-foreground mt-1">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        <span>
                          {event.startTime} - {event.endTime || "?"}
                        </span>
                      </div>
                    )}
                    {event.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1 mt-1">{event.description}</div>
                    )}
                    {event.recurrence && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center">
                        <span className="mr-1">↻</span>
                        {event.recurrence.type === "daily" && "Repetición diaria"}
                        {event.recurrence.type === "weekly" && "Repetición semanal"}
                        {event.recurrence.type === "monthly" && "Repetición mensual"}
                        {event.recurrence.type === "yearly" && "Repetición anual"}
                      </div>
                    )}
                  </div>
                ))}

                {/* Tareas */}
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-2 rounded-md bg-green-500/10 border border-green-500/20 card-hover-effect"
                    style={{
                      borderLeftColor:
                        task.priority === "high" ? "#ef4444" : task.priority === "medium" ? "#f59e0b" : "#10b981",
                      borderLeftWidth: "3px",
                    }}
                  >
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">{task.description}</div>
                    )}
                  </div>
                ))}

                {dayEvents.length === 0 && dayTasks.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No hay eventos ni tareas para este día
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }, [weekDays, selectedDate, getEventsForDate, getTasksForDate, isSunday, handleEditEvent, moveEvent, setSelectedDate])

  // Renderizado del panel lateral
  const renderSidebar = useCallback(() => {
    return (
      <Card className="glass-card">
        <CardHeader className="calendar-header py-3">
          <CardTitle className="flex items-center text-md font-medium">
            <CalendarIcon className="mr-2 h-5 w-5" />
            {selectedDate ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es }) : "Selecciona una fecha"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {!selectedDate ? (
            <p className="text-sm text-muted-foreground">
              Haz clic en una fecha del calendario para ver los eventos y tareas de ese día.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Eventos */}
              <div>
                <h3 className="mb-2 font-medium">Eventos</h3>
                {selectedDateEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay eventos para este día.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDateEvents.map((event) => (
                      <EventDetail
                        key={event.id}
                        event={event}
                        tags={tags}
                        onEdit={handleEditEvent}
                        onDelete={setEventToDelete}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Tareas */}
              <div>
                <h3 className="mb-2 font-medium">Tareas</h3>
                {selectedDateTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay tareas para este día.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDateTasks.map((task) => (
                      <TaskDetail key={task.id} task={task} tags={tags} />
                    ))}
                  </div>
                )}
              </div>

              {/* Botón para añadir evento */}
              <Button className="w-full btn-primary rounded-full" onClick={handleCreateEvent}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir evento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }, [selectedDate, selectedDateEvents, selectedDateTasks, tags, handleEditEvent, handleCreateEvent, setEventToDelete])

  return (
    <div className="flex flex-col gap-4 animate-in">
      <TooltipProvider>
        {/* Barra de herramientas */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday} className="rounded-full">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Hoy
            </Button>
            <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week")} className="mr-2">
              <TabsList className="rounded-full">
                <TabsTrigger value="month" className="rounded-full">
                  Mes
                </TabsTrigger>
                <TabsTrigger value="week" className="rounded-full">
                  Semana
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {view === "month" ? (
              <div className="flex gap-1">
                <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-full">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-full">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-1">
                <Button variant="outline" size="icon" onClick={prevWeek} className="rounded-full">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextWeek} className="rounded-full">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <Button onClick={handleCreateEvent} className="btn-primary rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Evento
          </Button>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {/* Calendario */}
          <Card className="col-span-1 lg:col-span-3 glass-card calendar-container">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 calendar-header">
              <CardTitle className="text-md font-medium">
                {view === "month"
                  ? format(currentDate, "MMMM yyyy", { locale: es })
                  : `Semana del ${format(weekDays[0], "d MMM", { locale: es })} al ${format(weekDays[6], "d MMM", { locale: es })}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">{view === "month" ? renderMonthView() : renderWeekView()}</CardContent>
          </Card>

          {/* Panel lateral */}
          {renderSidebar()}
        </div>

        {/* Diálogos */}
        <EventDialog
          open={eventDialog.isOpen}
          onOpenChange={eventDialog.setIsOpen}
          defaultValues={editingEvent || (selectedDate ? { date: format(selectedDate, "yyyy-MM-dd") } : undefined)}
          mode={editingEvent ? "edit" : "create"}
        />

        <ConfirmationDialog
          open={!!eventToDelete}
          onOpenChange={(open) => !open && !deleteDialog.isProcessing && setEventToDelete(null)}
          title="¿Estás seguro?"
          description="Esta acción eliminará el evento permanentemente."
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={handleDeleteEvent}
          isProcessing={deleteDialog.isProcessing}
          variant="destructive"
        />
      </TooltipProvider>
    </div>
  )
}
