import { supabase } from './supabaseClient'
import type { AppState } from '@/types'

class AppStateService {
  async loadAppState(): Promise<AppState | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return null

      const { data, error } = await supabase
        .from('app_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error

      if (!data) return null

      return {
        currentStep: data.current_step,
        formData: data.form_data,
        selectedDocuments: data.selected_documents,
        isGenerating: false,
        darkMode: data.dark_mode
      }
    } catch (error) {
      console.error('Error loading app state:', error)
      return null
    }
  }

  async saveAppState(state: AppState): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.error('No authenticated user')
        return
      }

      const { data: existingState } = await supabase
        .from('app_state')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingState) {
        const { error } = await supabase
          .from('app_state')
          .update({
            current_step: state.currentStep,
            form_data: state.formData,
            selected_documents: state.selectedDocuments,
            dark_mode: state.darkMode,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingState.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('app_state')
          .insert({
            user_id: user.id,
            current_step: state.currentStep,
            form_data: state.formData,
            selected_documents: state.selectedDocuments,
            dark_mode: state.darkMode
          })

        if (error) throw error
      }
    } catch (error) {
      console.error('Error saving app state:', error)
    }
  }

  async clearAppState(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from('app_state')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Error clearing app state:', error)
    }
  }
}

export const appStateService = new AppStateService()
