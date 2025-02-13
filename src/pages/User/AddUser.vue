<template>
  <v-container>
    <div>
      <h1>Добавить пользователя</h1>
      <v-btn color="grey" text to="/users">Назад</v-btn>
    </div>
    <br>
    <v-form @submit.prevent="addUser" v-model="valid">
      <v-text-field
        v-model="user.name"
        label="Имя"
        :rules="[nameRules]"
        required
      ></v-text-field>

      <v-text-field
        v-model="user.login"
        label="Логин"
        :rules="[loginRules]"
        required
      ></v-text-field>

      <v-text-field
        v-model="user.password"
        label="Пароль"
        type="password"
        :rules="[passwordRules]"
        required
      ></v-text-field>

      <v-text-field
        v-model="user.chatId"
        label="ID чата"
        :rules="[chatIdRules]"
        required
      ></v-text-field>
      
      <v-checkbox v-model="selectedRoles" label="Админ" :value="1"></v-checkbox>
      <v-checkbox v-model="selectedRoles" label="Работник" :value="2"></v-checkbox>
      <v-checkbox v-model="selectedRoles" label="Менеджер" :value="3"></v-checkbox>

      <v-btn type="submit" color="primary" :disabled="!valid">Сохранить</v-btn>
    </v-form>

    <v-dialog v-model="successDialog" max-width="400px">
      <v-card>
        <v-card-title class="headline">Пользователь создан!</v-card-title>
        <v-card-text>Пользователь успешно создан с ID: <strong>{{ user.id }}</strong></v-card-text>
        <v-card-actions>
          <v-btn color="blue" text to="/users">ОК</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
import axios from 'axios';
import { toRaw } from 'vue';

export default {
    name: 'AddUser',
    data() {
        return {
            user: {
                id: null,
                name: '',
                login: '',
                password: '',
                chatId: '',
                roles: []
            },
            selectedRoles: [],
            valid: false,
            successDialog: false,
            nameRules: [(v) => v && v.length > 0 || 'Имя не может быть пустым'],
            loginRules: [(v) => v && v.length > 0 || 'Логин не может быть пустым'],
            passwordRules: [(v) => v && v.length > 0 || 'Пароль не может быть пустым'],
            chatIdRules: [(v) => !!v && !isNaN(v) || 'ID чата не может быть пустым и должно быть числом']
        };
    },
    methods: {
        async addUser() {
            try {
                const chatId = Number(this.user.chatId);
                const response = await axios.post(`http://localhost:5009/api/UserWithRoles`, {
                    "name": this.user.name,
                    "login": this.user.login,
                    "password": this.user.password,
                    "chatId": chatId,
                    "roleIds": toRaw(this.selectedRoles)
                });

                console.log(response.data);

                if (response.data) {
                    this.user.id = response.data;
                    console.log("Создан пользователь с ID:", this.user.id);
                    this.successDialog = true;
                }
            } catch (error) {
                console.error('Ошибка при сохранении изменений', error);
            }
        }
    }
}
</script>

