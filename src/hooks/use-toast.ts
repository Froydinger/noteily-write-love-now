import { toast as sonnerToast } from "sonner"

interface ToastOptions {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

function toast({ title, description, variant, duration }: ToastOptions) {
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      duration: duration || 3000,
    })
  }

  return sonnerToast(title, {
    description,
    duration: duration || 3000,
  })
}

function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  }
}

export { useToast, toast }
