<template>
    <div style='text-align: center; padding: 50px;'>
      <h1 style='font-size: 3rem; color: red;'>Личный кабинет</h1>

      <v-alert v-if="successMessage" type="success" class="mb-4 alert">{{ successMessage }}</v-alert>
      <v-alert v-if="errorMessage" type="error" class="mb-4 alert">{{ errorMessage }}</v-alert>

      <v-btn 
        @click="handleLogout" 
        :loading="loading"
        color="error"
      >
        Выйти
      </v-btn>

      <div v-if="permissions.hasPermission('Task')">
        <p>Здесь доступны функции для модуля Task</p>
      </div>
      <div v-if="permissions.hasPermission('Role')">
        <p>Здесь доступны функции для модуля Role</p>
      </div>
      <div v-if="permissions.hasPermission('User')">
        <p>Здесь доступны функции для модуля User</p>
      </div>
    </div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const permissions = inject('permissions');
const successMessage = ref(null);
const errorMessage = ref(null);
const loading = ref(false);

const handleLogout = async () => {
  try {
    loading.value = true;
    successMessage.value = null;
    errorMessage.value = null;
    await permissions.logout();
    
    successMessage.value = "Вы успешно вышли из системы";
    setTimeout(() => router.push('/login'), 1000);
    
  } catch (error) {
    errorMessage.value = error.message || "Ошибка при выходе";
  } finally {
    loading.value = false;
  }
};

</script>