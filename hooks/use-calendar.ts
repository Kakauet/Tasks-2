"use client"

import { useState, useMemo, useCallback } from "react"
import {
  addDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameDay,
  parseISO,
  getDay,
} from "date-fns"
import { es } from "date-fns/locale"
import type { Event } from "@/context/task-context"

/**
 * Hook personalizado para manejar la lógica del calendario
 */
export function useCalendar(getEventsForDate: (date: Date) => Event[]) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [view, setView] = useState<"month" | "week">("month")

  // Funciones de navegación
  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }, [])

  const prevMonth = useCallback(() => {
    setCurrentDate((prev) => subMonths(prev, 1))
  }, [])

  const nextMonth = useCallback(() => {
    setCurrentDate((prev) => addMonths(prev, 1))
  }, [])

  const prevWeek = useCallback(() => {
    setCurrentDate((prev) => addDays(prev, -7))
  }, [])

  const nextWeek = useCallback(() => {
    setCurrentDate((prev) => addDays(prev, 7))
  }, [])

  // Cálculo de días del calendario
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { locale: es, weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { locale: es, weekStartsOn: 1 })

    const days = []
    let day = startDate
    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [currentDate])

  // Cálculo de días de la semana
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { locale: es, weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [currentDate])

  // Funciones de utilidad
  const isSunday = useCallback((date: Date) => getDay(date) === 0, [])

  // Funciones para eventos de varios días
  const getMultiDayPosition = useCallback((event: Event, day: Date): "start" | "middle" | "end" | null => {
    if (!event.isMultiDay || !event.endDate) return null

    const eventStartDate = parseISO(event.date)
    const eventEndDate = parseISO(event.endDate)

    if (isSameDay(day, eventStartDate)) return "start"
    if (isSameDay(day, eventEndDate)) return "end"
    return "middle"
  }, [])

  // Datos para la fecha seleccionada
  const selectedDateEvents = useMemo(
    () => (selectedDate ? getEventsForDate(selectedDate) : []),
    [selectedDate, getEventsForDate],
  )

  return {
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
  }
}
