"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ar } from "@/lib/ui-ar"
import { BellIcon } from "lucide-react"

type Notification = {
  id: string
  avatar: string
  fallback: string
  text: string
  time: string
}

export function NotificationsPopover({
  notifications,
}: {
  notifications: Notification[]
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={ar.adminNotifOpen}
        >
          <BellIcon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="left"
        align="end"
        className="my-2 w-80"
      >
        <DropdownMenuLabel className="text-start">
          {ar.adminNotifLabel}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.map(({ id, avatar, fallback, text, time }) => (
          <DropdownMenuItem
            key={id}
            className="flex items-start gap-3 text-start"
          >
            <Avatar className="size-8 shrink-0">
              {avatar ? <AvatarImage src={avatar} alt="" /> : null}
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex flex-1 flex-col text-start">
              <span className="text-sm font-medium">{text}</span>
              <span className="text-xs text-muted-foreground">{time}</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-sm text-muted-foreground hover:text-primary">
          {ar.adminNotifViewAll}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
