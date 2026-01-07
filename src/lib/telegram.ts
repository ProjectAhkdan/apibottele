import axios from 'axios'

const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

export async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  try {
    await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    })
  } catch (error) {
    console.error('Error sending message:', error)
  }
}

export async function editMessageText(chatId: number, messageId: number, text: string, replyMarkup?: any) {
  try {
    await axios.post(`${TELEGRAM_API_URL}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    })
  } catch (error) {
    // Ignore error if message content is the same (Telegram API error)
    console.error('Error editing message:', error)
  }
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  try {
    await axios.post(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId,
      text,
    })
  } catch (error) {
    console.error('Error answering callback:', error)
  }
}

export const KEYBOARDS = {
  mainMenu: {
    inline_keyboard: [
      [{ text: '🎮 Top Up Game', callback_data: 'menu_topup' }],
      [{ text: '📋 Pricelist', callback_data: 'menu_pricelist' }],
      [{ text: '📦 Cek Status Pesanan', callback_data: 'menu_status' }],
      [{ text: '❓ Bantuan', callback_data: 'menu_help' }],
    ],
  },
  games: {
    inline_keyboard: [
      [{ text: 'Mobile Legends', callback_data: 'game_mlbb' }],
      [{ text: 'Free Fire', callback_data: 'game_ff' }],
      [{ text: 'PUBG Mobile', callback_data: 'game_pubg' }],
      [{ text: '🔙 Kembali', callback_data: 'menu_main' }],
    ],
  },
  nominals: (game: string) => {
    // Example nominals
    return {
      inline_keyboard: [
        [{ text: '💎 100 Diamonds - Rp 15.000', callback_data: 'nom_100' }],
        [{ text: '💎 300 Diamonds - Rp 45.000', callback_data: 'nom_300' }],
        [{ text: '💎 500 Diamonds - Rp 75.000', callback_data: 'nom_500' }],
        [{ text: '🔙 Kembali', callback_data: 'menu_topup' }],
      ],
    }
  },
  confirm: {
    inline_keyboard: [
      [{ text: '✅ Konfirmasi & Bayar', callback_data: 'action_confirm_pay' }],
      [{ text: '❌ Batal', callback_data: 'menu_main' }],
    ],
  },
  payment: {
    inline_keyboard: [
      [{ text: '✅ Saya Sudah Bayar', callback_data: 'action_paid' }],
      [{ text: '❌ Batalkan Pesanan', callback_data: 'menu_main' }],
    ],
  },
}
