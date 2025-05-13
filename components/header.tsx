"use client"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, Download, Menu, Upload, User, Keyboard, Undo, Redo } from "lucide-react"
import Link from "next/link"
import { useTaskContext } from "@/context/task-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function Header() {
  const { tasks, events, tags, canUndo, canRedo, undo, redo } = useTaskContext()

  const handleExport = () => {
    const data = {
      tasks,
      events,
      tags,
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

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 w-full glass border-b backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="glass">
                <SheetHeader>
                  <SheetTitle>TaskMaster</SheetTitle>
                  <SheetDescription>Gestiona tus tareas y eventos de manera eficiente.</SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <p className="text-sm text-muted-foreground px-4">
                    Usa las pestañas debajo del encabezado para navegar entre el tablero y el calendario.
                  </p>
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                TaskMaster
              </span>
            </Link>
            <nav className="hidden md:flex md:gap-2">
              <span className="text-sm text-muted-foreground">Gestión de tareas y eventos</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {/* Add Undo/Redo buttons */}
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Perfil</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass">
                <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar datos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImport}>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar datos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ModeToggle />
            {/* Keyboard shortcuts help button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-white/10 dark:hover:bg-gray-700/20 transition-all duration-200"
                  onClick={() => {
                    // Show a simple alert with keyboard shortcuts
                    alert(
                      "Atajos de teclado:\n\n" +
                        "• Ctrl+Z: Deshacer\n" +
                        "• Ctrl+Shift+Z: Rehacer\n" +
                        "• Ctrl+N: Nueva tarea\n" +
                        "• Ctrl+E: Nuevo evento\n" +
                        "• Ctrl+H: Ir a hoy (Calendario)\n" +
                        "• Ctrl+F: Buscar\n" +
                        "• Esc: Cerrar diálogos",
                    )
                  }}
                >
                  <Keyboard className="h-5 w-5" />
                  <span className="sr-only">Atajos de teclado</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Atajos de teclado</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
    </TooltipProvider>
  )
}
