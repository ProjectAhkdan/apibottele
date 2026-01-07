'use server'

import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMessage } from '@/lib/telegram'

export async function adminLogin(password: string) {
  if (password === process.env.ADMIN_PASSWORD) {
    (await cookies()).set('admin_session', 'true', { httpOnly: true, secure: true })
    return { success: true }
  }
  return { success: false }
}

export async function approveOrder(orderId: string, orderCode: string, telegramId: number, game: string, nominal: string) {
  // Update DB
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ 
        order_status: 'COMPLETED', 
        payment_status: 'PAID' 
    })
    .eq('id', orderId)

  if (error) return { success: false, error: error.message }

  // Notify User
  await sendMessage(telegramId, `✅ <b>Top Up Berhasil!</b>\n\nGame: ${game}\nItem: ${nominal}\n\nPesanan ${orderCode} telah selesai. Terima kasih!`)

  return { success: true }
}

export async function rejectOrder(orderId: string, orderCode: string, telegramId: number, reason: string) {
  // Update DB
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ 
        order_status: 'REJECTED' 
    })
    .eq('id', orderId)

  if (error) return { success: false, error: error.message }

  // Notify User
  await sendMessage(telegramId, `❌ <b>Pesanan Dibatalkan</b>\n\nOrder: ${orderCode}\nAlasan: ${reason}`)

  return { success: true }
}
