"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth, signIn, signOut } from "@/auth"
import { prisma } from "./prisma"

export async function login(_: unknown, formData: FormData) {
  try {
    await signIn("credentials", {
      password: formData.get("password"),
      redirectTo: "/dashboard",
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes("NEXT_REDIRECT")) throw err
    return { error: "Wrong password" }
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" })
}

export async function createService(formData: FormData) {
  const session = await auth()
  if (!session) redirect("/login")

  const name = formData.get("name") as string
  const url = formData.get("url") as string
  const intervalMinutes = Number(formData.get("intervalMinutes")) || 5
  const expectedStatus = Number(formData.get("expectedStatus")) || 200

  if (!name?.trim() || !url?.trim()) return

  await prisma.service.create({
    data: { name: name.trim(), url: url.trim(), intervalMinutes, expectedStatus },
  })

  revalidatePath("/dashboard")
  revalidatePath("/")
}

export async function deleteService(id: number) {
  const session = await auth()
  if (!session) redirect("/login")

  await prisma.service.delete({ where: { id } })
  revalidatePath("/dashboard")
  revalidatePath("/")
}

export async function createIncident(formData: FormData) {
  const session = await auth()
  if (!session) redirect("/login")

  const serviceId = Number(formData.get("serviceId"))
  const title = formData.get("title") as string
  const message = formData.get("message") as string

  if (!title?.trim() || !message?.trim() || !serviceId) return

  await prisma.incident.create({
    data: { serviceId, title: title.trim(), message: message.trim() },
  })

  revalidatePath("/dashboard")
  revalidatePath("/")
}

export async function resolveIncident(id: number) {
  const session = await auth()
  if (!session) redirect("/login")

  await prisma.incident.update({
    where: { id },
    data: { resolvedAt: new Date() },
  })

  revalidatePath("/dashboard")
  revalidatePath("/")
}

export async function deleteIncident(id: number) {
  const session = await auth()
  if (!session) redirect("/login")

  await prisma.incident.delete({ where: { id } })
  revalidatePath("/dashboard")
  revalidatePath("/")
}
