<template>
  <v-container>
    <div style="display: flex; align-items: center;">
      <h1>Пользователи</h1>
      <v-spacer></v-spacer>
      <v-btn color="green" text to="/users/add">Добавить</v-btn>
    </div>
    <br>
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <v-progress-circular v-if="loading" indeterminate color="primary" style="margin-bottom: 30px;"></v-progress-circular>
      <v-alert v-if="error" type="error" style="margin-bottom: 30px;">{{ error }}</v-alert>
      <v-alert v-if="successMessage" type="success" dismissible @input="successMessage = false" style="margin-bottom: 20px;">
        Пользователь удален!
      </v-alert>
    </div>

    <v-table :height="'500px'" :density="'comfortable'" fixed-header>
      <thead>
        <tr>
          <th>Имя</th>
          <th>Логин</th>
          <th>Почта</th>
          <th>id чата</th>
          <th>Дата создания</th>
          <th>Дата реадктирования</th>
          <th>Роли</th>
          <th>Действие</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item) in users" :key="item.id">
          <td>
            <router-link :to="{ name: 'EditUser', params: { id: item.id } }" style="color:black">{{ item.name }}</router-link>
          </td>
          <td>{{ item.login }}</td>
          <td>{{ item.email }}</td>
          <td>{{ item.chatId }}</td>
          <td>{{ item.createdAt }}</td>
          <td>{{ item.lastRevision }}</td>
          <td>{{ item.selectedRoles }}</td>
          <td>
            <v-tooltip text="Редактировать пользователя">
              <template v-slot:activator="{ props }">
                <v-btn size="30" v-bind="props" @click="editUser(item.id)">
                  <v-icon size="25">mdi-pencil</v-icon>
                </v-btn>
              </template>
            </v-tooltip>

            <v-tooltip text="Удалить пользователя">
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
        <v-card-text>Вы действительно хотите удалить пользователя?</v-card-text>
        <v-card-actions>
          <v-btn text @click="dialog = false">Отмена</v-btn>
          <v-btn color="red" text @click="deleteUser">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
import {ref, onMounted} from 'vue';
import axios from 'axios';
import router from '../../router';

export default {
  name: 'Users',
  setup(){
    const users = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const dialog = ref(false);
    const userIdToDelete = ref(null);
    const roleNames = {
      1: "Админ",
      2: "Работник",
      3: "Менеджер"
    };
    const successMessage = ref(false);

    const formatDate = (date) => {
      const d = new Date(date);
      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short' 
      };
      return d.toLocaleString('ru-RU', options);
    };

    const fetchUsers = async() =>{
      try{
        const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/UserWithRoles/List`);
        users.value = response.data.map(user => {
          user.createdAt = formatDate(user.createdAt);
          user.lastRevision = formatDate(user.lastRevision);
          user.selectedRoles = user.roles.length !== 0 ? user.roles.map(role => roleNames[role]).join(', ') : "Роли нет";
          return user;
        });
        loading.value = false;   
      } catch (err) {
        error.value = 'Ошибка загрузки данных';
        loading.value = false;             
      }
    };

    const editUser = (id) => {
      router.push(`/users/edit/${id}`);
    };

    const deleteUser = async () => {
      if (!userIdToDelete.value) return;
      try {
        await axios.delete(`${import.meta.env.VITE_APP_BASE_URL}/api/UserWithRoles/${userIdToDelete.value}`);
        loading.value = true;
        dialog.value = false;
        successMessage.value = true;
        setTimeout(() => {
          successMessage.value = false;
        }, 2000);
        userIdToDelete.value = null;
        await fetchUsers();
      } catch (err) {
        error.value = 'Ошибка при удалении пользователя';
      }
    };

    const confirmDelete = (id) => {
      userIdToDelete.value = id;
      dialog.value = true;
    };

    onMounted(fetchUsers);

    return {
      users,
      loading,
      error,
      dialog,
      userIdToDelete,
      successMessage,
      formatDate,
      fetchUsers,
      editUser,
      deleteUser,
      confirmDelete
    };
  }
}
</script>
