<template>
  <v-container> 
    <div>
      <h1>Редактировать пользователя</h1>
      <v-btn color="grey" text to="/users">Назад</v-btn>
    </div>
    <br>
    <v-form @submit.prevent="editUser" v-model="valid">
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
  </v-container>
</template>

<script>
import axios from 'axios';
import { toRaw } from 'vue';

export default {
    props: ['id'],
    name: 'EditUser',
    data() {
        return {
            user: {
                id: 0,
                name: '',
                login: '',
                password: '',
                chatId: '',
                roles: []
            },
            selectedRoles: [],
            valid: false,
            nameRules: [(v) => v && v.length > 0 || 'Имя не может быть пустым'],
            loginRules: [(v) => v && v.length > 0 || 'Логин не может быть пустым'],
            passwordRules: [(v) => v && v.length > 0 || 'Пароль не может быть пустым'],
            chatIdRules: [(v) => !!v && !isNaN(v) || 'ID чата не может быть пустым и должно быть числом']
        };
    },
    mounted() {
        this.fetchUser();
    },
    methods: {
        async fetchUser() {
            try {
                const response = await axios.get(`http://localhost:5009/api/UserWithRoles/${this.id}`);
                this.user = response.data;
                if (this.user && this.user.roles && this.user.roles.length > 0) {
                    this.selectedRoles = [...this.user.roles];
                }

                console.log(this.selectedRoles); 

            } catch (error) {
                console.error('Ошибка загрузки данных пользователя', error);
            }
        },
        async editUser() {
            try {
                const chatId = Number(this.user.chatId);

                await axios.put(`http://localhost:5009/api/UserWithRoles`, {
                    "id": this.user.id,
                    "name": this.user.name,
                    "login": this.user.login,
                    "password": this.user.password,
                    "chatId": chatId,
                    "roleIds": toRaw(this.selectedRoles)
                });

                this.$router.push({ name: 'Users' }); 
            } catch (error) {
                console.error('Ошибка при сохранении изменений', error);
            }
        }
    }
}
</script>
