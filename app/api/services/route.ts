import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const services = await prisma.service.findMany({
    include: {
      checks: {
        orderBy: { checkedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(services)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, url, intervalMinutes = 5, expectedStatus = 200 } = await req.json()
  if (!name || !url) {
    return NextResponse.json({ error: "name and url are required" }, { status: 400 })
  }

  const service = await prisma.service.create({
    data: { name, url, intervalMinutes, expectedStatus },
  })
  return NextResponse.json(service, { status: 201 })
}
