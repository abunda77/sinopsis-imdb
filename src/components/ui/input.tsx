import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-rule-strong bg-paper px-3 py-2 text-base text-ink shadow-[var(--shadow-soft)] transition-[background-color,border-color] duration-[var(--dur-micro)] ease-[var(--ease-out)] placeholder:text-faint hover:bg-paper-2 focus-visible:bg-paper aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-55 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
