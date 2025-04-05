<template>
  <v-container>
    <div>
      <h1>Редактировать пользователя: {{ user.name || 'Загрузка...' }} </h1>
    </div>
    <br>
    <v-form @submit.prevent="editUser">
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

        <v-col cols="12" sm="6">
          <v-text-field v-model="chatId" tabindex="5" label="ID чата" type="number"
          :error-messages="chatIdError ? [chatIdError] : []"></v-text-field>
        </v-col>
      </v-row>

      <v-btn color="grey" tabindex="4" @click="togglePasswordField" class="margin-bottom">
        {{ showPasswordField ? "Отмена" : "Изменить Пароль" }}
      </v-btn>

      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field v-if="showPasswordField" v-model="password" label="Пароль" type="password"
          :error-messages="passwordError ? [passwordError] : []"></v-text-field>
        </v-col>

        <v-col cols="12" sm="6">
          <v-text-field v-if="showPasswordField" v-model="passwordRepeat" label="Подтверждение пароля" type="password"
          :error-messages="passwordRepeatError ? [passwordRepeatError] : []"></v-text-field>
        </v-col>
      </v-row>


      <v-combobox
        v-model="selectedRoles"
        :items="roles"
        item-title="text"
        item-value="value"
        label="Выберите роли"
        multiple
        chips
        tabindex="6"
      >
        <template v-slot:selection="{ item }">
          <v-chip>
            {{ item.text }}
          </v-chip>
        </template>
      </v-combobox>

      <v-alert v-if="successMessage" type="success" dismissible @input="successMessage = false" class="alert">
        Пользователь изменен!
      </v-alert>

      <v-alert v-if="error" type="error" class="alert">{{ error }}</v-alert>

      <div class="button-form">
        <v-btn type="submit" tabindex="7" color="primary" class="margin-right">Сохранить</v-btn>
        <v-btn color="grey" text to="/users" tabindex="8">Назад</v-btn>
      </div>
    </v-form>
  </v-container>
</template>

<script>
import { useForm, useField } from 'vee-validate';
import * as yup from 'yup';
import { ref, toRaw, reactive, onMounted, watch, inject  } from 'vue';
import router from '../../router';
import { useRoute } from "vue-router";


export default {
  name: 'EditUser',
  setup() {
    const route = useRoute();
    const userId = route.params.id;
    const firstCell = ref(null);
    const roles = ref([]);
    const error = ref(null);

    const permissions = inject('permissions');
    const api = inject('api');

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
          const response = await api.get(`/api/User/IsLoginTaken/${value}/${userId}`);
          console.log(response.data);
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
            const response = await api.get(`/api/User/IsEmailTaken/${value}/${userId}`);
            console.log(response.data);
            return !response.data;
          } catch (error) {
            console.error('Ошибка при проверке почты:', error);
            return true;
          }
        }),
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

    const fetchRoles = async () => {
      try {
        const response = await api.get(`/api/Role/ListWithoutSorting`);
        roles.value = response.data.map(role => ({
          text: role.name,
          value: role.id
        }));
      } catch (error) {
        console.error("Ошибка при загрузке ролей:", error);
      }
    };

    const fetchUser = async () => {
      try {
        const { data } = await api.get(`/api/User/${userId}`);
        Object.assign(user, data);

        name.value = data.name;
        login.value = data.login;
        email.value = data.email;
        chatId.value = data.chatId;
        selectedRoles.value = roles.value.filter(role => data.roles.includes(role.text));
        if (firstCell.value) {
          firstCell.value.focus(); 
        }
      } catch (error) {
        console.error("Ошибка загрузки данных пользователя", error);
      }
    };

    const editUser = handleSubmit(async () => {
      try {
        await api.put(`/api/User`, {
          id: user.id,
          name: name.value,
          login: login.value,
          email: email.value,
          password: password.value || "",
          chatId: Number(chatId.value),
          roleIds: selectedRoles.value.map(role => role.value)
        });

        successMessage.value = true;
        setTimeout(() => {
          successMessage.value = false;
          router.push("/users");
        }, 2000);
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

    onMounted(() => {
      fetchUser();
      fetchRoles();
    });

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
      togglePasswordField,
      roles,
      error,
      permissions
    };
  }
}
</script>
