export default defineNuxtPlugin(() => {
  // Initialize Firebase on client side
  const { app } = useFirebase()
  
  // Firebase is now initialized and ready to use
  return {
    provide: {
      firebase: app
    }
  }
})

