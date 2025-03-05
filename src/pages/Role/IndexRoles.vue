<template>
    <v-container>
      <div style="display: flex; align-items: center;">
        <h1>Роли</h1>
        <v-spacer></v-spacer>
        <v-btn color="green" text to="/roles/add">Добавить</v-btn>
      </div>
      <br>
      
      <v-progress-circular v-if="loading" indeterminate color="primary" 
          style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000;"></v-progress-circular>
  
      <v-alert v-if="error" type="error" style="position: fixed; top: 20px; right: 20px; z-index: 2401;">{{ error }}</v-alert>
  
      <v-alert v-if="successMessage" type="success" dismissible @input="successMessage = false"
          style="position: fixed; top: 20px; right: 20px; z-index: 2401;">Роль удалена!</v-alert>
  
      <v-table :height="'500px'" :density="'comfortable'" fixed-header>
        <thead>
          <tr>
            <th>Роль</th>
            <th>Активность</th>
            <th>Функции</th>
            <th>Действие</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item) in roles" :key="item.id">
            <td>
              <router-link :to="{ name: 'EditRole', params: { id: item.id } }" style="color:black">{{ item.name
              }}</router-link>
            </td>
            <td>{{ item.active }}</td>
            <td>{{ item.functions.map(f => f.name).join(', ') }}</td>
            <td>
              <v-tooltip text="Редактировать роль">
                <template v-slot:activator="{ props }">
                  <v-btn size="30" v-bind="props" @click="editRole(item.id)">
                    <v-icon size="25">mdi-pencil</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
  
              <v-tooltip text="Удалить роль">
                <template v-slot:activator="{ props }">
                  <v-btn size="30" v-bind="props" @click="confirmDelete(item.id)">
                    <v-icon size="25" color="red">mdi-close-circle</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
            </td>
          </tr>
        </tbody>
      </v-table>
  
      <v-dialog v-model="dialog" max-width="400px">
        <v-card>
          <v-card-title class="headline">Подтвердите удаление</v-card-title>
          <v-card-text>Вы действительно хотите удалить роль?</v-card-text>
          <v-card-actions>
            <v-btn text @click="dialog = false">Отмена</v-btn>
            <v-btn color="red" text @click="deleteRole">Удалить</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
    </v-container>
  </template>

<script>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import router from '../../router';

export default {
  name: 'Roles',
  setup() {
    const roles = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const dialog = ref(false);
    const roleIdToDelete = ref(null);
    const successMessage = ref(false);

    const fetchRoles = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/RoleWithFunctions/List`);
        roles.value = response.data.map(role => ({
          name: role.name,
          id: role.id,
          active: role.active,
          functions: role.functions
        }));
    } catch (error) {
        console.error("Ошибка при загрузке ролей:", error);
        error.value = 'Не удалось загрузить роли.';
      } finally {
        loading.value = false;
      }
    };
    
    const editRole  = (id) => {
      router.push(`/roles/edit/${id}`);
    };

    const deleteRole = async () => {
      if (!roleIdToDelete.value) return;
      try {
        await axios.delete(`${import.meta.env.VITE_APP_BASE_URL}/api/RoleWithFunctions/${roleIdToDelete.value}`);
        loading.value = true;
        dialog.value = false;
        successMessage.value = true;
        setTimeout(() => {
          successMessage.value = false;
        }, 2000);
        roleIdToDelete.value = null;
        await fetchRoles();
      } catch (err) {
        error.value = 'Ошибка при удалении роли';
      }
    };

    const confirmDelete = (id) => {
      roleIdToDelete.value = id;
      dialog.value = true;
    };

    onMounted(() => {
      fetchRoles();
    });

    return {
      loading,
      error,
      dialog,
      successMessage,
      editRole,
      deleteRole,
      confirmDelete,
      roles,
    };
  }
}

</script>
