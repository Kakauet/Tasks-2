"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle, Tag, Palette, ArrowRight } from "lucide-react"

export function WelcomeDialog() {
  const [open, setOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const totalSlides = 4

  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem("taskmaster-visited")
    if (!hasVisitedBefore) {
      setOpen(true)
      localStorage.setItem("taskmaster-visited", "true")
    }
  }, [])

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1)
    } else {
      setOpen(false)
    }
  }

  const features = [
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Calendario Integrado",
      desc: "Visualiza y gestiona tus eventos",
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: "Tablero Kanban",
      desc: "Organiza tus tareas en columnas",
    },
    {
      icon: <Tag className="h-6 w-6" />,
      title: "Etiquetas",
      desc: "Clasifica con etiquetas de colores",
    },
    {
      icon: <Palette className="h-6 w-6" />,
      title: "Temas",
      desc: "Personaliza la apariencia",
    },
  ]

  const mainFeatures = [
    "Arrastra y suelta tareas",
    "Eventos recurrentes",
    "Divide tareas en pasos",
    "Asigna prioridades",
    "Exporta e importa datos",
    "Interfaz adaptable",
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  }

  const slideVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-[600px] p-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-gray-950"
        hideCloseButton
      >
        <div className="relative">
          {/* Indicador de progreso */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentSlide ? "w-6 bg-gray-900 dark:bg-gray-100" : "w-1 bg-gray-300 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>

          {/* Contenido principal */}
          <div className="p-8 pt-16">
            <motion.div
              key={currentSlide}
              initial="enter"
              animate="center"
              exit="exit"
              variants={slideVariants}
              transition={{ duration: 0.3 }}
              className="min-h-[400px] flex flex-col"
            >
              {currentSlide === 0 && (
                <div className="space-y-10 flex flex-col items-center flex-1">
                  <div className="space-y-4 text-center max-w-md">
                    <motion.h2
                      variants={itemVariants}
                      className="text-3xl font-medium tracking-tight text-gray-900 dark:text-white"
                    >
                      Bienvenido a TaskMaster
                    </motion.h2>
                    <motion.p variants={itemVariants} className="text-gray-600 dark:text-gray-400">
                      Tu nueva herramienta para gestionar tareas y eventos de manera eficiente
                    </motion.p>
                  </div>

                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 gap-4 w-full"
                  >
                    {features.map((feature, i) => (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        className="flex items-start p-4 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                      >
                        <div className="mr-3 text-gray-900 dark:text-gray-100">{feature.icon}</div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{feature.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{feature.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}

              {currentSlide === 1 && (
                <div className="space-y-8 flex flex-col items-center flex-1">
                  <div className="text-center max-w-md">
                    <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Organiza tu trabajo</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Visualiza tus tareas y eventos de manera intuitiva
                    </p>
                  </div>

                  <div className="w-full h-64 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden">
                    <div className="h-full flex items-center justify-center">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-md p-4"
                      >
                        <div className="flex space-x-4 mb-4">
                          {["Por hacer", "En progreso", "Completado"].map((col, i) => (
                            <div
                              key={i}
                              className="flex-1 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                            >
                              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">{col}</h4>
                              {[1, 2].map((task) => (
                                <div key={task} className="h-6 bg-gray-100 dark:bg-gray-700 rounded mb-2"></div>
                              ))}
                            </div>
                          ))}
                        </div>
                        <div className="h-20 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-2">
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: 7 }).map((_, i) => (
                              <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-700 rounded"></div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}

              {currentSlide === 2 && (
                <div className="space-y-8 flex flex-col items-center flex-1">
                  <div className="text-center max-w-md">
                    <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Personalización</h2>
                    <p className="text-gray-600 dark:text-gray-400">Adapta TaskMaster a tu estilo y necesidades</p>
                  </div>

                  <div className="w-full space-y-4">
                    <motion.div
                      variants={itemVariants}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                    >
                      <div className="flex items-center mb-3">
                        <Tag className="h-5 w-5 mr-2 text-gray-900 dark:text-white" />
                        <h3 className="font-medium text-gray-900 dark:text-white">Etiquetas personalizadas</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["bg-gray-500", "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500"].map(
                          (color, i) => (
                            <div key={i} className={`h-4 w-10 rounded-full ${color}`}></div>
                          ),
                        )}
                      </div>
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                    >
                      <div className="flex items-center mb-3">
                        <Palette className="h-5 w-5 mr-2 text-gray-900 dark:text-white" />
                        <h3 className="font-medium text-gray-900 dark:text-white">Temas</h3>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          "bg-gray-200 dark:bg-gray-700",
                          "bg-blue-200 dark:bg-blue-700",
                          "bg-green-200 dark:bg-green-700",
                          "bg-purple-200 dark:bg-purple-700",
                        ].map((color, i) => (
                          <div key={i} className={`h-10 rounded ${color}`}></div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {currentSlide === 3 && (
                <div className="space-y-8 flex flex-col items-center flex-1">
                  <div className="text-center max-w-md">
                    <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Todo listo</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Comienza a usar TaskMaster para transformar tu organización personal y profesional
                    </p>
                  </div>

                  <div className="w-full">
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {mainFeatures.map((feature, i) => (
                        <motion.div
                          key={i}
                          variants={itemVariants}
                          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-gray-900 dark:bg-gray-100"></div>
                          {feature}
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      variants={itemVariants}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-center"
                    >
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        "La organización es la clave del éxito"
                      </p>
                    </motion.div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Botón de navegación */}
          <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {currentSlide + 1} / {totalSlides}
            </div>
            <Button
              onClick={nextSlide}
              variant="outline"
              className="rounded-full px-6 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {currentSlide < totalSlides - 1 ? (
                <>
                  Siguiente
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                "Comenzar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
