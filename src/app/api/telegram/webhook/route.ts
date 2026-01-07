import { NextResponse } from 'next/server'
import { processUpdate } from '@/lib/bot-logic'
import { TelegramUpdate } from '@/lib/types'

export const POST = async (request: Request) => {
  try {
    // Optional: Secret token validation (X-Telegram-Bot-Api-Secret-Token)

    const update: TelegramUpdate = await request.json()
    
    // Log incoming update for debug
    console.log('Incoming Webhook Update:', JSON.stringify(update, null, 2))

    await processUpdate(update)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook Error:', error)
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export const GET = async () => {
  return NextResponse.json({ status: 'Webhook is active' })
}
