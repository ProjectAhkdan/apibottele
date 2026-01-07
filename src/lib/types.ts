export type BotState = 
  | 'idle'
  | 'select_game'
  | 'input_id'
  | 'select_nominal'
  | 'confirmation'
  | 'waiting_payment'
  | 'waiting_admin'

export interface BotStateRow {
  telegram_id: number
  current_state: BotState
  payload: any
  updated_at: string
}

export interface OrderRow {
  id: string
  order_code: string
  telegram_id: number
  game: string
  user_game_id: string
  server_id: string
  nominal: string
  price: number
  payment_status: 'UNPAID' | 'PAID'
  order_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'
  created_at: string
}

export interface GameRow {
  id: string
  code: string
  name: string
  is_active: boolean
  created_at: string
}

export interface PricelistRow {
  id: string
  game_id: string
  item_name: string
  nominal: number
  price: number
  is_active: boolean
  created_at: string
}

export interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      is_bot: boolean
      first_name: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    text?: string
  }
  callback_query?: {
    id: string
    from: {
      id: number
      first_name: string
    }
    message: {
      message_id: number
      chat: {
        id: number
      }
      text?: string
    }
    data: string
  }
}
