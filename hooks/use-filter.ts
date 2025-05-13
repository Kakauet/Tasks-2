"use client"

import { useState, useCallback, useMemo } from "react"

/**
 * Hook personalizado para manejar filtros de búsqueda y etiquetas
 * @returns Funciones y estado para filtrar elementos
 */
export function useFilter<T extends { title: string; description: string; tags: string[] }>(items: T[]) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const toggleTagFilter = useCallback((tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }, [])

  const clearFilters = useCallback(() => {
    setSearchTerm("")
    setSelectedTags([])
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filtrar por término de búsqueda
      const matchesSearch =
        searchTerm === "" ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtrar por etiquetas seleccionadas
      const matchesTags = selectedTags.length === 0 || selectedTags.some((tagId) => item.tags.includes(tagId))

      return matchesSearch && matchesTags
    })
  }, [items, searchTerm, selectedTags])

  return {
    searchTerm,
    setSearchTerm,
    selectedTags,
    setSelectedTags,
    showFilters,
    setShowFilters,
    toggleTagFilter,
    clearFilters,
    filteredItems,
  }
}
