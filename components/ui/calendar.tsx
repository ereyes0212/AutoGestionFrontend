"use client"

import * as React from "react"
import { DayPicker, CaptionProps, useNavigation } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  fromYear?: number
  toYear?: number
}

export function Calendar({
  className,
  classNames,
  fromYear = 1900,
  toYear = new Date().getFullYear(),
  ...props
}: CalendarProps) {
  // Generamos arrays de meses y años
  const months = Array.from({ length: 12 }, (_, i) => i)
  const years = Array.from(
    { length: toYear - fromYear + 1 },
    (_, i) => fromYear + i
  )

  // Componente Caption personalizado usando Select de Shadcn
  function Caption({ displayMonth }: CaptionProps) {
    const { goToMonth } = useNavigation()

    return (
      <div className="flex items-center justify-center space-x-2 px-2 py-1">
        {/* Selector de mes */}
        <Select
          value={String(displayMonth.getMonth())}
          onValueChange={(val) => {
            const m = parseInt(val, 10)
            goToMonth(new Date(displayMonth.getFullYear(), m, 1))
          }}
        >
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {new Date(0, m).toLocaleString("es-ES", { month: "long" })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selector de año */}
        <Select
          value={String(displayMonth.getFullYear())}
          onValueChange={(val) => {
            const y = parseInt(val, 10)
            goToMonth(new Date(y, displayMonth.getMonth(), 1))
          }}
        >
          <SelectTrigger className="w-20">
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent className="max-h-64 overflow-auto">
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  // Clases estándar de Shadcn + pequeño ancho extra
  const mergedClassNames = {
    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
    month: "space-y-4",
    caption: "hidden", // ocultamos el caption default
    nav: "space-x-1 flex items-center",
    nav_button: cn(
      buttonVariants({ variant: "outline" }),
      "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
    ),
    nav_button_previous: "absolute left-1",
    nav_button_next: "absolute right-1",
    table: "w-full border-collapse space-y-1",
    head_row: "flex",
    head_cell:
      "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
    row: "flex w-full mt-2",
    cell: cn(
      "relative p-0 text-center text-sm focus-within:z-20 [&:has([aria-selected])]:bg-accent",
      props.mode === "range"
        ? "[&:has(>.day-range-end)]:rounded-r-md [... y demás reglas...]"
        : "[&:has([aria-selected])]:rounded-md"
    ),
    day: cn(
      buttonVariants({ variant: "ghost" }),
      "h-8 w-8 p-0 font-normal aria-selected:opacity-100"
    ),
    day_selected:
      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
    day_today: "bg-accent text-accent-foreground",
    day_outside:
      "day-outside text-muted-foreground aria-selected:bg-accent/50",
    day_disabled: "text-muted-foreground opacity-50",
    ...classNames,
  }

  return (
    <DayPicker
      showOutsideDays
      className={cn("p-3", className, "w-[300px]")}
      fromMonth={new Date(fromYear, 0)}
      toMonth={new Date(toYear, 11)}
      components={{
        Caption, // nuestro Caption con Selects
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      classNames={mergedClassNames}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"
