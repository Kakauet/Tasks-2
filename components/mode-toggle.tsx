"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()
  const [isOpen, setIsOpen] = React.useState(false)
  const toggleRef = React.useRef<HTMLDivElement>(null)

  // Cierra el menú al hacer clic fuera
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toggleRef.current && !toggleRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={toggleRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full hover:bg-white/10 dark:hover:bg-gray-700/20 transition-all duration-200"
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      <div
        className={`
          absolute right-0 mt-2 w-40 rounded-xl overflow-hidden z-50
          shadow-lg border border-white/30 dark:border-gray-700/40
          bg-background/60 dark:bg-gray-900/60 backdrop-blur
          transition-all duration-300 ease-out
          ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0 dropdown-enter"
              : "opacity-0 scale-95 translate-y-2 pointer-events-none"
          }
        `}
        style={{
          transformOrigin: "top right",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="py-1 backdrop-blur bg-white/5 dark:bg-black/5">
          <button
            className="flex w-full items-center px-4 py-3 text-sm hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all duration-200"
            onClick={() => {
              setTheme("light")
              setIsOpen(false)
            }}
          >
            <Sun className="mr-3 h-4 w-4" />
            Claro
          </button>

          <button
            className="flex w-full items-center px-4 py-3 text-sm hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all duration-200"
            onClick={() => {
              setTheme("dark")
              setIsOpen(false)
            }}
          >
            <Moon className="mr-3 h-4 w-4" />
            Oscuro
          </button>

          <button
            className="flex w-full items-center px-4 py-3 text-sm hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all duration-200"
            onClick={() => {
              setTheme("system")
              setIsOpen(false)
            }}
          >
            <svg
              className="mr-3 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            Sistema
          </button>
        </div>
      </div>
    </div>
  )
}
