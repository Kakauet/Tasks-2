"use client"

import type React from "react"

import { useState } from "react"
import { useTaskContext, type Task, type TaskStep } from "@/context/task-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

// Implementar drag and drop para los pasos

// Importar los nuevos componentes al principio del archivo
import { StepList } from "@/components/step-list"
import { DragDropProvider } from "@/components/dnd-provider"

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<Task>
  mode?: "create" | "edit"
}

export function TaskDialog({ open, onOpenChange, defaultValues, mode = "create" }: TaskDialogProps) {
  // Modificar la función handleSubmit para incluir la nueva funcionalidad
  const { addTask, updateTask, tags, reorderSteps, addStep, updateStep } = useTaskContext()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [title, setTitle] = useState(defaultValues?.title || "")
  const [description, setDescription] = useState(defaultValues?.description || "")
  const [status, setStatus] = useState(defaultValues?.status || "todo")
  const [priority, setPriority] = useState(defaultValues?.priority || "medium")
  const [dueDate, setDueDate] = useState<Date | undefined>(
    defaultValues?.dueDate ? new Date(defaultValues.dueDate) : undefined,
  )
  const [steps, setSteps] = useState<TaskStep[]>(defaultValues?.steps || [])
  const [selectedTags, setSelectedTags] = useState<string[]>(defaultValues?.tags || [])
  const [newStep, setNewStep] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const taskData = {
      title,
      description,
      status: status as "todo" | "inProgress" | "done",
      priority: priority as "low" | "medium" | "high",
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      steps,
      tags: selectedTags,
    }

    if (mode === "edit" && defaultValues?.id) {
      updateTask(defaultValues.id, taskData)
    } else {
      addTask(taskData)
    }

    // Ensure UI remains interactive
    setTimeout(() => {
      setIsSubmitting(false)
      onOpenChange(false)
    }, 100)
  }

  const handleAddStep = () => {
    if (newStep.trim()) {
      setSteps([...steps, { id: crypto.randomUUID(), text: newStep, completed: false }])
      setNewStep("")
    }
  }

  const handleToggleStep = (id: string) => {
    setSteps(steps.map((step) => (step.id === id ? { ...step, completed: !step.completed } : step)))
  }

  const handleDeleteStep = (id: string) => {
    setSteps(steps.filter((step) => step.id !== id))
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  // Añadir la función para manejar el reordenamiento de pasos
  const handleDragEnd = (result: any) => {
    // Si no hay destino válido, no hacer nada
    if (!result.destination) return

    // Si la posición no cambió, no hacer nada
    if (result.destination.index === result.source.index) return

    // Reordenar los pasos localmente
    const items = Array.from(steps)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSteps(items)

    // Si estamos en modo edición, actualizar en el contexto
    if (mode === "edit" && defaultValues?.id) {
      reorderSteps(defaultValues.id, result.source.index, result.destination.index)
    }
  }

  return (
    // Modificar la línea donde se define el Dialog para evitar que se cierre al hacer clic fuera
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Permitir cerrar con la X, pero no al hacer clic fuera
        if (newOpen === false && !isSubmitting) {
          onOpenChange(false)
        } else {
          onOpenChange(newOpen)
        }
      }}
    >
      {/* Modificar el DialogContent para hacerlo más ancho en pantallas grandes */}
      <DialogContent className="sm:max-w-[950px] w-[95%] max-h-[90vh] overflow-y-auto glass interactive-after-delete">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Crear nueva tarea" : "Editar tarea"}</DialogTitle>
            <DialogDescription>
              {mode === "create" ? "Añade una nueva tarea a tu tablero" : "Modifica los detalles de la tarea"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la tarea"
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
                placeholder="Descripción de la tarea"
                className="min-h-[100px] glass-input"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={status} onValueChange={(value) => setStatus(value)}>
                  <SelectTrigger id="status" className="glass-input">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="todo">Por Hacer</SelectItem>
                    <SelectItem value="inProgress">En Progreso</SelectItem>
                    <SelectItem value="done">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value)}>
                  <SelectTrigger id="priority" className="glass-input">
                    <SelectValue placeholder="Selecciona una prioridad" />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Fecha de vencimiento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal glass-input",
                      !dueDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    locale={es}
                    weekStartsOn={1}
                  />
                </PopoverContent>
              </Popover>
              {dueDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-1 w-fit rounded-full"
                  onClick={() => setDueDate(undefined)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Eliminar fecha
                </Button>
              )}
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
            {/* Reemplazar la sección de pasos con la versión con drag and drop */}
            <div className="grid gap-2">
              <Label>Pasos</Label>
              <div className="max-h-[250px] overflow-y-auto border rounded-lg pt-2 pb-4 px-4 bg-background/50 custom-scrollbar">
                <DragDropProvider>
                  <StepList
                    steps={steps}
                    onStepsChange={(newSteps) => {
                      setSteps(newSteps)
                      if (mode === "edit" && defaultValues?.id) {
                        // Actualizar los pasos en el contexto si estamos en modo edición
                        newSteps.forEach((newStep) => {
                          const originalStep = defaultValues.steps?.find((s) => s.id === newStep.id)
                          if (
                            originalStep &&
                            (newStep.text !== originalStep.text || newStep.completed !== originalStep.completed)
                          ) {
                            updateStep(defaultValues.id, newStep.id, newStep)
                          }
                        })
                      }
                    }}
                    onToggleStep={handleToggleStep}
                    onDeleteStep={handleDeleteStep}
                    onAddStep={(text) => {
                      if (text.trim()) {
                        const newStepObj = { id: crypto.randomUUID(), text, completed: false }
                        setSteps([...steps, newStepObj])
                        if (mode === "edit" && defaultValues?.id) {
                          addStep(defaultValues.id, { text, completed: false })
                        }
                      }
                    }}
                    onUpdateStepText={(id, text) => {
                      setSteps(steps.map((step) => (step.id === id ? { ...step, text } : step)))
                      if (mode === "edit" && defaultValues?.id) {
                        updateStep(defaultValues.id, id, { text })
                      }
                    }}
                  />
                </DragDropProvider>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
              Cancelar
            </Button>
            <Button type="submit" className="btn-primary rounded-full" disabled={isSubmitting}>
              {mode === "create" ? "Crear tarea" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Estilos para la barra de desplazamiento personalizada
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(155, 155, 155, 0.5);
    border-radius: 20px;
    border: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(155, 155, 155, 0.7);
  }
`

// Añadir estilos al documento
if (typeof document !== "undefined") {
  const style = document.createElement("style")
  style.textContent = scrollbarStyles
  document.head.appendChild(style)
}
