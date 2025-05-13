"use client"

import { useState, useEffect, useRef } from "react"
import { TaskBoard } from "@/components/task-board"
import { CalendarView } from "@/components/calendar-view"
import { TaskProvider } from "@/context/task-context"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Calendar, LayoutDashboard, User, Download, Upload, Undo, Redo } from "lucide-react"
import { WelcomeDialog } from "@/components/welcome-dialog"
// Importar el DragDropProvider al principio del archivo
import { DragDropProvider } from "@/components/dnd-provider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTaskContext } from "@/context/task-context"

export function Dashboard() {
  const [mounted, setMounted] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [activeView, setActiveView] = useState<"board" | "calendar">("board")

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Remove the HistoryProvider wrapper
  return (
    <TaskProvider>
      <DragDropProvider>
        <DashboardContent activeView={activeView} setActiveView={setActiveView} />
        <WelcomeDialog />
      </DragDropProvider>
    </TaskProvider>
  )
}

// Separate component to use context safely
function DashboardContent({
  activeView,
  setActiveView,
}: {
  activeView: "board" | "calendar"
  setActiveView: (view: "board" | "calendar") => void
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const { canUndo, canRedo, undo, redo } = useTaskContext()

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [profileMenuOpen])

  const handleExport = () => {
    // Get data from localStorage instead of context
    const tasks = localStorage.getItem("tasks") || "[]"
    const events = localStorage.getItem("events") || "[]"
    const tags = localStorage.getItem("tags") || "[]"

    const data = {
      tasks: JSON.parse(tasks),
      events: JSON.parse(events),
      tags: JSON.parse(tags),
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `taskmaster-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/json"

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)

          // Store the imported data in localStorage
          if (data.tasks) localStorage.setItem("tasks", JSON.stringify(data.tasks))
          if (data.events) localStorage.setItem("events", JSON.stringify(data.events))
          if (data.tags) localStorage.setItem("tags", JSON.stringify(data.tags))

          // Reload the page to apply the imported data
          window.location.reload()
        } catch (error) {
          console.error("Error importing data:", error)
          alert("Error importing data. Please check the file format.")
        }
      }
      reader.readAsText(file)
    }

    input.click()
  }

  // Profile menu component
  const ProfileMenu = () => {
    return (
      <div className="relative" ref={profileMenuRef}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className="rounded-full hover:bg-white/10 dark:hover:bg-gray-700/20 transition-all duration-200"
        >
          <User className="h-5 w-5" />
          <span className="sr-only">Perfil</span>
        </Button>

        {/* Eliminado el overlay que causaba blur en toda la pantalla */}

        <div
          className={`
  absolute right-0 mt-2 w-56 rounded-xl overflow-hidden z-50
  shadow-lg border border-white/30 dark:border-gray-700/40
  bg-background/60 dark:bg-gray-900/60 backdrop-blur-xl
  transition-all duration-300 ease-out
  ${profileMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2 pointer-events-none"}
`}
          style={{
            transformOrigin: "top right",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            animation: profileMenuOpen ? "dropdownEnter 0.2s ease-out forwards" : "none",
          }}
        >
          <div className="py-1 backdrop-blur-xl bg-white/5 dark:bg-black/5">
            <div className="px-4 py-3 text-sm font-medium border-b border-gray-200/30 dark:border-gray-700/30">
              Mi cuenta
            </div>

            <button
              className="flex w-full items-center px-4 py-3 text-sm hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all duration-200"
              onClick={() => {
                handleExport()
                setProfileMenuOpen(false)
              }}
            >
              <Download className="mr-3 h-4 w-4" />
              Exportar datos
            </button>

            <button
              className="flex w-full items-center px-4 py-3 text-sm hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all duration-200"
              onClick={() => {
                handleImport()
                setProfileMenuOpen(false)
              }}
            >
              <Upload className="mr-3 h-4 w-4" />
              Importar datos
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if no input or textarea is focused
      const activeElement = document.activeElement
      const isInputActive =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true"

      if (isInputActive) return

      // Ctrl + N: Create new task
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault()
        // Simulated click on "New Task" button
        const newTaskBtn = document.querySelector("button:has(.mr-2.h-4.w-4)")
        if (newTaskBtn) {
          ;(newTaskBtn as HTMLButtonElement).click()
        }
      }

      // Ctrl + E: Create new event
      if (e.ctrlKey && e.key === "e") {
        e.preventDefault()
        // Set calendar view active if not already
        if (activeView !== "calendar") {
          setActiveView("calendar")
        }
        // Simulate click on "New Event" button (with delay to allow view change)
        setTimeout(() => {
          const newEventBtn = document.querySelector("button.btn-primary")
          if (newEventBtn) {
            ;(newEventBtn as HTMLButtonElement).click()
          }
        }, 100)
      }

      // Ctrl + H: Go to today (in calendar view)
      if (e.ctrlKey && e.key === "h") {
        e.preventDefault()
        if (activeView === "calendar") {
          // Dispatch a custom event to be caught by the calendar component
          window.dispatchEvent(new Event("goToToday"))
        }
      }

      // Ctrl + F: Focus search input
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault()
        const searchInput = document.querySelector('input[type="search"]')
        if (searchInput) {
          ;(searchInput as HTMLInputElement).focus()
        }
      }

      // Esc: Close any open dialogs
      if (e.key === "Escape") {
        // Let the default behavior handle dialog closing
      }

      // Ctrl+Z: Undo (handled by history context)
      // Ctrl+Shift+Z: Redo (handled by history context)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [activeView, setActiveView])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Navigation - Rediseñada */}
      <div className="sticky top-0 z-50 w-full border-b backdrop-blur-xl bg-background/60 dark:bg-gray-900/60">
        <div className="container mx-auto flex items-center justify-between py-3 px-4 max-w-[95%] 2xl:max-w-[1800px]">
          <div className="flex items-center gap-3">
            {/* Nuevo componente de navegación mejorado sin espacios entre botones */}
            <div className="relative flex items-center bg-white/10 dark:bg-gray-800/20 backdrop-blur-lg rounded-full p-1 shadow-sm overflow-hidden">
              {/* Sliding background indicator */}
              <div
                className="absolute inset-y-1 transition-all duration-300 ease-in-out rounded-full bg-primary shadow-sm z-0"
                style={{
                  left: activeView === "board" ? "0.25rem" : "50%",
                  right: activeView === "board" ? "50%" : "0.25rem",
                }}
              />

              {/* Board button */}
              <button
                onClick={() => setActiveView("board")}
                className={`relative z-10 flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeView === "board"
                    ? "text-primary-foreground dark:text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={{
                  width: "calc(50% - 0.25rem)",
                }}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Tablero
              </button>

              {/* Calendar button */}
              <button
                onClick={() => setActiveView("calendar")}
                className={`relative z-10 flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeView === "calendar"
                    ? "text-primary-foreground dark:text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={{
                  width: "calc(50% - 0.25rem)",
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendario
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Add Undo/Redo buttons */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={undo}
                    disabled={!canUndo}
                    className="rounded-full hover:bg-white/10 dark:hover:bg-gray-700/20 transition-all duration-200"
                  >
                    <Undo className="h-5 w-5" />
                    <span className="sr-only">Deshacer (Ctrl+Z)</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Deshacer (Ctrl+Z)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={redo}
                    disabled={!canRedo}
                    className="rounded-full hover:bg-white/10 dark:hover:bg-gray-700/20 transition-all duration-200"
                  >
                    <Redo className="h-5 w-5" />
                    <span className="sr-only">Rehacer (Ctrl+Shift+Z)</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rehacer (Ctrl+Shift+Z)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <ProfileMenu />
            <ModeToggle />
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto p-4 max-w-[95%] 2xl:max-w-[1800px]">
        {activeView === "board" ? <TaskBoard /> : <CalendarView />}
      </main>
    </div>
  )
}
