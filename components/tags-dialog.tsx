"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useTaskContext, type TaskTag } from "@/context/task-context"
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
import { Edit, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ColorPicker } from "@/components/color-picker"

interface TagsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TagsDialog({ open, onOpenChange }: TagsDialogProps) {
  const { tags, addTag, updateTag, deleteTag } = useTaskContext()
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3b82f6")
  const [editingTag, setEditingTag] = useState<TaskTag | null>(null)
  const [tagToDelete, setTagToDelete] = useState<string | null>(null)
  const [customColors, setCustomColors] = useState<string[]>([])

  // Add a ref to track if we're interacting with the color picker
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const [isPickingColor, setIsPickingColor] = useState(false)

  // Load custom colors when dialog opens
  useEffect(() => {
    if (open) {
      try {
        const savedColors = localStorage.getItem("custom-event-colors")
        setCustomColors(savedColors ? JSON.parse(savedColors) : [])
      } catch (error) {
        console.error("Error loading custom colors:", error)
        setCustomColors([])
      }
    }
  }, [open])

  const handleAddTag = () => {
    if (newTagName.trim()) {
      addTag({
        name: newTagName,
        color: newTagColor,
      })
      setNewTagName("")
      setNewTagColor("#3b82f6")
    }
  }

  // Modify the handleUpdateTag function to handle the auto-save functionality
  const handleUpdateTag = () => {
    if (editingTag && editingTag.name.trim()) {
      updateTag(editingTag.id, {
        name: editingTag.name,
        color: editingTag.color,
      })
      setEditingTag(null)
    }
  }

  // Add an auto-save function for when clicking outside the input
  const handleInputBlur = (e: React.FocusEvent) => {
    // Don't save if we're clicking on the color picker or its children
    if (isPickingColor || colorPickerRef.current?.contains(e.relatedTarget as Node)) {
      return
    }

    if (editingTag?.name.trim()) {
      handleUpdateTag()
    }
  }

  const handleDeleteTag = () => {
    if (tagToDelete) {
      deleteTag(tagToDelete)
      setTagToDelete(null)
    }
  }

  return (
    <>
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
        <DialogContent className="sm:max-w-[800px] w-[95%] glass dialog-content-enhanced">
          <DialogHeader>
            <DialogTitle>Gestionar Etiquetas</DialogTitle>
            <DialogDescription>Crea, edita y elimina etiquetas para organizar tus tareas.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Añadir nueva etiqueta</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Nombre de la etiqueta"
                      className="glass-input"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newTagName.trim()) {
                          handleAddTag()
                        }
                      }}
                    />
                  </div>
                  <ColorPicker
                    selectedColor={newTagColor}
                    onColorChange={setNewTagColor}
                    customColors={customColors}
                    setCustomColors={setCustomColors}
                  />
                  <Button onClick={handleAddTag} disabled={!newTagName.trim()} className="rounded-full">
                    Añadir
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Etiquetas existentes</Label>
                <div className="max-h-[300px] overflow-y-auto rounded-md border p-2 glass">
                  {tags.length === 0 ? (
                    <p className="py-2 text-center text-sm text-muted-foreground">
                      No hay etiquetas. Crea una nueva etiqueta para empezar.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {tags.map((tag) => (
                        <div key={tag.id} className="flex items-center gap-2 rounded-md border p-2 glass">
                          {editingTag?.id === tag.id ? (
                            <>
                              <div className="flex-1">
                                <Input
                                  value={editingTag.name}
                                  onChange={(e) =>
                                    setEditingTag({
                                      ...editingTag,
                                      name: e.target.value,
                                    })
                                  }
                                  className="glass-input"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && editingTag.name.trim()) {
                                      handleUpdateTag()
                                    }
                                  }}
                                  onBlur={handleInputBlur}
                                  autoFocus
                                />
                              </div>
                              <div
                                ref={colorPickerRef}
                                className="color-picker-container"
                                onMouseEnter={() => setIsPickingColor(true)}
                                onMouseLeave={() => setIsPickingColor(false)}
                              >
                                <ColorPicker
                                  selectedColor={editingTag.color}
                                  onColorChange={(color) => setEditingTag({ ...editingTag, color })}
                                  customColors={customColors}
                                  setCustomColors={setCustomColors}
                                />
                              </div>
                              <Button
                                size="sm"
                                onClick={handleUpdateTag}
                                disabled={!editingTag.name.trim()}
                                className="rounded-full"
                              >
                                Guardar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingTag(null)}
                                className="rounded-full"
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: tag.color }} />
                              <span className="flex-1">{tag.name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingTag(tag)}
                                className="rounded-full"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setTagToDelete(tag.id)}
                                className="rounded-full"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} className="rounded-full">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la etiqueta de todas las tareas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTag} className="bg-red-600">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
