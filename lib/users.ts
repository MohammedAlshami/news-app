import users from "@/data/users.json"

export type AppUser = {
  id: string
  email: string
  password: string
  role: "admin" | "user"
}

const data = users as { users: AppUser[] }

export function getUsers(): AppUser[] {
  return data.users
}

export function findUserByEmailAndPassword(
  email: string,
  password: string,
): AppUser | undefined {
  const e = email.trim().toLowerCase()
  return getUsers().find(
    (u) => u.email.toLowerCase() === e && u.password === password,
  )
}

export function getUserById(id: string): AppUser | undefined {
  return getUsers().find((u) => u.id === id)
}
