<template>
  <v-container>
    <div>
      <h1>Добавить пользователя</h1>
      <v-btn color="grey" text to="/users">Назад</v-btn>
    </div>
    <br>
    <v-form @submit.prevent="onSubmit">
      <v-text-field
        v-model="name"
        label="Имя"
        :error-messages="nameError ? [nameError] : []"
      ></v-text-field>

      <v-text-field
        v-model="login"
        label="Логин"
        :error-messages="loginError ? [loginError] : []"
      ></v-text-field>

      <v-text-field
        v-model="password"
        label="Пароль"
        type="password"
        :error-messages="passwordError ? [passwordError] : []"
      ></v-text-field>

      <v-text-field
        v-model="chatId"
        label="ID чата"
        type="number"
        :error-messages="chatIdError ? [chatIdError] : []"
      ></v-text-field>
      
      <v-checkbox v-model="selectedRoles" label="Админ" :value="1"></v-checkbox>
      <v-checkbox v-model="selectedRoles" label="Работник" :value="2"></v-checkbox>
      <v-checkbox v-model="selectedRoles" label="Менеджер" :value="3"></v-checkbox>

      <v-btn type="submit" color="primary">Сохранить</v-btn>
    </v-form>

    <v-dialog v-model="successDialog" max-width="400px">
      <v-card>
        <v-card-title class="headline">Пользователь создан!</v-card-title>
        <v-card-text>Пользователь успешно создан с ID: <strong>{{ userId }}</strong></v-card-text>
        <v-card-actions>
          <v-btn color="blue" text to="/users">ОК</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
import { useForm, useField } from 'vee-validate';
import * as yup from 'yup';
import axios from 'axios';
import { ref, toRaw } from 'vue';

export default {
  name: 'AddUser',
  setup() {
    const schema = yup.object({
      name: yup.string().required('Имя обязательно'),
      login: yup.string().required('Логин обязателен'),
      password: yup.string().min(6, 'Пароль должен содержать минимум 6 символов').required('Пароль обязателен'),
      chatId: yup.number().typeError('ID чата должно быть числом').required('ID чата обязателен').positive('ID чата должно быть положительным числом').integer('ID чата должно быть целым числом'),
    });

    const { handleSubmit, resetForm, errors } = useForm({
      validationSchema: schema,
    });

    const { value: name, errorMessage: nameError } = useField('name');
    const { value: login, errorMessage: loginError } = useField('login');
    const { value: password, errorMessage: passwordError } = useField('password');
    const { value: chatId, errorMessage: chatIdError } = useField('chatId');
    const { value: selectedRoles } = useField('roles');

    const userId = ref(null); 
    const successDialog = ref(false);

    const onSubmit = handleSubmit(async (values) => {
      try {
        const response = await axios.post(`http://localhost:5009/api/UserWithRoles`, {
          "name": values.name,
          "login": values.login,
          "password": values.password,
          "chatId": Number(values.chatId),
          "roleIds": Array.isArray(values.selectedRoles) ? toRaw(values.selectedRoles) : [],
        });

        console.log(response.data);

        if (response.data) {
          userId.value = response.data; 
          successDialog.value = true;
        }
      } catch (error) {
        console.error('Ошибка при сохранении изменений', error);
      }
    });

    return {
      name,
      login,
      password,
      chatId,
      selectedRoles,
      nameError,
      loginError,
      passwordError,
      chatIdError,
      onSubmit,
      errors,
      userId,
      successDialog
    };
  },
};
</script>
