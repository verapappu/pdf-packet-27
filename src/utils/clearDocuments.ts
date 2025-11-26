import { supabase } from '@/services/supabaseClient'

export async function clearAllDocuments(): Promise<void> {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .neq('id', '')

    if (error) throw error

    console.log('Successfully cleared all documents from Supabase')

    window.location.reload()
  } catch (error) {
    console.error('Failed to clear documents:', error)
    throw error
  }
}

if (typeof window !== 'undefined') {
  (window as any).clearAllDocuments = clearAllDocuments
}
