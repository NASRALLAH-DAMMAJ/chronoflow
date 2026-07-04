import { EDGE_FUNCTIONS } from '../store/constants'
import { blockFromDb } from './blocks'
import { withRetry } from './retry'

export async function fetchSchedule(supabase, dateStr) {
  return withRetry(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No session')

    const { data, error } = await supabase.functions.invoke(EDGE_FUNCTIONS.SCHEDULE, {
      body: { date: dateStr },
    })

    if (error) throw new Error(`Schedule function error: ${error.message}`)

    return (data.blocks || []).map(blockFromDb)
  })
}
