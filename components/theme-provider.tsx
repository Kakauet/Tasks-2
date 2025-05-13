"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { createContext, useContext, useEffect, useState } from "react"

export interface CustomTheme {
  id: string
  name: string
  emoji: string
  colors: {
    background: string
    foreground: string
    primary: string
    secondary: string
    accent: string
    muted: string
    border: string
  }
}

interface ThemeContextType {
  customThemes: CustomTheme[]
  addCustomTheme: (theme: CustomTheme) => void
  updateCustomTheme: (id: string, theme: Partial<CustomTheme>) => void
  deleteCustomTheme: (id: string) => void
  currentTheme: string | undefined
  setCurrentTheme: (theme: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Función para determinar si un color es oscuro (para elegir texto blanco) o claro (para elegir texto negro)
function isColorDark(hexColor: string): boolean {
  // Convertir hex a RGB
  const r = Number.parseInt(hexColor.slice(1, 3), 16)
  const g = Number.parseInt(hexColor.slice(3, 5), 16)
  const b = Number.parseInt(hexColor.slice(5, 7), 16)

  // Calcular luminosidad (fórmula estándar)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Si luminance < 0.5, el color es oscuro
  return luminance < 0.5
}

// Función para convertir hex a hsl
const hexToHsl = (hex: string) => {
  // Convertir hex a rgb
  let r = 0,
    g = 0,
    b = 0
  if (hex.length === 4) {
    r = Number.parseInt(hex[1] + hex[1], 16)
    g = Number.parseInt(hex[2] + hex[2], 16)
    b = Number.parseInt(hex[3] + hex[3], 16)
  } else if (hex.length === 7) {
    r = Number.parseInt(hex.substring(1, 3), 16)
    g = Number.parseInt(hex.substring(3, 5), 16)
    b = Number.parseInt(hex.substring(5, 7), 16)
  }

  // Convertir rgb a hsl
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }

    h /= 6
  }

  h = Math.round(h * 360)
  s = Math.round(s * 100)
  l = Math.round(l * 100)

  return `${h} ${s}% ${l}%`
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([])
  const [currentTheme, setCurrentTheme] = useState<string | undefined>()
  const [mounted, setMounted] = useState(false)

  // Modificar el tema por defecto para eliminar backgroundEffects
  useEffect(() => {
    const savedThemes = localStorage.getItem("custom-themes")
    if (savedThemes) {
      setCustomThemes(JSON.parse(savedThemes))
    } else {
      // Tema personalizado por defecto
      const defaultCustomTheme: CustomTheme = {
        id: "custom-blue",
        name: "Azul Personalizado",
        emoji: "🔵",
        colors: {
          background: "#f8fafc",
          foreground: "#0f172a",
          primary: "#3b82f6",
          secondary: "#e2e8f0",
          accent: "#dbeafe",
          muted: "#f1f5f9",
          border: "#e2e8f0",
        },
      }
      setCustomThemes([defaultCustomTheme])
      localStorage.setItem("custom-themes", JSON.stringify([defaultCustomTheme]))
    }
    setMounted(true)
  }, [])

  // Guardar temas personalizados en localStorage cuando cambien
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("custom-themes", JSON.stringify(customThemes))
    }
  }, [customThemes, mounted])

  // Simplificar el efecto que aplica el tema personalizado
  useEffect(() => {
    if (!mounted || !currentTheme) return

    const theme = customThemes.find((t) => t.id === currentTheme)
    if (!theme) return

    // Aplicar variables CSS para el tema personalizado
    const root = document.documentElement

    // Aplicar colores
    root.style.setProperty("--background", hexToHsl(theme.colors.background))
    root.style.setProperty("--foreground", hexToHsl(theme.colors.foreground))
    root.style.setProperty("--primary", hexToHsl(theme.colors.primary))
    root.style.setProperty("--secondary", hexToHsl(theme.colors.secondary))
    root.style.setProperty("--accent", hexToHsl(theme.colors.accent))
    root.style.setProperty("--muted", hexToHsl(theme.colors.muted))
    root.style.setProperty("--border", hexToHsl(theme.colors.border))
  }, [currentTheme, customThemes, mounted])

  const addCustomTheme = (theme: CustomTheme) => {
    setCustomThemes((prev) => [...prev, theme])
  }

  const updateCustomTheme = (id: string, theme: Partial<CustomTheme>) => {
    setCustomThemes((prev) => prev.map((t) => (t.id === id ? { ...t, ...theme } : t)))
  }

  const deleteCustomTheme = (id: string) => {
    setCustomThemes((prev) => prev.filter((t) => t.id !== id))
    if (currentTheme === id) {
      setCurrentTheme("light")
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        customThemes,
        addCustomTheme,
        updateCustomTheme,
        deleteCustomTheme,
        currentTheme,
        setCurrentTheme,
      }}
    >
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
        {children}
      </NextThemesProvider>
    </ThemeContext.Provider>
  )
}

export const useThemeContext = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    // En desarrollo, lanzar un error para facilitar la depuración
    if (process.env.NODE_ENV !== "production") {
      console.error("useThemeContext debe ser usado dentro de un ThemeProvider")
      throw new Error("useThemeContext debe ser usado dentro de un ThemeProvider")
    }
    // En producción, devolver un objeto vacío con valores por defecto para evitar errores
    return {
      customThemes: [],
      addCustomTheme: () => {},
      updateCustomTheme: () => {},
      deleteCustomTheme: () => {},
      currentTheme: undefined,
      setCurrentTheme: () => {},
    } as ThemeContextType
  }
  return context
}
