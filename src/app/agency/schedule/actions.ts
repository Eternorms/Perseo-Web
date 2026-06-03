'use server'

import { createClient } from '@/lib/supabase/server'

export async function cancelScheduledPostAction(postId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('social_posts')
    .update({ status: 'cancelled' })
    .eq('id', postId)
    .eq('status', 'pending')
  return error ? { error: error.message } : { error: null }
}
