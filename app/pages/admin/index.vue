<script setup lang="ts">
const { user, isAuthenticated, loading, signOut } = useAuth();
const { getAllowedUsers, addAllowedUser, removeAllowedUser } =
  useAllowedUsers();

const allowedUsers = ref<any[]>([]);
const loadingUsers = ref(false);
const newUserEmail = ref("");
const newUserName = ref("");
const addingUser = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

// Redirect to home if not authenticated
if (process.client && !loading.value && !isAuthenticated.value) {
  await navigateTo("/");
}

const loadUsers = async () => {
  loadingUsers.value = true;
  try {
    allowedUsers.value = await getAllowedUsers();
  } catch (error) {
    console.error("Error loading users:", error);
  } finally {
    loadingUsers.value = false;
  }
};

const handleAddUser = async () => {
  if (!newUserEmail.value.trim()) {
    errorMessage.value = "E-post er påkrevd";
    return;
  }

  addingUser.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await addAllowedUser(
      newUserEmail.value.trim(),
      newUserName.value.trim() || undefined
    );
    successMessage.value = "Bruker lagt til";
    newUserEmail.value = "";
    newUserName.value = "";
    await loadUsers();
  } catch (error: any) {
    errorMessage.value = error.message || "Kunne ikke legge til bruker";
  } finally {
    addingUser.value = false;
  }
};

const handleRemoveUser = async (userId: string) => {
  if (!confirm("Er du sikker på at du vil fjerne denne brukeren?")) {
    return;
  }

  try {
    await removeAllowedUser(userId);
    successMessage.value = "Bruker fjernet";
    await loadUsers();
  } catch (error: any) {
    errorMessage.value = error.message || "Kunne ikke fjerne bruker";
  }
};

const handleSignOut = async () => {
  try {
    await signOut();
    await navigateTo("/");
  } catch (error) {
    console.error("Sign out failed:", error);
  }
};

// Load users on mount
onMounted(() => {
  if (isAuthenticated.value) {
    loadUsers();
  }
});
</script>

<template>
  <div class="admin-container">
    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="!isAuthenticated" class="unauthorized">
      <h2>Unauthorized</h2>
      <p>Du må være logget på for å se denne siden...</p>
      <NuxtLink to="/" class="btn">Go Home</NuxtLink>
    </div>

    <div v-else class="admin-content">
      <h1>Admin Panel</h1>
      <div class="user-info">
        <p>Velkommen, {{ user?.displayName || user?.email }}</p>
        <img
          v-if="user?.photoURL"
          :src="user.photoURL"
          :alt="user.displayName || 'User'"
          class="avatar"
        />
      </div>

      <div class="admin-section">
        <h2>Administrer Tillatte Brukere</h2>

        <div v-if="errorMessage" class="message error">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="message success">
          {{ successMessage }}
        </div>

        <div class="add-user-form">
          <h3>Legg til ny bruker</h3>
          <div class="form-group">
            <label for="email">E-post *</label>
            <input
              id="email"
              v-model="newUserEmail"
              type="email"
              placeholder="bruker@example.com"
              class="input"
            />
          </div>
          <div class="form-group">
            <label for="name">Navn (valgfritt)</label>
            <input
              id="name"
              v-model="newUserName"
              type="text"
              placeholder="Brukerens navn"
              class="input"
            />
          </div>
          <button
            @click="handleAddUser"
            :disabled="addingUser"
            class="btn btn-primary"
          >
            {{ addingUser ? "Legger til..." : "Legg til bruker" }}
          </button>
        </div>

        <div class="users-list">
          <h3>Tillatte brukere ({{ allowedUsers.length }})</h3>
          <div v-if="loadingUsers" class="loading-text">Laster brukere...</div>
          <div v-else-if="allowedUsers.length === 0" class="empty-state">
            Ingen tillatte brukere ennå. Legg til en bruker for å begynne.
          </div>
          <div v-else class="users-grid">
            <div
              v-for="allowedUser in allowedUsers"
              :key="allowedUser.id"
              class="user-card"
            >
              <div class="user-details">
                <div class="user-name">
                  {{ allowedUser.name || allowedUser.email }}
                </div>
                <div class="user-email">{{ allowedUser.email }}</div>
                <div v-if="allowedUser.createdAt" class="user-date">
                  Lagt til:
                  {{
                    new Date(allowedUser.createdAt).toLocaleDateString("no-NO")
                  }}
                </div>
              </div>
              <button
                @click="handleRemoveUser(allowedUser.id)"
                class="btn btn-danger"
              >
                Fjern
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="admin-actions">
        <button @click="handleSignOut" class="btn btn-outline">Logg ut</button>
        <NuxtLink to="/" class="btn btn-outline">Hjem</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  min-height: 100vh;
  padding: 2rem;
  background: #000;
  color: #fff;
}

.loading,
.unauthorized {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1rem;
  text-align: center;
}

.admin-content {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

h1 {
  font-size: 2.5rem;
  margin: 0;
}

h2 {
  font-size: 1.5rem;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid #fff;
}

.admin-section {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.btn-outline {
  background: transparent;
  color: white;
  border: 2px solid #fff;
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-primary {
  background: #4285f4;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #357ae8;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-danger:hover {
  background: #c82333;
}

.message {
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.message.error {
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid #dc3545;
  color: #ff6b6b;
}

.message.success {
  background: rgba(40, 167, 69, 0.1);
  border: 1px solid #28a745;
  color: #51cf66;
}

.add-user-form {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.5rem;
}

.add-user-form h3 {
  margin-top: 0;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #ccc;
}

.input {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: #fff;
  font-size: 1rem;
}

.input:focus {
  outline: none;
  border-color: #4285f4;
  background: rgba(255, 255, 255, 0.15);
}

.input::placeholder {
  color: #888;
}

.users-list h3 {
  margin-bottom: 1rem;
}

.loading-text,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #888;
}

.users-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.user-email {
  color: #aaa;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.user-date {
  color: #888;
  font-size: 0.75rem;
}

.admin-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
</style>
