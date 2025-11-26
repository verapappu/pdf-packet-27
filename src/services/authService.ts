import { supabase } from './supabaseClient'

export class AuthService {
  async signInAdmin(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { user: data.user }
    } catch (err) {
      if (err instanceof Error) {
        throw err
      }
      throw new Error('Authentication failed')
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (err) {
      console.error('Sign out error:', err)
      throw err
    }
  }

  async getUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (err) {
      console.error('Get user error:', err)
      return null
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return !!user
    } catch {
      return false
    }
  }

  onAuthStateChange(callback: (isAuthenticated: boolean) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        callback(!!session?.user)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }
}

export const authService = new AuthService()
