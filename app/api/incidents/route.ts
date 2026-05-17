import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const incidents = await prisma.incident.findMany({
    include: { service: { select: { name: true } } },
    orderBy: { startedAt: "desc" },
    take: 20,
  })
  return NextResponse.json(incidents)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { serviceId, title, message } = await req.json()
  if (!serviceId || !title || !message) {
    return NextResponse.json({ error: "serviceId, title, message required" }, { status: 400 })
  }

  const incident = await prisma.incident.create({
    data: { serviceId, title, message },
  })
  return NextResponse.json(incident, { status: 201 })
}
