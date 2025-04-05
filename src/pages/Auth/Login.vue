<template>
    <v-container
      class="d-flex justify-center align-center"
    >
      <v-alert v-if="errorMessage" type="error" class="mb-4 alert">{{ errorMessage }}</v-alert>
      <v-card class="pa-4 auth-form" max-width="500px" width="100%">
        <v-card-title class="text-h5 text-center margin-bottom">
          Вход в систему
        </v-card-title>
        
        <v-form @submit.prevent="login">
          <v-text-field
            v-model="credentials.login"
            label="Логин"
            outlined
            prepend-icon="mdi-account"
            required
            class="mb-4"
          />
          
          <v-text-field
            v-model="credentials.password"
            label="Пароль"
            type="password"
            outlined
            prepend-icon="mdi-lock"
            required
            class="mb-4"
          />
          
          <v-btn
            type="submit"
            color="primary"
            block
            :loading="loading"
            class="mb-4"
          >
            Войти
          </v-btn>
          
          <v-divider class="my-4" />
  
          <v-row>
            <v-col cols="12" class="text-center">
              <v-btn text @click="goToForgotPassword">Забыли пароль?</v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card>
    </v-container>
  </template>
  
<script setup>
  import { ref, inject } from "vue";
  import { useRouter } from 'vue-router';
  const api = inject('api');

  const credentials = ref({ login: "", password: "" });
  const loading = ref(false);
  const errorMessage = ref(null);
  const router = useRouter();
  const permissions = inject('permissions');
  
  const login = async () => {
    try {
      loading.value = true;
      errorMessage.value = null;

      console.log("API baseURL:", api.defaults.baseURL);
    
      const response = await api.post('/api/Account/login', {
        login: credentials.value.login,
        password: credentials.value.password
      });

      console.log('Ответ сервера:', response);

      const { accessToken, refreshToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      permissions.isAuthenticated.value = true;
      await permissions.fetchPermissions();

      router.push("/profile");
    } catch (error) {
      errorMessage.value = error.response?.data?.message || "Ошибка входа";
    } finally {
      loading.value = false;
    }
  };
  
  const goToForgotPassword = () => {
    router.push("/forgot-password");
  };
</script>

  