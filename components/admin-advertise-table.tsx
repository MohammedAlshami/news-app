"use client"

import { ExternalLink, Eye, MoreVertical } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { AdminAdvertiseInquiryModal } from "@/components/admin-advertise-inquiry-modal"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatArticleDate } from "@/lib/format-date"
import type { AdminAdvertiseInquiryListItem } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"

type Props = {
  rows: AdminAdvertiseInquiryListItem[]
  labels: {
    colName: string
    colEmail: string
    colDate: string
    colMessage: string
    colStatus: string
    colActions: string
    view: string
    openRecord: string
  }
}

function statusLabel(s: string): string {
  if (s === "new") return ar.adminAdvertiseStatusNew
  if (s === "read") return ar.adminAdvertiseStatusRead
  if (s === "archived") return ar.adminAdvertiseStatusArchived
  return s
}

export function AdminAdvertiseTable({ rows, labels }: Props) {
  const [modalId, setModalId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {ar.adminAdvertiseNoRows}
      </p>
    )
  }

  return (
    <>
      <AdminAdvertiseInquiryModal
        inquiryId={modalId}
        open={modalOpen}
        onOpenChange={(next) => {
          setModalOpen(next)
          if (!next) setModalId(null)
        }}
      />
      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-lg border bg-card">
        <Table dir="rtl">
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="h-12 min-w-[8rem] px-4 text-start font-medium">
                {labels.colName}
              </TableHead>
              <TableHead className="h-12 min-w-[10rem] px-4 text-start font-medium">
                {labels.colEmail}
              </TableHead>
              <TableHead className="h-12 w-[7rem] px-4 text-start font-medium">
                {labels.colDate}
              </TableHead>
              <TableHead className="h-12 min-w-[10rem] px-4 text-start font-medium">
                {labels.colMessage}
              </TableHead>
              <TableHead className="h-12 w-[6rem] px-4 text-start font-medium">
                {labels.colStatus}
              </TableHead>
              <TableHead className="h-12 min-w-[5rem] px-2 text-center font-medium">
                {labels.colActions}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} className="hover:bg-muted/50">
                <TableCell className="h-16 max-w-[10rem] px-4 text-start font-medium">
                  <span className="block max-w-full truncate" title={r.name}>
                    {r.name}
                  </span>
                </TableCell>
                <TableCell className="h-16 max-w-xs px-4 text-start text-sm text-muted-foreground">
                  <span dir="ltr" className="block max-w-full truncate" title={r.email}>
                    {r.email}
                  </span>
                </TableCell>
                <TableCell className="h-16 whitespace-nowrap px-4 text-start text-sm text-muted-foreground">
                  {formatArticleDate(r.date)}
                </TableCell>
                <TableCell className="h-16 max-w-md px-4 text-start text-sm text-muted-foreground" title={r.messagePreview}>
                  <span className="block truncate whitespace-nowrap">{r.messagePreview}</span>
                </TableCell>
                <TableCell className="h-16 px-4 text-start text-sm">
                  {statusLabel(r.status)}
                </TableCell>
                <TableCell className="h-16 px-2 text-center">
                  <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <MoreVertical className="size-4" />
                        <span className="sr-only">{labels.colActions}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-40">
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          setModalId(r.id)
                          setModalOpen(true)
                        }}
                      >
                        <Eye className="size-4" />
                        {labels.view}
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/advertise/${r.id}`}>
                          <ExternalLink className="size-4" />
                          {labels.openRecord}
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
