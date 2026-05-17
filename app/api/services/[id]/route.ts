import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const service = await prisma.service.update({
    where: { id: Number(id) },
    data: {
      name: body.name,
      url: body.url,
      intervalMinutes: body.intervalMinutes,
      expectedStatus: body.expectedStatus,
    },
  })
  return NextResponse.json(service)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.service.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
