<template>
  <v-container> 
    <div>
      <h1>Редактировать пользователя</h1>
    </div>
    <br>
    <v-form @submit.prevent="editUser">
      <v-text-field v-model="name" label="Имя" 
      :error-messages="nameError ? [nameError] : []"></v-text-field>

      <v-text-field v-model="login" label="Логин" 
      :error-messages="loginError ? [loginError] : []"></v-text-field>

      <v-text-field v-model="email" label="Почта" 
      :error-messages="emailError ? [emailError] : []"></v-text-field>

      <v-btn color="grey" @click="showPasswordField = !showPasswordField" style="margin-bottom: 20px;">
        {{ showPasswordField ? "Отмена" : "Изменить Пароль" }}
      </v-btn>

      <v-text-field v-if="showPasswordField" v-model="password" label="Пароль" type="password"
        :error-messages="passwordError ? [passwordError] : []"></v-text-field>

        <v-text-field v-model="chatId" label="ID чата" type="number"
        :error-messages="chatIdError ? [chatIdError] : []"></v-text-field>

      <v-checkbox v-model="selectedRoles" label="Админ" :value="1"></v-checkbox>
      <v-checkbox v-model="selectedRoles" label="Работник" :value="2"></v-checkbox>
      <v-checkbox v-model="selectedRoles" label="Менеджер" :value="3"></v-checkbox>

      <v-alert v-if="successMessage" type="success" dismissible @input="successMessage = false" style="margin-bottom: 20px;">
        Пользователь изменен!
      </v-alert>

      <div style="display: flex; align-items: center;">
        <v-btn color="grey" text to="/users" style="margin-right: 20px;">Назад</v-btn>
        <v-btn type="submit" color="primary">Сохранить</v-btn>
      </div>
    </v-form>
  </v-container>
</template>

<script>
import { useForm, useField } from 'vee-validate';
import * as yup from 'yup';
import axios from 'axios';
import { ref, toRaw, reactive, onMounted } from 'vue';
import router from '../../router';
import { useRoute } from "vue-router";


export default {
    name: 'EditUser',
    setup() {
      const route = useRoute();
      const userId = route.params.id;

      const user = reactive({
        id: 0,
        name: "",
        email: "",
        login: "",
        password: "",
        chatId: "",
        roles: [],
      });

      const schema = yup.object({
        name: yup.string().required('Имя обязательно'),
        login: yup.string().required('Логин обязателен').test('unique-login', 'Логин уже существует', async (value) => {
          console.log(value);
          if (value === user.login) return true;
          if (!value) return true;
          try {
            const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/UserWithRoles/checkLogin/${value}`);
            console.log(response.data.id);
            return response.id? true: false; 
          } catch (error) {
            console.error('Ошибка при проверке логина:', error);
            return true;
          }
        }),
        email: yup.string().email('Некорректный формат электронной почты').required('Почта обязательна'),
        password: yup.string().min(6, 'Пароль должен содержать минимум 6 символов').required('Пароль обязателен'),
        chatId: yup.number().typeError('ID чата должно быть числом').required('ID чата обязателен').integer('ID чата должно быть целым числом'),
      });

      const { handleSubmit, errors } = useForm({
        validationSchema: schema,
      });

      const { value: name, errorMessage: nameError } = useField('name');
      const { value: login, errorMessage: loginError } = useField('login');
      const { value: email, errorMessage: emailError } = useField('email');
      const { value: password, errorMessage: passwordError } = useField('password');
      const { value: chatId, errorMessage: chatIdError } = useField('chatId');
      const { value: selectedRoles } = useField('roles');

      const successMessage = ref(false);
      const showPasswordField = ref(false);

      const fetchUser = async () => {
        try {
          const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/UserWithRoles/${userId}`);
          Object.assign(user, response.data);
          name.value = response.data.name;
          login.value = response.data.login;
          email.value = response.data.email;
          chatId.value = response.data.chatId;
          selectedRoles.value = response.data.roles || [];

        } catch (error) {
          console.error("Ошибка загрузки данных пользователя", error);
        }
      };

      const editUser = handleSubmit(async () => {
        try {
          await axios.put(`${import.meta.env.VITE_APP_BASE_URL}/api/UserWithRoles`, {
            id: user.id,
            name: name.value,
            login: login.value,
            email: email.value,
            password: password.value,
            chatId: Number(chatId.value),
            roleIds: toRaw(selectedRoles.value),
          });

          successMessage.value = true;
          setTimeout(() => {
            successMessage.value = false;
            router.push("/users");
          }, 2000);
        } catch (error) {
          console.error("Ошибка при сохранении изменений", error);
        }
      });

      onMounted(fetchUser);


      return {
        name,
        login,
        password,
        email,
        chatId,
        user,
        nameError,
        loginError,
        emailError,
        passwordError,
        chatIdError,
        selectedRoles,
        showPasswordField,
        successMessage,
        editUser,
      };
  }
}
</script>
