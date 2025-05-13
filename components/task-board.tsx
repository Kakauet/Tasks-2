"use client"

import { useTaskContext } from "@/context/task-context"
import { cn } from "@/lib/utils"

// Hooks personalizados
import { useDialogState } from "@/hooks/use-dialog-state"
import { useFilter } from "@/hooks/use-filter"

// Componentes
import { TaskColumn } from "@/components/task-column"
import { TaskDialog } from "@/components/task-dialog"
import { TagsDialog } from "@/components/tags-dialog"
import { TagBadge } from "@/components/ui/tag-badge"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Icons
import { PlusCircle, X, Filter } from "lucide-react"

export function TaskBoard() {
  // Estado y contexto
  const { tasks, tags } = useTaskContext()
  const taskDialog = useDialogState(false)
  const tagsDialog = useDialogState(false)

  // Filtrado de tareas
  const {
    searchTerm,
    setSearchTerm,
    selectedTags,
    showFilters,
    setShowFilters,
    toggleTagFilter,
    clearFilters,
    filteredItems: filteredTasks,
  } = useFilter(tasks)

  // Agrupar tareas por estado
  const todoTasks = filteredTasks.filter((task) => task.status === "todo")
  const inProgressTasks = filteredTasks.filter((task) => task.status === "inProgress")
  const doneTasks = filteredTasks.filter((task) => task.status === "done")

  // Componente para el panel de filtros
  const FilterPanel = () => {
    if (!showFilters || tags.length === 0) return null

    return (
      <div className="glass p-4 rounded-xl filter-panel-enter transition-all duration-300">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">Filtrar por etiquetas</h3>
          {(selectedTags.length > 0 || searchTerm) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-full">
              <X className="mr-2 h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagBadge
              key={tag.id}
              id={tag.id}
              name={tag.name}
              color={tag.color}
              selected={selectedTags.includes(tag.id)}
              onClick={toggleTagFilter}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-in">
      {/* Barra de herramientas */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("rounded-full", showFilters && "bg-primary/10")}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" onClick={tagsDialog.open} className="rounded-full">
            Gestionar Etiquetas
          </Button>
          <Button onClick={taskDialog.open} className="btn-primary rounded-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Panel de filtros */}
      <FilterPanel />

      {/* Tablero de tareas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-auto w-full transition-all duration-300">
        <TaskColumn title="Por Hacer" tasks={todoTasks} status="todo" />
        <TaskColumn title="En Progreso" tasks={inProgressTasks} status="inProgress" />
        <TaskColumn title="Completadas" tasks={doneTasks} status="done" />
      </div>

      {/* Diálogos */}
      <TaskDialog open={taskDialog.isOpen} onOpenChange={taskDialog.setIsOpen} />
      <TagsDialog open={tagsDialog.isOpen} onOpenChange={tagsDialog.setIsOpen} />
    </div>
  )
}
