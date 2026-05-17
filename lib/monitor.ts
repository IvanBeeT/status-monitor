import { schedule } from "node-cron"
import { prisma } from "./prisma"

async function ping(serviceId: number, url: string, expectedStatus: number) {
  const start = Date.now()
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    })
    await prisma.check.create({
      data: {
        serviceId,
        up: res.status === expectedStatus,
        latencyMs: Date.now() - start,
        statusCode: res.status,
      },
    })
  } catch {
    await prisma.check.create({
      data: {
        serviceId,
        up: false,
        latencyMs: null,
        statusCode: null,
      },
    })
  }
}

export function startMonitor() {
  schedule("* * * * *", async () => {
    let services
    try {
      services = await prisma.service.findMany({
        include: {
          checks: {
            orderBy: { checkedAt: "desc" },
            take: 1,
          },
        },
      })
    } catch {
      return
    }

    for (const svc of services) {
      const last = svc.checks[0]
      const intervalMs = svc.intervalMinutes * 60 * 1000
      if (last && Date.now() - last.checkedAt.getTime() < intervalMs) continue
      ping(svc.id, svc.url, svc.expectedStatus)
    }
  })
}
