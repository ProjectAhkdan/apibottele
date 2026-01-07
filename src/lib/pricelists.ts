import { supabaseAdmin } from './supabase'
import { GameRow, PricelistRow } from './types'

export async function getActiveGames() {
  const { data, error } = await supabaseAdmin
    .from('games')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching games:', error)
    return []
  }
  return data as GameRow[]
}

export async function getPricelistByGame(gameCode: string) {
  // First get game ID from code
  const { data: game } = await supabaseAdmin
    .from('games')
    .select('id')
    .eq('code', gameCode)
    .single()

  if (!game) return []

  // Get pricelist
  const { data, error } = await supabaseAdmin
    .from('pricelists')
    .select('*')
    .eq('game_id', game.id)
    .eq('is_active', true)
    .order('price', { ascending: true })

  if (error) {
    console.error('Error fetching pricelist:', error)
    return []
  }
  return data as PricelistRow[]
}

export async function getPricelistItem(pricelistId: string) {
    const { data, error } = await supabaseAdmin
      .from('pricelists')
      .select('*, games(name, code)')
      .eq('id', pricelistId)
      .single()
  
    if (error) {
      console.error('Error fetching item:', error)
      return null
    }
    return data as (PricelistRow & { games: { name: string, code: string } })
  }
