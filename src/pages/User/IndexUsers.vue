<template>
  <v-container>
    <div>
      <h1>Пользователи</h1>
      <v-btn color="green" text to="/users/add">Добавить</v-btn>
    </div>
    <br>
    <v-table :height="'400px'" :density="'comfortable'" fixed-header>
      <thead>
        <tr>
          <th>id</th>
          <th>Имя</th>
          <th>Логин</th>
          <th>id чата</th>
          <th>Дата создания</th>
          <th>Дата реадктирования</th>
          <th>Роли</th>
          <th>Действие</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item) in desserts" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.login }}</td>
          <td>{{ item.chatId }}</td>
          <td>{{ item.createdAt }}</td>
          <td>{{ item.lastRevision }}</td>
          <td>{{ item.roles }}</td>
          <td>
            <v-btn icon small @click="confirmDelete(item.id)">
              <v-icon small color="red">mdi-close-circle</v-icon>
            </v-btn>
            <v-btn icon small @click="editUser(item.id)">
              <v-icon small>mdi-pencil</v-icon>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    

    <v-progress-circular v-if="loading" indeterminate color="primary"></v-progress-circular>
    <v-alert v-if="error" type="error">{{ error }}</v-alert>
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
import axios from 'axios';

export default {
  name: 'Users',
  data(){
    return{
      users: [],
      loading: true,
      error: null,
      dialog: false,
      userIdToDelete: null
    }
  },
  mounted(){
    this.fetchUsers();
  },
  methods: {
    formatDate(date) {
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
    },

    async fetchUsers(){
      try{
        const response = await axios.get('http://localhost:5009/api/UserWithRoles/List');
        this.desserts = response.data.map(user => {
        user.createdAt = this.formatDate(user.createdAt);
        user.lastRevision = this.formatDate(user.lastRevision);
        return user;
      });
        this.loading = false;   
      } catch (err) {
        this.error = 'Ошибка загрузки данных';  
        this.loading = false;                
      }
    },

    editUser(id) {
      this.$router.push(`/users/edit/${id}`);
    },

    async deleteUser(id) {
      if (!this.userIdToDelete) return;
      try {
        await axios.delete(`http://localhost:5009/api/UserWithRoles/${this.userIdToDelete}`);
        this.dialog = false;
        this.userIdToDelete = null;
        await this.fetchUsers();
      } catch (err) {
        this.error = 'Ошибка при удалении пользователя';
      }
    },

    confirmDelete(id) {
      this.userIdToDelete = id;
      this.dialog = true;
    },
  }
}
</script>
