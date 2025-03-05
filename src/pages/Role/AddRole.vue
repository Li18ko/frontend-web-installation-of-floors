<template>
    <v-container>
      <div>
        <h1>Добавить роль</h1>
      </div>
      <br>
      <v-form @submit.prevent="addRole">
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field v-model="name" ref="firstCell" tabindex="1" label="Название роли"
            :error-messages="nameError ? [nameError] : []"></v-text-field>
          </v-col>
        </v-row>
  
        <v-checkbox v-model="isActive" label="Активность"></v-checkbox>
  
        <v-row>
          <v-col cols="12" sm="12">
            <v-combobox
              v-model="selectedFunctions"
              :items="functions"
              item-title="text"
              item-value="value"
              label="Выберите функции"
              multiple
              chips
              tabindex="2"
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
          Роль добавлена!
        </v-alert>
  
        <div style="display: flex; align-items: center;">
          <v-btn type="submit" tabindex="3" color="primary" style="margin-right: 20px;">Сохранить</v-btn>
          <v-btn color="grey" text to="/roles" tabindex="4">Назад</v-btn>
        </div>
      </v-form>
  
    </v-container>
  </template>
  
  <script>
  import { useForm, useField } from 'vee-validate';
  import * as yup from 'yup';
  import axios from 'axios';
  import { ref, onMounted } from 'vue';
  import router from '../../router';
  
  export default {
    name: 'AddRole',
    setup() {
      const firstCell = ref(null);
      const functions = ref([]);
      const selectedFunctions = ref([]);
      const isActive = ref(false);
      const successMessage = ref(false);
  
      const schema = yup.object({
        name: yup.string().required('Название роли обязательно'),
      });
  
      const { handleSubmit, errors } = useForm({
        validationSchema: schema,
      });
  
      const { value: name, errorMessage: nameError } = useField('name');
  
      const addRole = handleSubmit(async () => {
        try {
          const response = await axios.post(`${import.meta.env.VITE_APP_BASE_URL}/api/RoleWithFunctions`, {
            name: name.value,
            active: isActive.value,
            functionIds: selectedFunctions.value.map(func => func.value),
          });
  
          if (response.data) {
            successMessage.value = true;
            setTimeout(() => {
              router.push({ name: 'Roles' });
            }, 2000);
          }
        } catch (error) {
          console.error('Ошибка при добавлении роли', error);
        }
      });
  
      const fetchFunctions = async () => {
        try {
          const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/RoleWithFunctions/ListFunctions`);
          functions.value = response.data.map(func => ({
            text: func.name,
            value: func.id
          }));
        } catch (error) {
          console.error("Ошибка при загрузке функций:", error);
        }
      };
  
      onMounted(() => {
        firstCell.value.focus();
        fetchFunctions();
      });
  
      return {
        name,
        nameError,
        isActive,
        selectedFunctions,
        functions,
        successMessage,
        addRole,
        firstCell,
      };
    },
  };
  </script>
  