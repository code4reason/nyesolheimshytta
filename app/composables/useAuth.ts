import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

// Session TTL configuration
// Can be overridden with NUXT_PUBLIC_SESSION_TTL_HOURS environment variable
// Default: 24 hours
const DEFAULT_SESSION_TTL_HOURS = 24;

const getSessionTTL = () => {
  const config = useRuntimeConfig();
  const hours = config.public.sessionTtlHours || DEFAULT_SESSION_TTL_HOURS;
  return hours * 60 * 60 * 1000;
};

export const useAuth = () => {
  const { auth } = useFirebase();
  const { isUserAllowed } = useAllowedUsers();
  const user = useState<User | null>("auth_user", () => null);
  const isAllowed = useState<boolean>("auth_allowed", () => false);
  const loading = useState<boolean>("auth_loading", () => true);
  const initialized = useState<boolean>("auth_initialized", () => false);
  const sessionStartTime = useState<number | null>(
    "auth_session_start",
    () => null
  );

  // Check if session has expired
  const checkSessionExpiry = () => {
    if (sessionStartTime.value) {
      const now = Date.now();
      const elapsed = now - sessionStartTime.value;
      const sessionTTL = getSessionTTL();

      if (elapsed > sessionTTL) {
        // Session expired, sign out
        console.log("Session expired, signing out...");
        firebaseSignOut(auth);
        user.value = null;
        isAllowed.value = false;
        sessionStartTime.value = null;
        return true;
      }
    }
    return false;
  };

  // Get remaining session time in milliseconds
  const getRemainingSessionTime = (): number => {
    if (!sessionStartTime.value) return 0;
    const now = Date.now();
    const elapsed = now - sessionStartTime.value;
    const sessionTTL = getSessionTTL();
    return Math.max(0, sessionTTL - elapsed);
  };

  // Initialize auth state listener - only once per app lifecycle
  if (process.client && !initialized.value) {
    initialized.value = true;

    // Check session expiry every minute
    const expiryCheckInterval = setInterval(() => {
      if (user.value && sessionStartTime.value) {
        checkSessionExpiry();
      }
    }, 60 * 1000); // Check every minute

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      user.value = firebaseUser;
      if (firebaseUser) {
        // Check if session has expired
        if (checkSessionExpiry()) {
          return;
        }

        // Set session start time if not set
        if (!sessionStartTime.value) {
          sessionStartTime.value = Date.now();
        }

        // Check if user is allowed
        const allowed = await isUserAllowed(firebaseUser);
        isAllowed.value = allowed;

        // If user is not allowed, sign them out
        if (!allowed) {
          await firebaseSignOut(auth);
          user.value = null;
          sessionStartTime.value = null;
        }
      } else {
        isAllowed.value = false;
        sessionStartTime.value = null;
      }
      loading.value = false;
    });

    // Cleanup on unmount
    onUnmounted(() => {
      unsubscribe();
      clearInterval(expiryCheckInterval);
    });
  }

  const isAuthenticated = computed(() => !!user.value && isAllowed.value);

  const signInWithGoogle = async () => {
    try {
      loading.value = true;
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Check if user is allowed
      const allowed = await isUserAllowed(result.user);

      if (!allowed) {
        // Sign out if not allowed
        await firebaseSignOut(auth);
        user.value = null;
        isAllowed.value = false;
        loading.value = false;
        throw new Error(
          "Du har ikke tilgang til denne applikasjonen. Kontakt administrator."
        );
      }

      // The onAuthStateChanged listener will update user.value automatically
      // But we also set it here for immediate UI update
      user.value = result.user;
      isAllowed.value = true;
      sessionStartTime.value = Date.now(); // Set session start time
      loading.value = false;
      return result.user;
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      loading.value = false;
      throw error;
    }
  };

  const signOut = async () => {
    try {
      loading.value = true;
      await firebaseSignOut(auth);
      // The onAuthStateChanged listener will update user.value automatically
      user.value = null;
      isAllowed.value = false;
      sessionStartTime.value = null; // Clear session start time
      loading.value = false;
    } catch (error: any) {
      console.error("Error signing out:", error);
      loading.value = false;
      throw error;
    }
  };

  return {
    user,
    isAuthenticated,
    isAllowed,
    loading,
    signInWithGoogle,
    signOut,
    getRemainingSessionTime,
  };
};
