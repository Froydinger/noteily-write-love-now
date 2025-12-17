import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"
import { X } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/50 group-[.toaster]:backdrop-blur-2xl group-[.toaster]:backdrop-saturate-150 group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/30 group-[.toaster]:shadow-xl group-[.toaster]:rounded-full group-[.toaster]:px-5 group-[.toaster]:py-3",
          title: "group-[.toast]:font-medium group-[.toast]:text-sm",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-full",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-full",
          closeButton:
            "group-[.toast]:bg-background/40 group-[.toast]:backdrop-blur-md group-[.toast]:border-border/30 group-[.toast]:text-foreground group-[.toast]:hover:bg-background/60 group-[.toast]:rounded-full group-[.toast]:opacity-100 group-[.toast]:right-3 group-[.toast]:top-1/2 group-[.toast]:-translate-y-1/2",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
