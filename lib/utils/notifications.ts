/**
 * NotificationProvider helper class
 * Abstraction layer for multi-channel notifications (In-app, Email, WhatsApp)
 */
export class NotificationProvider {
  /**
   * Send a notification to a specific user
   * @param params Notification payload details
   */
  static async send({
    recipientId,
    recipientEmail,
    recipientPhone,
    title,
    body,
    channels = ['in-app'],
  }: {
    recipientId: string
    recipientEmail?: string
    recipientPhone?: string
    title: string
    body: string
    channels?: ('in-app' | 'email' | 'whatsapp')[]
  }) {
    console.log(`[Notification] Dispatching alert: "${title}"`)
    console.log(`[Notification] Recipient ID: ${recipientId}`)

    const results: Record<string, boolean> = {}

    for (const channel of channels) {
      try {
        if (channel === 'in-app') {
          // Log inside DB audit log or console
          console.log(`[Notification][In-App] Saved: ${title} - ${body}`)
          results['in-app'] = true
        }

        if (channel === 'email') {
          if (recipientEmail) {
            console.log(`[Notification][Email] Sent to ${recipientEmail}: ${title} - ${body}`)
            // PLACEHOLDER: Integrate Nodemailer, Resend, or SendGrid here
            // await sendEmail({ to: recipientEmail, subject: title, html: body })
            results['email'] = true
          } else {
            console.log(`[Notification][Email] Skipped: No email provided.`)
            results['email'] = false
          }
        }

        if (channel === 'whatsapp') {
          if (recipientPhone) {
            console.log(`[Notification][WhatsApp] Sent to ${recipientPhone}: ${body}`)
            // PLACEHOLDER: Integrate Twilio or Fonnte API here
            // await sendWhatsApp(recipientPhone, body)
            results['whatsapp'] = true
          } else {
            console.log(`[Notification][WhatsApp] Skipped: No phone number provided.`)
            results['whatsapp'] = false
          }
        }
      } catch (err) {
        console.error(`[Notification][Error] Failed to send on channel ${channel}:`, err)
        results[channel] = false
      }
    }

    return { success: Object.values(results).some((r) => r), results }
  }

  /**
   * Broadcast escalations to Kepala Desa / Pemdes
   */
  static async sendEskalasiKades(ticketNo: string, bidang: string, daysDelay: number) {
    const title = `🚨 ESKALASI TIKET: ${ticketNo} Lewat Batas Waktu!`
    const body =
      `Yth. Kepala Desa / Pemdes Lemahduwur,\n\n` +
      `Tiket rujukan pelayanan 6 SPM nomor ${ticketNo} untuk bidang ${bidang.toUpperCase()} ` +
      `belum mengalami perubahan status atau belum diselesaikan selama lebih dari ${daysDelay} hari kerja.\n\n` +
      `Mohon segera menindaklanjuti atau berkoordinasi dengan petugas/OPD terkait.`

    // In a real system, we would query the database for users with role 'pemdes' and fetch their phone/email
    // Here we simulate the broadcast to Pemdes users
    return this.send({
      recipientId: 'pemdes-kades-id',
      recipientEmail: 'kades@lemahduwur.desa.id',
      recipientPhone: '081234567890', // Example Kades phone number
      title,
      body,
      channels: ['in-app', 'email', 'whatsapp'],
    })
  }
}
