import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full select-none items-center cursor-pointer group",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/10 group-hover:h-2 transition-all">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-0 w-0 group-hover:h-4 group-hover:w-4 rounded-full bg-white shadow-lg transition-all focus-visible:outline-none active:scale-110 disabled:pointer-events-none disabled:opacity-50 hover:shadow-emerald-500/50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
