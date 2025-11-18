<script setup lang="ts">
const { user, isAuthenticated, loading, signInWithGoogle, signOut } = useAuth()
const errorMessage = ref<string>('')

const handleSignIn = async () => {
  try {
    errorMessage.value = ''
    await signInWithGoogle()
  } catch (error: any) {
    errorMessage.value = error.message || 'Kunne ikke logge inn. Prøv igjen.'
    console.error('Sign in failed:', error)
  }
}

const handleSignOut = async () => {
  try {
    errorMessage.value = ''
    await signOut()
  } catch (error) {
    console.error('Sign out failed:', error)
  }
}
</script>

<template>
  <div class="container">
    <div class="content">
      <h1>Nye Solheimshytta</h1>
      
      <div v-if="loading" class="auth-status">
        Loading...
      </div>
      
      <div v-else-if="isAuthenticated" class="auth-section">
        <div class="user-info">
          <p>Welcome, {{ user?.displayName || user?.email }}</p>
          <img v-if="user?.photoURL" :src="user.photoURL" :alt="user.displayName || 'User'" class="avatar" />
        </div>
        <button @click="handleSignOut" class="btn btn-outline">Sign Out</button>
      </div>
      
      <div v-else class="auth-section">
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <button @click="handleSignIn" class="btn btn-primary">
          Sign in with Google
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #000;
  color: #fff;
}

.content {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
}

h1 {
  margin: 0;
  font-size: 3rem;
}

.auth-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid #fff;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4285f4;
  color: white;
}

.btn-primary:hover {
  background: #357ae8;
}

.btn-outline {
  background: transparent;
  color: white;
  border: 2px solid #fff;
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
}

.auth-status {
  color: #888;
}

.error-message {
  color: #ff4444;
  background: rgba(255, 68, 68, 0.1);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #ff4444;
  margin-bottom: 1rem;
  max-width: 400px;
}
</style>

