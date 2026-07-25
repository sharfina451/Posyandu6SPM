import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NotificationProvider } from '@/lib/utils/notifications'

export async function GET(request: Request) {
  // Simple authorization check using a bearer token or secret header in production
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient()

  // 1. Fetch tickets that exceed SLA or need escalation
  const { data: tickets, error } = await supabase
    .from('v_tiket_sla')
    .select('id, nomor_tiket, bidang, status, lewat_sla, perlu_eskalasi')
    .or('lewat_sla.eq.true,perlu_eskalasi.eq.true')

  if (error) {
    console.error('[Cron SLA] Error fetching tickets:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  console.log(`[Cron SLA] Found ${tickets?.length || 0} tickets needing attention.`)

  let processedCount = 0
  const alertsSent = []

  // 2. Loop through tickets and send notifications
  if (tickets && tickets.length > 0) {
    for (const ticket of tickets) {
      try {
        const delayDays = ticket.lewat_sla ? 5 : 3
        await NotificationProvider.sendEskalasiKades(ticket.nomor_tiket, ticket.bidang, delayDays)

        // Write a system audit log for the automatic escalation
        await supabase.from('audit_log').insert([
          {
            aksi: 'sync',
            tabel: 'tiket',
            record_id: ticket.id,
            data_baru: {
              cron_event: 'auto_escalation',
              nomor_tiket: ticket.nomor_tiket,
              lewat_sla: ticket.lewat_sla,
              perlu_eskalasi: ticket.perlu_eskalasi,
            },
          },
        ])

        processedCount++
        alertsSent.push({
          ticket: ticket.nomor_tiket,
          reason: ticket.lewat_sla ? 'overdue' : 'no_update_3_days',
        })
      } catch (err) {
        console.error(
          `[Cron SLA] Failed to process escalation for ticket ${ticket.nomor_tiket}:`,
          err
        )
      }
    }
  }

  return NextResponse.json({
    success: true,
    processed: processedCount,
    alerts: alertsSent,
  })
}
