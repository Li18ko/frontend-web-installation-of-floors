<template>
  <v-container>
    <div style="display: flex; align-items: center;">
      <h1>Пользователи</h1>
      <v-spacer></v-spacer>
      <v-btn color="green" text to="/users/add">Добавить</v-btn>
    </div>
    <br>
    <v-container>
      <v-row>
        <v-col cols="12" sm="4" class="pl-0">
          <v-select v-model="sortBy" :items="sortOptions" item-title="text" item-value="value" label="Сортировать по "
            outlined @update:modelValue="applySort">
          </v-select>
        </v-col>
      </v-row>
    </v-container>
    <v-progress-circular v-if="loading" indeterminate color="primary" 
        style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000;"></v-progress-circular>

    <v-alert v-if="error" type="error" style="position: fixed; top: 20px; right: 20px; z-index: 2401;">{{ error }}</v-alert>

    <v-alert v-if="successMessage" type="success" dismissible @input="successMessage = false"
        style="position: fixed; top: 20px; right: 20px; z-index: 2401;">Пользователь удален!</v-alert>

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
            <router-link :to="{ name: 'EditUser', params: { id: item.id } }" style="color:black">{{ item.name
            }}</router-link>
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
import { ref, onMounted } from 'vue';
import axios from 'axios';
import router from '../../router';
import { useRoute } from 'vue-router';
import { watch } from 'vue';

export default {
  name: 'Users',
  setup() {
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

    const route = useRoute()
    const sortBy = ref(route.query.sort || 'nameAsc'); 

    const sortOptions = [
      { text: "По возрастанию имени", value: "nameAsc" },
      { text: "По убыванию имени", value: "nameDesc" },
      { text: "По возрастанию email", value: "emailAsc" },
      { text: "По убыванию email", value: "emailDesc" },
      { text: "По возрастанию даты создания", value: "createdAtAsc" },
      { text: "По убыванию даты создания", value: "createdAtDesc" },
      { text: "По возрастанию даты редактирования", value: "lastRevisionAsc" },
      { text: "По убыванию даты редактирования", value: "lastRevisionDesc" }
    ];

    const applySort = async () => {
      router.push({ query: { ...route.query, sort: sortBy.value } });
      await fetchUsers();
    };

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

    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/UserWithRoles/List`, {
          params: {
            sort: sortBy.value, 
          }
        });
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

    onMounted(() => {
      if (route.query.sort) {
        applySort();
      } else {
        fetchUsers();
      }
    });

    watch(
      () => route.query.sort,
      (newSort) => {
        if (newSort) {
          sortBy.value = newSort; 
          applySort(); 
        }
      },
      { immediate: true } 
    );

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
      confirmDelete,
      sortBy,
      sortOptions,
      applySort
    };
  }
}

</script>
