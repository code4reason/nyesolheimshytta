import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'

export const useAuth = () => {
  const { auth } = useFirebase()
  const { isUserAllowed } = useAllowedUsers()
  const user = useState<User | null>('auth_user', () => null)
  const isAllowed = useState<boolean>('auth_allowed', () => false)
  const loading = useState<boolean>('auth_loading', () => true)
  const initialized = useState<boolean>('auth_initialized', () => false)
  
  // Initialize auth state listener - only once per app lifecycle
  if (process.client && !initialized.value) {
    initialized.value = true
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      user.value = firebaseUser
      if (firebaseUser) {
        // Check if user is allowed
        const allowed = await isUserAllowed(firebaseUser)
        isAllowed.value = allowed
        
        // If user is not allowed, sign them out
        if (!allowed) {
          await firebaseSignOut(auth)
          user.value = null
        }
      } else {
        isAllowed.value = false
      }
      loading.value = false
    })
    
    // Cleanup on unmount
    onUnmounted(() => {
      unsubscribe()
    })
  }
  
  const isAuthenticated = computed(() => !!user.value && isAllowed.value)
  
  const signInWithGoogle = async () => {
    try {
      loading.value = true
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      
      // Check if user is allowed
      const allowed = await isUserAllowed(result.user)
      
      if (!allowed) {
        // Sign out if not allowed
        await firebaseSignOut(auth)
        user.value = null
        isAllowed.value = false
        loading.value = false
        throw new Error('Du har ikke tilgang til denne applikasjonen. Kontakt administrator.')
      }
      
      // The onAuthStateChanged listener will update user.value automatically
      // But we also set it here for immediate UI update
      user.value = result.user
      isAllowed.value = true
      loading.value = false
      return result.user
    } catch (error: any) {
      console.error('Error signing in with Google:', error)
      loading.value = false
      throw error
    }
  }
  
  const signOut = async () => {
    try {
      loading.value = true
      await firebaseSignOut(auth)
      // The onAuthStateChanged listener will update user.value automatically
      user.value = null
      isAllowed.value = false
      loading.value = false
    } catch (error: any) {
      console.error('Error signing out:', error)
      loading.value = false
      throw error
    }
  }
  
  return {
    user,
    isAuthenticated,
    isAllowed,
    loading,
    signInWithGoogle,
    signOut
  }
}

