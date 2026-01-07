import { supabaseAdmin } from '@/lib/supabase'
import { approveOrder, rejectOrder } from '@/app/actions' // Server Actions
import { OrderRow } from '@/lib/types'
import { revalidatePath } from 'next/cache'

// We need a Client Component for interactivity (Buttons), or we use a Server Component with Form Actions.
// Let's use a Server Component listing with Client Component buttons or Forms.
// Using Forms is easiest for Server Actions.

export default async function OrdersPage() {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-4 text-red-500">Error fetching orders: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {(orders as OrderRow[]).map((order) => (
            <li key={order.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-600 truncate">{order.order_code}</p>
                  <p className="text-sm text-gray-500">{order.game} - {order.nominal}</p>
                  <p className="text-sm text-gray-500">ID: {order.user_game_id} {order.server_id ? `(${order.server_id})` : ''}</p>
                  <p className="text-sm font-bold text-gray-900">Rp {order.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                
                <div className="ml-4 flex-shrink-0 flex flex-col items-end space-y-2">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${order.order_status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                      order.order_status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {order.order_status}
                  </span>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                     ${order.payment_status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {order.payment_status}
                  </span>

                  {order.order_status === 'PROCESSING' && ( // Or PENDING depending on flow
                    <div className="flex space-x-2 mt-2">
                      <form action={async () => {
                        'use server'
                        await approveOrder(order.id, order.order_code, order.telegram_id, order.game, order.nominal)
                        revalidatePath('/admin/orders')
                      }}>
                        <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
                          Approve
                        </button>
                      </form>

                      <form action={async () => {
                        'use server'
                        await rejectOrder(order.id, order.order_code, order.telegram_id, 'Pembayaran tidak valid')
                        revalidatePath('/admin/orders')
                      }}>
                        <button type="submit" className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700">
                          Reject
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
