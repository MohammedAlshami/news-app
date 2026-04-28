"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import {
  createCategoryAction,
  updateCategoryAction,
} from "@/app/admin/categories/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SiteCategory } from "@/lib/site-types"
import { ar } from "@/lib/ui-ar"

type Props = {
  categories: SiteCategory[]
  addOpen: boolean
  onAddOpenChange: (open: boolean) => void
  editOpen: boolean
  onEditOpenChange: (open: boolean) => void
}

export function AdminCategoryModals({
  categories,
  addOpen,
  onAddOpenChange,
  editOpen,
  onEditOpenChange,
}: Props) {
  const router = useRouter()
  const [addName, setAddName] = useState("")
  const [addDescription, setAddDescription] = useState("")
  const [editId, setEditId] = useState<string>("")
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editCategory = useMemo(
    () => categories.find((c) => c.id === editId),
    [categories, editId],
  )

  useEffect(() => {
    if (editOpen && categories.length > 0 && !editId) {
      setEditId(categories[0].id)
    }
  }, [editOpen, categories, editId])

  useEffect(() => {
    if (editCategory) {
      setEditName(editCategory.name)
      setEditDescription(editCategory.description)
    }
  }, [editCategory])

  return (
    <>
      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          onAddOpenChange(o)
          if (!o) {
            setError(null)
            setAddName("")
            setAddDescription("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{ar.adminCategoryAddTitle}</DialogTitle>
          </DialogHeader>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="admin-cat-add-name">{ar.adminCategoryName}</Label>
              <Input
                id="admin-cat-add-name"
                value={addName}
                onChange={(e) => {
                  setAddName(e.target.value)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-cat-add-desc">
                {ar.adminCategoryDescription}
              </Label>
              <Textarea
                id="admin-cat-add-desc"
                rows={3}
                value={addDescription}
                onChange={(e) => {
                  setAddDescription(e.target.value)
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              disabled={pending}
              onClick={async () => {
                setError(null)
                setPending(true)
                const r = await createCategoryAction({
                  name: addName,
                  description: addDescription,
                })
                setPending(false)
                if (r.ok === false) {
                  setError(r.error)
                  return
                }
                onAddOpenChange(false)
                setAddName("")
                setAddDescription("")
                router.refresh()
              }}
            >
              {pending ? ar.adminCategorySaving : ar.adminCategoryCreate}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          onEditOpenChange(o)
          if (!o) {
            setError(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{ar.adminCategoryEditTitle}</DialogTitle>
          </DialogHeader>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="admin-cat-edit-pick">
                {ar.adminCategoryPick}
              </Label>
              <select
                id="admin-cat-edit-pick"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editId}
                onChange={(e) => {
                  setEditId(e.target.value)
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-cat-edit-name">{ar.adminCategoryName}</Label>
              <Input
                id="admin-cat-edit-name"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-cat-edit-desc">
                {ar.adminCategoryDescription}
              </Label>
              <Textarea
                id="admin-cat-edit-desc"
                rows={3}
                value={editDescription}
                onChange={(e) => {
                  setEditDescription(e.target.value)
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              disabled={pending || categories.length === 0 || !editId}
              onClick={async () => {
                setError(null)
                setPending(true)
                const r = await updateCategoryAction({
                  id: editId,
                  name: editName,
                  description: editDescription,
                })
                setPending(false)
                if (r.ok === false) {
                  setError(r.error)
                  return
                }
                onEditOpenChange(false)
                router.refresh()
              }}
            >
              {pending ? ar.adminCategorySaving : ar.adminCategorySave}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
