"use client"

import { ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { SiteCategory } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"
import { cn } from "@/lib/utils"

type Props = {
  categories: SiteCategory[]
  selectedIds: Set<string>
  onChange: (next: Set<string>) => void
  className?: string
  "aria-labelledby"?: string
}

function selectionLabel(
  categoriesList: SiteCategory[],
  selectedIds: Set<string>,
) {
  if (selectedIds.size === 0) {
    return ar.adminArticleCategoriesPlaceholder
  }
  const names = categoriesList
    .filter((c) => selectedIds.has(c.id))
    .map((c) => c.name)
  if (names.length === 0) {
    return ar.adminArticleCategoriesPlaceholder
  }
  return names.join("، ")
}

export function AdminCategorySelect({
  categories,
  selectedIds,
  onChange,
  className,
  "aria-labelledby": ariaLabelledBy,
}: Props) {
  const label = selectionLabel(categories, selectedIds)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          dir="rtl"
          className={cn(
            "h-10 w-full min-w-0 max-w-full justify-between gap-2 font-normal",
            !selectedIds.size && "text-muted-foreground",
            className,
          )}
          aria-labelledby={ariaLabelledBy}
        >
          <span className="line-clamp-1 min-w-0 flex-1 text-start">{label}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="[direction:rtl] max-h-64 overflow-y-auto p-1 [&_[data-slot=dropdown-menu-checkbox-item-indicator]]:!start-2 [&_[data-slot=dropdown-menu-checkbox-item-indicator]]:!end-auto"
        align="start"
        sideOffset={4}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
        }}
      >
        {categories.map((c) => (
          <DropdownMenuCheckboxItem
            key={c.id}
            checked={selectedIds.has(c.id)}
            className={cn(
              "cursor-pointer justify-start text-start ps-8 pe-2",
              "data-[state=checked]:ps-8",
            )}
            onCheckedChange={(isOn) => {
              onChange(
                (() => {
                  const n = new Set(selectedIds)
                  if (isOn) {
                    n.add(c.id)
                  } else {
                    n.delete(c.id)
                  }
                  return n
                })(),
              )
            }}
            onSelect={(e) => {
              e.preventDefault()
            }}
          >
            {c.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
