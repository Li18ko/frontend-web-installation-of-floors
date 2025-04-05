<script setup>
import { inject, onMounted } from 'vue';

const permissions = inject('permissions');

onMounted(async () => {
  try {
    await permissions.fetchPermissions();
  } catch (error) {
    console.error('Failed to fetch permissions:', error);
  }
});
</script>


<template>
  <v-app>
    <v-app-bar app class="pl-4 pr-4" v-if="permissions.isAuthenticated.value">
      <v-btn v-if="permissions.hasPermission('TaskList')" text to="/tasks">Задачи</v-btn>
      <v-btn v-if="permissions.hasPermission('UserList')" text to="/users">Пользователи</v-btn>
      <v-btn v-if="permissions.hasPermission('RoleList')" text to="/roles">Роли</v-btn>
      <v-btn text to="/profile">Личный кабинет</v-btn>
    </v-app-bar>

    <v-main>
      <router-view></router-view>
    </v-main>

    <v-footer app class="elevation-5" v-if="permissions.isAuthenticated.value">
      <v-row justify="center">
          <v-col class="text-center">
            <p>Контакты</p>
          </v-col>
        </v-row>
    </v-footer>
  </v-app>
</template>


<style scoped>
</style>

