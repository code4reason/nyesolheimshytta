import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type Auth
} from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

export const useFirebase = () => {
  const config = useRuntimeConfig()
  
  // Initialize Firebase
  const getApp = (): FirebaseApp => {
    const apps = getApps()
    if (apps.length > 0) {
      return apps[0]
    }
    
    const firebaseConfig = {
      apiKey: config.public.firebaseApiKey,
      authDomain: config.public.firebaseAuthDomain,
      projectId: config.public.firebaseProjectId,
      storageBucket: config.public.firebaseStorageBucket,
      messagingSenderId: config.public.firebaseMessagingSenderId,
      appId: config.public.firebaseAppId
    }
    
    // Debug: Check if API key is set
    if (!firebaseConfig.apiKey) {
      console.error('❌ Firebase API key is missing!')
      console.error('Config check:', {
        hasApiKey: !!config.public.firebaseApiKey,
        hasAuthDomain: !!config.public.firebaseAuthDomain,
        hasProjectId: !!config.public.firebaseProjectId,
        apiKeyLength: config.public.firebaseApiKey?.length || 0,
        authDomain: config.public.firebaseAuthDomain
      })
    } else {
      console.log('✅ Firebase config loaded:', {
        hasApiKey: true,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId
      })
    }
    
    return initializeApp(firebaseConfig)
  }
  
  const app = getApp()
  const auth = getAuth(app)
  const db = getFirestore(app)
  
  return { app, auth, db }
}

