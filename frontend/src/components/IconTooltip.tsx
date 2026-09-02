import type { ReactElement, ReactNode } from "react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * A hover label for a control whose whole content is an icon. Every one of these already carries
 * an aria-label, which a screen reader announces but a sighted mouse user never sees; this puts
 * the same words on screen, so the label and the tooltip cannot drift apart into two strings.
 *
 * Deliberately not used on an icon that already sits beside its own text label - repeating a word
 * the user is looking at is noise. It also replaces the native `title` attribute rather than
 * joining it, since a control carrying both shows two tooltips a second apart.
 *
 * `render` is the control itself, written self-closing: Base UI merges the trigger's own props
 * into it and takes the icon from `children`, the same shape SheetTrigger uses in the top nav.
 */
function IconTooltip({
  children,
  label,
  render,
  side = "top",
}: {
  children: ReactNode
  label: string
  render: ReactElement
  side?: "top" | "bottom" | "left" | "right"
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={render}>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}

export { IconTooltip }
