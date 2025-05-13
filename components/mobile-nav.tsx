"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { CalendarView } from "@/components/calendar-view"
import { TaskBoard } from "@/components/task-board"

export function MobileNav() {
  const [activeTab, setActiveTab] = useState<"board" | "calendar">("board")

  return (
    <>
      <div className="container flex items-center justify-between border-b p-4">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "board" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("board")}
            className="flex items-center gap-1"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Tablero</span>
          </Button>
          <Button
            variant={activeTab === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("calendar")}
            className="flex items-center gap-1"
          >
            <Calendar className="h-4 w-4" />
            <span>Calendario</span>
          </Button>
        </div>
      </div>
      <div className={cn("container p-4", activeTab === "board" ? "block" : "hidden")}>
        <TaskBoard />
      </div>
      <div className={cn("container p-4", activeTab === "calendar" ? "block" : "hidden")}>
        <CalendarView />
      </div>
    </>
  )
}
