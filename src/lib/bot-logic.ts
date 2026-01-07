import { supabaseAdmin } from './supabase'
import { sendMessage, editMessageText, answerCallbackQuery, KEYBOARDS } from './telegram'
import { BotState, TelegramUpdate } from './types'

export async function processUpdate(update: TelegramUpdate) {
  // 1. Extract Info
  const message = update.message
  const callback = update.callback_query
  
  const fromId = message?.from.id || callback?.from.id
  const chatId = message?.chat.id || callback?.message.chat.id
  const text = message?.text
  const data = callback?.data

  if (!fromId || !chatId) return

  // 2. Get Current State
  const { data: stateData, error: stateError } = await supabaseAdmin
    .from('bot_state')
    .select('*')
    .eq('telegram_id', fromId)
    .single()

  let currentState: BotState = stateData?.current_state || 'idle'
  let payload = stateData?.payload || {}

  // 3. Global Commands (Reset)
  if (text === '/start' || data === 'menu_main') {
    currentState = 'idle'
    payload = {}
    await updateState(fromId, currentState, payload)
    
    if (callback) {
        // If coming from callback (back button), edit message
        await editMessageText(chatId, callback.message.message_id, '👋 Selamat datang di <b>Game Top Up Bot</b>!\nSilahkan pilih menu dibawah:', KEYBOARDS.mainMenu)
        await answerCallbackQuery(callback.id)
    } else {
        await sendMessage(chatId, '👋 Selamat datang di <b>Game Top Up Bot</b>!\nSilahkan pilih menu dibawah:', KEYBOARDS.mainMenu)
    }
    return
  }

  // 4. State Machine
  try {
    switch (currentState) {
      case 'idle':
        if (data === 'menu_topup') {
          await updateState(fromId, 'select_game', {})
          await editMessageText(chatId, callback!.message.message_id, '🎮 Pilih Game:', KEYBOARDS.games)
          await answerCallbackQuery(callback!.id)
        } else if (data === 'menu_status') {
           // Check orders logic
           await answerCallbackQuery(callback!.id, 'Fitur Cek Status belum diaktifkan.')
        } else if (data === 'menu_help') {
           await answerCallbackQuery(callback!.id, 'Hubungi Admin untuk bantuan.')
        }
        break

      case 'select_game':
        if (data?.startsWith('game_')) {
          const game = data.replace('game_', '').toUpperCase()
          // Update State
          await updateState(fromId, 'input_id', { game })
          // Prompt User
          await editMessageText(chatId, callback!.message.message_id, `🎮 Kamu memilih <b>${game}</b>.\n\nSilahkan kirim <b>User ID</b> (dan Server ID) Anda.\nContoh: 12345678 (1234)`)
          await answerCallbackQuery(callback!.id)
        }
        break

      case 'input_id':
        if (text) {
          // Validate input?
          const userGameId = text.trim()
          // Move to Select Nominal
          await updateState(fromId, 'select_nominal', { ...payload, userGameId })
          await sendMessage(chatId, `🆔 ID: ${userGameId}\n\nSilahkan pilih nominal:`, KEYBOARDS.nominals(payload.game))
        }
        break

      case 'select_nominal':
        if (data?.startsWith('nom_')) {
          const nom = data.replace('nom_', '')
          // Hardcoded Logic for Price (In real app, fetch from DB/API)
          const priceMap: Record<string, number> = { '100': 15000, '300': 45000, '500': 75000 }
          const price = priceMap[nom] || 0
          
          await updateState(fromId, 'confirmation', { ...payload, nominal: nom, price })
          
          const summary = `📋 <b>Konfirmasi Pesanan</b>\n\n` +
                          `🎮 Game: ${payload.game}\n` +
                          `🆔 ID: ${payload.userGameId}\n` +
                          `💎 Item: ${nom} Diamonds\n` +
                          `💰 Harga: Rp ${price.toLocaleString()}\n\n` +
                          `Apakah data sudah benar?`
          
          await editMessageText(chatId, callback!.message.message_id, summary, KEYBOARDS.confirm)
          await answerCallbackQuery(callback!.id)
        }
        break

      case 'confirmation':
        if (data === 'action_confirm_pay') {
           // Create Order
           const orderCode = `TRX-${Date.now().toString().slice(-6)}`
           const { error: orderError } = await supabaseAdmin.from('orders').insert({
              order_code: orderCode,
              telegram_id: fromId,
              game: payload.game,
              user_game_id: payload.userGameId,
              server_id: '',
              nominal: payload.nominal,
              price: payload.price,
              payment_status: 'UNPAID',
              order_status: 'PENDING'
           })

           if (orderError) {
             console.error('Order Error', orderError)
             await answerCallbackQuery(callback!.id, 'Gagal membuat pesanan.')
             return
           }

           await updateState(fromId, 'waiting_payment', { ...payload, orderCode })
           
           const paymentMsg = `💳 <b>Metode Pembayaran</b>\n\n` +
                              `Transfer <b>Rp ${payload.price.toLocaleString()}</b> ke:\n` +
                              `BCA: 123456789 (Admin)\n` +
                              `Berita: ${orderCode}\n\n` +
                              `Jika sudah transfer, klik tombol dibawah.`
           
           await editMessageText(chatId, callback!.message.message_id, paymentMsg, KEYBOARDS.payment)
           await answerCallbackQuery(callback!.id)
        }
        break

      case 'waiting_payment':
         if (data === 'action_paid') {
            const code = payload.orderCode
            
            // Mark as UNPAID (User claims paid, but Admin must verify) -> Actually we keep it UNPAID but status PROCESSING?
            // User requested: "Admin update status: /approve {order_code}"
            
            await supabaseAdmin.from('orders').update({ order_status: 'PROCESSING' }).eq('order_code', code)
            
            await updateState(fromId, 'waiting_admin', { ...payload })
            
            await editMessageText(chatId, callback!.message.message_id, '⏳ <b>Pesanan Diproses</b>\n\nAdmin sedang mengecek pembayaran Anda. Mohon tunggu notifikasi selanjutnya.')
            await answerCallbackQuery(callback!.id)

            // Notify Admin
            const adminId = process.env.TELEGRAM_ADMIN_ID
            if (adminId) {
                await sendMessage(parseInt(adminId), `🔔 <b>Pesanan Baru!</b>\nCode: ${code}\nUser: ${fromId}\nGame: ${payload.game}\nNominal: ${payload.nominal}\n\nMohon cek pembayaran.`)
            }
         }
         break
         
      case 'waiting_admin':
         // Just wait, maybe handle text to say "Please wait"
         if (text) {
             await sendMessage(chatId, '⏳ Mohon tunggu verifikasi admin.')
         }
         break
    }
  } catch (err) {
    console.error('Bot Logic Error', err)
    await sendMessage(chatId, '❌ Terjadi kesalahan sistem. Ketik /start untuk ulang.')
  }
}

async function updateState(telegramId: number, state: BotState, payload: any) {
    const { error } = await supabaseAdmin.from('bot_state').upsert({
        telegram_id: telegramId,
        current_state: state,
        payload: payload,
        updated_at: new Date().toISOString()
    })
    if (error) console.error('State Update Error', error)
}
