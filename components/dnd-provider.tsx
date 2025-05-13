"use client"

import type { ReactNode } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { TouchBackend } from "react-dnd-touch-backend"
import { isMobile } from "react-device-detect"

interface DragDropProviderProps {
  children: ReactNode
}

export function DragDropProvider({ children }: DragDropProviderProps) {
  // Usar TouchBackend para dispositivos móviles y HTML5Backend para escritorio
  const backend = isMobile ? TouchBackend : HTML5Backend

  return <DndProvider backend={backend}>{children}</DndProvider>
}
