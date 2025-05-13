"use client"

import { useState, useCallback } from "react"
import { DraggableStep } from "@/components/draggable-step"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { TaskStep } from "@/context/task-context"

interface StepListProps {
  steps: TaskStep[]
  onStepsChange: (steps: TaskStep[]) => void
  onToggleStep: (id: string) => void
  onDeleteStep: (id: string) => void
  onAddStep: (text: string) => void
  onUpdateStepText: (id: string, text: string) => void
}

export function StepList({
  steps,
  onStepsChange,
  onToggleStep,
  onDeleteStep,
  onAddStep,
  onUpdateStepText,
}: StepListProps) {
  const [newStep, setNewStep] = useState("")

  const moveStep = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const draggedStep = steps[dragIndex]
      const newSteps = [...steps]
      newSteps.splice(dragIndex, 1)
      newSteps.splice(hoverIndex, 0, draggedStep)
      onStepsChange(newSteps)
    },
    [steps, onStepsChange],
  )

  const handleAddStep = () => {
    if (newStep.trim()) {
      onAddStep(newStep)
      setNewStep("")
    }
  }

  return (
    <div className="space-y-2 w-full">
      <div className="space-y-2 step-container w-full">
        {steps.map((step, index) => (
          <DraggableStep
            key={step.id}
            step={step}
            index={index}
            moveStep={moveStep}
            toggleStep={onToggleStep}
            deleteStep={onDeleteStep}
            updateStepText={onUpdateStepText}
          />
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          value={newStep}
          onChange={(e) => setNewStep(e.target.value)}
          placeholder="Añadir un nuevo paso (presiona Enter para añadir)"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAddStep()
            }
          }}
          onBlur={() => {
            if (newStep.trim()) {
              handleAddStep()
            }
          }}
          className="glass-input pl-4 interactive-element"
        />
        <Button
          type="button"
          size="icon"
          onClick={handleAddStep}
          disabled={!newStep.trim()}
          className="rounded-full h-10 w-10 flex items-center justify-center add-button"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
