import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  deleteDoc,
  query,
  where,
  type DocumentData
} from 'firebase/firestore'
import type { User } from 'firebase/auth'

export const useAllowedUsers = () => {
  const { db } = useFirebase()
  
  const isUserAllowed = async (user: User | null): Promise<boolean> => {
    if (!user || !user.email) {
      return false
    }
    
    try {
      // Normalize email to lowercase and trim (same as when adding users)
      const normalizedEmail = user.email.toLowerCase().trim()
      
      const allowedUsersRef = collection(db, 'allowedUsers')
      const q = query(allowedUsersRef, where('email', '==', normalizedEmail))
      const querySnapshot = await getDocs(q)
      
      return !querySnapshot.empty
    } catch (error) {
      console.error('Error checking if user is allowed:', error)
      console.error('User email:', user.email)
      return false
    }
  }
  
  const getAllowedUsers = async (): Promise<DocumentData[]> => {
    try {
      const allowedUsersRef = collection(db, 'allowedUsers')
      const querySnapshot = await getDocs(allowedUsersRef)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error getting allowed users:', error)
      return []
    }
  }
  
  const addAllowedUser = async (email: string, name?: string) => {
    try {
      const allowedUsersRef = collection(db, 'allowedUsers')
      await addDoc(allowedUsersRef, {
        email: email.toLowerCase().trim(),
        name: name || email,
        createdAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error adding allowed user:', error)
      throw error
    }
  }
  
  const removeAllowedUser = async (userId: string) => {
    try {
      const userDoc = doc(db, 'allowedUsers', userId)
      await deleteDoc(userDoc)
    } catch (error) {
      console.error('Error removing allowed user:', error)
      throw error
    }
  }
  
  return {
    isUserAllowed,
    getAllowedUsers,
    addAllowedUser,
    removeAllowedUser
  }
}

