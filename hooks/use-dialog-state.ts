"use client"

import { useState, useCallback } from "react"

/**
 * Hook personalizado para manejar el estado de diálogos
 * @param initialState Estado inicial del diálogo (abierto o cerrado)
 * @returns Funciones y estado para controlar un diálogo
 */
export function useDialogState(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState)
  const [isProcessing, setIsProcessing] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => {
    if (!isProcessing) {
      setIsOpen(false)
    }
  }, [isProcessing])

  const startProcessing = useCallback(() => setIsProcessing(true), [])
  const endProcessing = useCallback(() => {
    setIsProcessing(false)
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    setIsOpen,
    open,
    close,
    isProcessing,
    startProcessing,
    endProcessing,
  }
}
