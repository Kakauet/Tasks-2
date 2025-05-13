"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useTaskContext, type Event, type RecurrenceType } from "@/context/task-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, CalendarDays } from "lucide-react"
import { format, addDays, isBefore } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ColorPicker } from "@/components/color-picker"

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<Event>
  mode?: "create" | "edit"
}

// Recuperar colores personalizados del localStorage
const getCustomColors = (): string[] => {
  try {
    const savedColors = localStorage.getItem("custom-event-colors")
    return savedColors ? JSON.parse(savedColors) : []
  } catch (error) {
    console.error("Error loading custom colors:", error)
    return []
  }
}

// Guardar colores personalizados en localStorage
const saveCustomColor = (color: string) => {
  try {
    const currentColors = getCustomColors()
    if (!currentColors.includes(color)) {
      const updatedColors = [...currentColors, color]
      localStorage.setItem("custom-event-colors", JSON.stringify(updatedColors))
    }
  } catch (error) {
    console.error("Error saving custom color:", error)
  }
}

export function EventDialog({ open, onOpenChange, defaultValues, mode = "create" }: EventDialogProps) {
  const { addEvent, updateEvent, tags } = useTaskContext()

  const [title, setTitle] = useState(defaultValues?.title || "")
  const [description, setDescription] = useState(defaultValues?.description || "")
  const [date, setDate] = useState<Date | undefined>(defaultValues?.date ? new Date(defaultValues.date) : new Date())
  const [isMultiDay, setIsMultiDay] = useState(defaultValues?.isMultiDay || false)
  const [endDate, setEndDate] = useState<Date | undefined>(
    defaultValues?.endDate ? new Date(defaultValues.endDate) : addDays(new Date(), 1),
  )
  const [isAllDay, setIsAllDay] = useState(defaultValues?.isAllDay !== false)
  const [startTime, setStartTime] = useState(defaultValues?.startTime || "09:00")
  const [endTime, setEndTime] = useState(defaultValues?.endTime || "10:00")
  const [isGraded, setIsGraded] = useState(defaultValues?.isGraded || false)
  const [grade, setGrade] = useState(defaultValues?.grade || "")
  const [selectedTags, setSelectedTags] = useState<string[]>(defaultValues?.tags || [])
  const [eventColor, setEventColor] = useState(defaultValues?.color || "#3b82f6")
  const [customColors, setCustomColors] = useState<string[]>([])

  // Recurrence state
  const [recurrenceTab, setRecurrenceTab] = useState<"none" | "recurrence">(
    defaultValues?.recurrence?.type !== "none" && defaultValues?.recurrence ? "recurrence" : "none",
  )
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(defaultValues?.recurrence?.type || "none")
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(defaultValues?.recurrence?.interval || 1)
  const [recurrenceEndType, setRecurrenceEndType] = useState<"never" | "after" | "on">(
    defaultValues?.recurrence?.occurrences ? "after" : defaultValues?.recurrence?.endDate ? "on" : "never",
  )
  const [recurrenceOccurrences, setRecurrenceOccurrences] = useState<number>(
    defaultValues?.recurrence?.occurrences || 10,
  )
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(
    defaultValues?.recurrence?.endDate ? new Date(defaultValues.recurrence.endDate) : undefined,
  )

  // Dentro del componente EventDialog, añadir validación para fechas y horas
  const [timeError, setTimeError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Cargar colores personalizados al abrir el diálogo
  useEffect(() => {
    if (open) {
      setCustomColors(getCustomColors())
    }
  }, [open])

  // Add or modify this useEffect to ensure the date is reset correctly when the dialog opens
  useEffect(() => {
    if (open) {
      if (defaultValues) {
        setTitle(defaultValues.title || "")
        setDescription(defaultValues.description || "")
        // Ensure we're using the date from defaultValues if available
        setDate(defaultValues.date ? new Date(defaultValues.date) : new Date())
        setIsMultiDay(defaultValues.isMultiDay || false)
        setEndDate(defaultValues.endDate ? new Date(defaultValues.endDate) : addDays(new Date(), 1))
        setIsAllDay(defaultValues.isAllDay !== false)
        setStartTime(defaultValues.startTime || "09:00")
        setEndTime(defaultValues.endTime || "10:00")
        setIsGraded(defaultValues.isGraded || false)
        setGrade(defaultValues.grade || "")
        setSelectedTags(defaultValues.tags || [])
        setEventColor(defaultValues.color || "#3b82f6")

        // Set recurrence values
        setRecurrenceTab(defaultValues.recurrence?.type !== "none" && defaultValues.recurrence ? "recurrence" : "none")
        setRecurrenceType(defaultValues.recurrence?.type || "none")
        setRecurrenceInterval(defaultValues.recurrence?.interval || 1)
        setRecurrenceEndType(
          defaultValues.recurrence?.occurrences ? "after" : defaultValues.recurrence?.endDate ? "on" : "never",
        )
        setRecurrenceOccurrences(defaultValues.recurrence?.occurrences || 10)
        setRecurrenceEndDate(defaultValues.recurrence?.endDate ? new Date(defaultValues.recurrence.endDate) : undefined)
      } else {
        // Reset to defaults if no defaultValues
        setTitle("")
        setDescription("")
        setDate(new Date())
        setIsMultiDay(false)
        setEndDate(addDays(new Date(), 1))
        setIsAllDay(true)
        setStartTime("09:00")
        setEndTime("10:00")
        setIsGraded(false)
        setGrade("")
        setSelectedTags([])
        setEventColor("#3b82f6")
        setRecurrenceTab("none")
        setRecurrenceType("none")
        setRecurrenceInterval(1)
        setRecurrenceEndType("never")
        setRecurrenceOccurrences(10)
        setRecurrenceEndDate(undefined)
      }
      setError(null)
    }
  }, [open, defaultValues])

  // Colores predefinidos para el selector
  const predefinedColors = [
    "#3b82f6", // Azul
    "#ef4444", // Rojo
    "#10b981", // Verde
    "#f59e0b", // Naranja
    "#8b5cf6", // Púrpura
    "#ec4899", // Rosa
    "#6b7280", // Gris
  ]

  // Añadir validación de tiempo antes del handleSubmit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!date) return

    // Validar que la hora de fin sea posterior a la hora de inicio
    if (!isAllDay && startTime && endTime) {
      if (endTime <= startTime) {
        setTimeError("La hora de fin debe ser posterior a la hora de inicio")
        return
      }
    }

    setTimeError(null)

    // Guardar el color personalizado si no es uno de los predefinidos
    if (!predefinedColors.includes(eventColor) && !customColors.includes(eventColor)) {
      saveCustomColor(eventColor)
    }

    const eventData: Omit<Event, "id"> = {
      title,
      description,
      date: format(date, "yyyy-MM-dd"),
      isAllDay,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      isGraded,
      grade: isGraded ? grade : undefined,
      tags: selectedTags,
      color: eventColor,
    }

    // Add multi-day data if enabled
    if (isMultiDay && endDate) {
      eventData.isMultiDay = true
      eventData.endDate = format(endDate, "yyyy-MM-dd")
    }

    // Add recurrence data if enabled
    if (recurrenceTab === "recurrence" && recurrenceType !== "none") {
      eventData.recurrence = {
        type: recurrenceType,
        interval: recurrenceInterval,
      }

      if (recurrenceEndType === "after") {
        eventData.recurrence.occurrences = recurrenceOccurrences
      } else if (recurrenceEndType === "on" && recurrenceEndDate) {
        eventData.recurrence.endDate = format(recurrenceEndDate, "yyyy-MM-dd")
      }
    }

    if (mode === "edit" && defaultValues?.id) {
      updateEvent(defaultValues.id, eventData)
    } else {
      addEvent(eventData)
    }

    onOpenChange(false)
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  // Manejar la adición de un color personalizado
  const handleColorChange = (color: string) => {
    setEventColor(color)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Permitir cerrar con la X, pero no al hacer clic fuera
        if (newOpen === false) {
          onOpenChange(false)
        } else {
          onOpenChange(newOpen)
        }
      }}
    >
      <DialogContent className="sm:max-w-[950px] w-[95%] max-h-[calc(90vh+200px)] overflow-y-auto glass dialog-content-enhanced">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Crear nuevo evento" : "Editar evento"}</DialogTitle>
            <DialogDescription>
              {mode === "create" ? "Añade un nuevo evento a tu calendario" : "Modifica los detalles del evento"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del evento"
                required
                className="glass-input"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del evento"
                className="glass-input min-h-[100px]"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="isMultiDay">Evento de varios días</Label>
                <Switch id="isMultiDay" checked={isMultiDay} onCheckedChange={setIsMultiDay} />
              </div>

              {!isMultiDay ? (
                <div className="grid gap-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal glass-input",
                          !date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 glass">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        locale={es}
                        weekStartsOn={1}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Fecha de inicio</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal glass-input",
                            !date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP", { locale: es }) : <span>Selecciona fecha de inicio</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 glass">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(newDate) => {
                            setDate(newDate)
                            // Si la fecha de fin es anterior a la nueva fecha
                            if (endDate && isBefore(endDate, newDate)) {
                              setEndDate(addDays(newDate, 1))
                            }
                          }}
                          locale={es}
                          weekStartsOn={1}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="endDate">Fecha de fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal glass-input",
                            !endDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP", { locale: es }) : <span>Selecciona fecha de fin</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 glass">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          disabled={(currentDate) => (date ? isBefore(currentDate, date) : false)}
                          locale={es}
                          weekStartsOn={1}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="isAllDay">Todo el día</Label>
                <Switch id="isAllDay" checked={isAllDay} onCheckedChange={setIsAllDay} />
              </div>

              {!isAllDay && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Hora de inicio</Label>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value)
                          setTimeError(null)
                        }}
                        className="glass-input"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">Hora de fin</Label>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => {
                          setEndTime(e.target.value)
                          setTimeError(null)
                        }}
                        className="glass-input"
                      />
                    </div>
                  </div>
                  {timeError && <div className="col-span-2 text-sm text-red-500 mt-1">{timeError}</div>}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="eventColor">Color del evento</Label>
              <ColorPicker
                selectedColor={eventColor}
                onColorChange={handleColorChange}
                customColors={customColors}
                setCustomColors={setCustomColors}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="isGraded">Evento calificable</Label>
                <Switch id="isGraded" checked={isGraded} onCheckedChange={setIsGraded} />
              </div>
              {isGraded && (
                <div className="grid gap-2">
                  <Label htmlFor="grade">Calificación</Label>
                  <Input
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="Ej: 8.5"
                    className="glass-input"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Repetición</Label>
              <Tabs value={recurrenceTab} onValueChange={(v) => setRecurrenceTab(v as "none" | "recurrence")}>
                <TabsList className="grid w-full grid-cols-2 rounded-full">
                  <TabsTrigger value="none" className="rounded-full">
                    No repetir
                  </TabsTrigger>
                  <TabsTrigger value="recurrence" className="rounded-full">
                    Repetir
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="recurrence" className="mt-2 space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="recurrenceType">Frecuencia</Label>
                    <Select value={recurrenceType} onValueChange={(v) => setRecurrenceType(v as RecurrenceType)}>
                      <SelectTrigger id="recurrenceType" className="glass-input">
                        <SelectValue placeholder="Selecciona frecuencia" />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        <SelectItem value="daily">Diariamente</SelectItem>
                        <SelectItem value="weekly">Semanalmente</SelectItem>
                        <SelectItem value="monthly">Mensualmente</SelectItem>
                        <SelectItem value="yearly">Anualmente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="recurrenceInterval">Cada</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="recurrenceInterval"
                        type="number"
                        min="1"
                        max="99"
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(Number.parseInt(e.target.value) || 1)}
                        className="w-20 glass-input"
                      />
                      <span className="text-sm text-muted-foreground">
                        {recurrenceType === "daily"
                          ? "días"
                          : recurrenceType === "weekly"
                            ? "semanas"
                            : recurrenceType === "monthly"
                              ? "meses"
                              : "años"}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="recurrenceEndType">Finaliza</Label>
                    <Select
                      value={recurrenceEndType}
                      onValueChange={(v) => setRecurrenceEndType(v as "never" | "after" | "on")}
                    >
                      <SelectTrigger id="recurrenceEndType" className="glass-input">
                        <SelectValue placeholder="Selecciona cuándo finaliza" />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        <SelectItem value="never">Nunca</SelectItem>
                        <SelectItem value="after">Después de</SelectItem>
                        <SelectItem value="on">En fecha</SelectItem>
                      </SelectContent>
                    </Select>

                    {recurrenceEndType === "after" && (
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="number"
                          min="1"
                          max="999"
                          value={recurrenceOccurrences}
                          onChange={(e) => setRecurrenceOccurrences(Number.parseInt(e.target.value) || 1)}
                          className="w-20 glass-input"
                        />
                        <span className="text-sm text-muted-foreground">repeticiones</span>
                      </div>
                    )}

                    {recurrenceEndType === "on" && (
                      <div className="mt-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal glass-input",
                                !recurrenceEndDate && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {recurrenceEndDate ? (
                                format(recurrenceEndDate, "PPP", { locale: es })
                              ) : (
                                <span>Selecciona fecha final</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 glass">
                            <Calendar
                              mode="single"
                              selected={recurrenceEndDate}
                              onSelect={setRecurrenceEndDate}
                              initialFocus
                              disabled={(currentDate) => (date ? isBefore(currentDate, date) : false)}
                              locale={es}
                              weekStartsOn={1}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="grid gap-2">
              <Label>Etiquetas</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    style={{
                      backgroundColor: selectedTags.includes(tag.id) ? tag.color : "transparent",
                      borderColor: tag.color,
                      color: selectedTags.includes(tag.id) ? "white" : tag.color,
                    }}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
              Cancelar
            </Button>
            <Button type="submit" className="btn-gradient rounded-full">
              {mode === "create" ? "Crear evento" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
