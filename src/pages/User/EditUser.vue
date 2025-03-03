<template>
  <v-container> 
    <div>
      <h1>Редактировать пользователя</h1>
    </div>
    <br>
    <v-form @submit.prevent="editUser">
      <v-text-field v-model="name" ref="firstCell" tabindex="1" label="Имя" 
      :error-messages="nameError ? [nameError] : []"></v-text-field>

      <v-text-field v-model="login" tabindex="3" label="Логин" 
      :error-messages="loginError ? [loginError] : []"></v-text-field>

      <v-text-field v-model="email" tabindex="2" label="Почта" 
      :error-messages="emailError ? [emailError] : []"></v-text-field>

      <v-btn color="grey" tabindex="4" @click="togglePasswordField" style="margin-bottom: 20px;">
        {{ showPasswordField ? "Отмена" : "Изменить Пароль" }}
      </v-btn>

      <v-text-field v-if="showPasswordField" v-model="password" label="Пароль" type="password"
        :error-messages="passwordError ? [passwordError] : []"></v-text-field>

      <v-text-field v-if="showPasswordField" v-model="passwordRepeat" label="Подтверждение пароля" type="password"
        :error-messages="passwordRepeatError ? [passwordRepeatError] : []"></v-text-field>

      <v-text-field v-model="chatId" tabindex="5" label="ID чата" type="number"
      :error-messages="chatIdError ? [chatIdError] : []"></v-text-field>

      <v-checkbox v-model="selectedRoles" tabindex="6" label="Админ" :value="1"></v-checkbox>
      <v-checkbox v-model="selectedRoles" tabindex="7" label="Работник" :value="2"></v-checkbox>
      <v-checkbox v-model="selectedRoles" tabindex="8" label="Менеджер" :value="3"></v-checkbox>

      <v-alert v-if="successMessage" type="success" dismissible @input="successMessage = false" style="margin-bottom: 20px;">
        Пользователь изменен!
      </v-alert>

      <div style="display: flex; align-items: center;">
        <v-btn color="grey" text to="/users" tabindex="9" style="margin-right: 20px;">Назад</v-btn>
        <v-btn type="submit" tabindex="10" color="primary">Сохранить</v-btn>
      </div>
    </v-form>
  </v-container>
</template>

<script>
import { useForm, useField } from 'vee-validate';
import * as yup from 'yup';
import axios from 'axios';
import { ref, toRaw, reactive, onMounted, watch } from 'vue';
import router from '../../router';
import { useRoute } from "vue-router";


export default {
    name: 'EditUser',
    setup() {
      const route = useRoute();
      const userId = route.params.id;
      const firstCell = ref(null);

      const user = reactive({
        id: 0,
        name: "",
        email: "",
        login: "",
        password: "",
        chatId: "",
        roles: [],
      });

      const successMessage = ref(false);
      const showPasswordField = ref(false);

      const schema = yup.object({
        name: yup.string().required('Имя обязательно'),
        login: yup.string().required('Логин обязателен').test('unique-login', 'Логин уже существует', async (value) => {
          console.log(value);
          try {
            const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/UserWithRoles/isLoginTakenByOtherUser/${userId}/${value}`);
            console.log(response.data);
            return !response.data; 
          } catch (error) {
            console.error('Ошибка при проверке логина:', error);
            return true;
          }
        }),
        email: yup.string().email('Некорректный формат электронной почты').required('Почта обязательна'),
        password: yup.string().when('showPasswordField', {
          is: (val) => val === true,
          then: () => yup.string()
            .min(6, 'Пароль должен содержать минимум 6 символов')
            .required('Пароль обязателен'),
          otherwise: () => yup.string().notRequired()
        }),
        passwordRepeat: yup.string().when('showPasswordField', {
          is: (val) => val === true,
          then: () => yup.string()
            .required('Повтор пароля обязателен')
            .oneOf([yup.ref('password')], 'Пароли должны совпадать'),
          otherwise: () => yup.string().notRequired(),
        }),
        chatId: yup.number().typeError('ID чата должно быть числом').required('ID чата обязателен').integer('ID чата должно быть целым числом'),
      });

      const { handleSubmit, errors, setValues, resetForm } = useForm({
        validationSchema: schema
      });

      const { value: name, errorMessage: nameError } = useField('name');
      const { value: login, errorMessage: loginError } = useField('login');
      const { value: email, errorMessage: emailError } = useField('email');
      const { value: password, errorMessage: passwordError } = useField('password');
      const { value: passwordRepeat, errorMessage: passwordRepeatError } = useField('passwordRepeat');
      const { value: chatId, errorMessage: chatIdError } = useField('chatId');
      const { value: selectedRoles } = useField('roles');

  
      const fetchUser = async () => {
        try {
          const { data } = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/UserWithRoles/${userId}`);
          Object.assign(user, data);
          
          name.value = data.name;
          login.value = data.login;
          email.value = data.email;
          chatId.value = data.chatId;
          selectedRoles.value = data.roles || [];
          if (firstCell.value) {
            firstCell.value.focus();
          }
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
            password: password.value || "",
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

      const togglePasswordField = () => {
        if (showPasswordField.value) {
          password.value = "";
          passwordRepeat.value = "";
        }
        showPasswordField.value = !showPasswordField.value;
        setValues({
          showPasswordField: showPasswordField.value,
        });
      };

      watch(showPasswordField, (newValue) => {
        setValues({
          showPasswordField: newValue,
        });
      });

      onMounted(fetchUser);

      return {
        name,
        login,
        password,
        passwordRepeat,
        email,
        chatId,
        user,
        nameError,
        loginError,
        emailError,
        passwordError,
        passwordRepeatError,
        chatIdError,
        selectedRoles,
        showPasswordField,
        successMessage,
        editUser,
        firstCell,
        togglePasswordField
      };
  }
}
</script>
