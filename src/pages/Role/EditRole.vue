<template>
    <v-container>
      <div>
        <h1>Редактировать роль: {{ role.name || 'Загрузка...' }} </h1>
      </div>
      <br>
      <v-form @submit.prevent="editRole">
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field v-model="name" ref="firstCell" tabindex="1" label="Название роли"
            :error-messages="nameError ? [nameError] : []"></v-text-field>
          </v-col>
        </v-row>
  
        <v-checkbox v-model="isActive" label="Активность"></v-checkbox>
  
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
  
        <v-alert v-if="successMessage" type="success" dismissible @input="successMessage = false"
          style="position: fixed; top: 20px; right: 20px; z-index: 2401;">
          Роль изменена!
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
  import { ref, reactive, onMounted } from 'vue';
  import router from '../../router';
  import { useRoute } from "vue-router";
  
  export default {
    name: 'EditRole',
    setup() {
      const route = useRoute();
      const roleId = route.params.id;
      const firstCell = ref(null);
      const functions = ref([]);
  
      const role = reactive({
        id: 0,
        name: "",
        active: false,
        functions: [],
      });
  
      const successMessage = ref(false);
  
      const schema = yup.object({
        name: yup.string().required('Название роли обязательно'),
      });
  
      const { handleSubmit, errors, setValues } = useForm({
        validationSchema: schema
      });
  
      const { value: name, errorMessage: nameError } = useField('name');
      const { value: selectedFunctions } = useField('functions');
      const isActive = ref(false);
  
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
  
      const fetchRole = async () => {
        try {
          const { data } = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/RoleWithFunctions/${roleId}`);
          Object.assign(role, data);
  
          name.value = data.name;
          isActive.value = data.active;
          selectedFunctions.value = data.functions.map(func => func.id);
          if (firstCell.value) {
            firstCell.value.focus(); 
          }
        } catch (error) {
          console.error("Ошибка загрузки данных роли", error);
        }
      };
  
      const editRole = handleSubmit(async () => {
        try {
          await axios.put(`${import.meta.env.VITE_APP_BASE_URL}/api/RoleWithFunctions`, {
            id: role.id,
            name: name.value,
            active: isActive.value,
            functionIds: selectedFunctions.value.map(func => func.value)
          });
  
          successMessage.value = true;
          setTimeout(() => {
            successMessage.value = false;
            router.push("/roles");
          }, 2000);
        } catch (error) {
          console.error("Ошибка при сохранении изменений", error);
        }
      });
  
      onMounted(() => {
        fetchRole();
        fetchFunctions();
      });
  
      return {
        name,
        role,
        nameError,
        selectedFunctions,
        isActive,
        successMessage,
        editRole,
        firstCell,
        functions,
      };
    }
  }
  </script>
  