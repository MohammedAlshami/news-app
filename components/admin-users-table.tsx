"use client"

import { formatArticleDate } from "@/lib/format-date"
import type { AdminUserListItem } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Props = {
  rows: AdminUserListItem[]
  labels: {
    colEmail: string
    colName: string
    colRole: string
    colDate: string
  }
}

export function AdminUsersTable({ rows, labels }: Props) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {ar.adminUsersNoRows}
      </p>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-lg border bg-card">
      <Table dir="rtl">
        <TableHeader>
          <TableRow className="border-b hover:bg-transparent">
            <TableHead className="h-12 min-w-[12rem] px-4 text-start font-medium">
              {labels.colEmail}
            </TableHead>
            <TableHead className="h-12 min-w-[10rem] px-4 text-start font-medium">
              {labels.colName}
            </TableHead>
            <TableHead className="h-12 w-[7rem] px-4 text-start font-medium">
              {labels.colRole}
            </TableHead>
            <TableHead className="h-12 w-[7rem] px-4 text-start font-medium">
              {labels.colDate}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((u) => (
            <TableRow key={u.id} className="hover:bg-muted/50">
              <TableCell className="h-16 max-w-[12rem] px-4 text-start text-sm">
                <span className="block truncate" title={u.email}>
                  {u.email}
                </span>
              </TableCell>
              <TableCell className="h-16 max-w-[10rem] px-4 text-start text-sm text-muted-foreground">
                {u.name || "—"}
              </TableCell>
              <TableCell className="h-16 w-[7rem] px-4 text-start text-sm">
                {u.role === "admin" ? ar.adminUsersRoleAdmin : ar.adminUsersRoleUser}
              </TableCell>
              <TableCell className="h-16 w-[7rem] px-4 text-start text-sm text-muted-foreground">
                {formatArticleDate(u.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
