<template>
  <v-container>
    <div>
      <h1>Добавить пользователя</h1>
    </div>
    <br>
    <v-form @submit.prevent="addUser">
      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field v-model="name" ref="firstCell" tabindex="1" label="Имя"
          :error-messages="nameError ? [nameError] : []"></v-text-field>
        </v-col>

        <v-col cols="12" sm="6">
          <v-text-field v-model="login" tabindex="3" label="Логин"
          :error-messages="loginError ? [loginError] : []"></v-text-field>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field v-model="email" tabindex="2" label="Почта"
          :error-messages="emailError ? [emailError] : []"></v-text-field>
        </v-col>

        <v-col cols="12" sm="6" >
          <v-text-field v-model="chatId" tabindex="6" label="ID чата" type="number"
          :error-messages="chatIdError ? [chatIdError] : []"></v-text-field>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field v-model="password" tabindex="4" label="Пароль" type="password" autocomplete="off"
          :error-messages="passwordError ? [passwordError] : []"></v-text-field>
        </v-col>

        <v-col cols="12" sm="6" >
          <v-text-field v-model="passwordRepeat" tabindex="5" label="Подтверждение пароля" type="password"
          :error-messages="passwordRepeatError ? [passwordRepeatError] : []"></v-text-field>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" sm="12">
          <v-combobox
            v-model="selectedRoles"
            :items="roles"
            item-title="text"
            item-value="value"
            label="Выберите роли"
            multiple
            chips
            tabindex="7"
          >
            <template v-slot:selection="{ item }">
              <v-chip>
                {{ item.text }}
              </v-chip>
            </template>
          </v-combobox>
        </v-col>
      </v-row>

      <v-alert v-if="successMessage" type="success" dismissible @input="successMessage = false"
        style="position: fixed; top: 20px; right: 20px; z-index: 2401;">
        Пользователь создан!
      </v-alert>

      <v-alert v-if="error" type="error" style="position: fixed; top: 20px; right: 20px; z-index: 2401;">{{ error }}</v-alert>

      <div style="display: flex; align-items: center;">
        <v-btn type="submit" tabindex="8" color="primary" style="margin-right: 20px;">Сохранить</v-btn>
        <v-btn color="grey" text to="/users" tabindex="9">Назад</v-btn>
      </div>
    </v-form>

  </v-container>
</template>

<script>
import { useForm, useField } from 'vee-validate';
import * as yup from 'yup';
import axios from 'axios';
import { ref, toRaw, onMounted, computed } from 'vue';
import router from '../../router';

export default {
  name: 'AddUser',
  setup() {
    const firstCell = ref(null);
    const selectedRoles = ref([]);
    const roles = ref([]);
    const error = ref(null);

    const schema = yup.object({
      name: yup.string().required('Имя обязательно'),
      login: yup.string().required('Логин обязателен').test('unique-login', 'Логин уже существует', async (value) => {
        console.log(value);
        try {
          const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/User/IsLoginTaken/${value}/0`);
          return !response.data;
        } catch (error) {
          console.error('Ошибка при проверке логина:', error);
          return true;
        }
      }),
      email: yup.string().email('Некорректный формат электронной почты').required('Почта обязательна')
        .test('unique-email', 'Почта уже существует', async (value) => {
          console.log(value);
          try {
            const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/User/IsEmailTaken/${value}/0`);
            return !response.data;
          } catch (error) {
            console.error('Ошибка при проверке почты:', error);
            return true;
          }
        }),
      password: yup.string().min(6, 'Пароль должен содержать минимум 6 символов').required('Пароль обязателен'),
      passwordRepeat: yup.string().required('Повтор пароля обязателен').oneOf([yup.ref('password')], 'Пароли должны совпадать'),
      chatId: yup.number().typeError('ID чата должно быть числом').required('ID чата обязателен'),
    });

    const { handleSubmit, errors } = useForm({
      validationSchema: schema,
    });

    const { value: name, errorMessage: nameError } = useField('name');
    const { value: login, errorMessage: loginError } = useField('login');
    const { value: email, errorMessage: emailError } = useField('email');
    const { value: password, errorMessage: passwordError } = useField('password');
    const { value: passwordRepeat, errorMessage: passwordRepeatError } = useField('passwordRepeat');
    const { value: chatId, errorMessage: chatIdError } = useField('chatId');

    const userId = ref(null);
    const successMessage = ref(false);

    const addUser = handleSubmit(async (values) => {
      try {
        const response = await axios.post(`${import.meta.env.VITE_APP_BASE_URL}/api/User`, {
          name: values.name,
          login: values.login,
          email: values.email,
          password: values.password,
          chatId: Number(values.chatId),
          roleIds: selectedRoles.value.map(role => role.value),
        });

        console.log(response.data);

        if (response.data) {
          userId.value = response.data;
          successMessage.value = true;
          setTimeout(() => {
            router.push({ name: 'Users' });
          }, 2000);
        }
      } catch (err) {
        if (err.response && err.response.data.errors) {

          if (err.response.data.errors.ChatId) {
            error.value = err.response.data.errors.ChatId[0];
          } else {
            error.value = "Ошибка при обновлении пользователя.";
          }
        } else {
          error.value = "Неизвестная ошибка сервера.";
        }

        setTimeout(() => {
          error.value = null;
        }, 3000);
      }
    });

    const fetchRoles = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/Role/ListWithoutSorting`);
        roles.value = response.data.map(role => ({
          text: role.name,
          value: role.id
        }));
      } catch (error) {
        console.error("Ошибка при загрузке ролей:", error);
      }
    };

    onMounted(() => {
      firstCell.value.focus();
      fetchRoles();
    });

    return {
      name,
      login,
      email,
      password,
      passwordRepeat,
      chatId,
      selectedRoles,
      nameError,
      loginError,
      emailError,
      passwordError,
      passwordRepeatError,
      chatIdError,
      addUser,
      errors,
      userId,
      successMessage,
      firstCell,
      roles,
      error
    };
  },
};
</script>
