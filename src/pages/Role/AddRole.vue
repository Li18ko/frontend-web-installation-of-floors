<template>
    <v-container>
      <div>
        <h1>Добавить роль</h1>
      </div>
      <br>
      <v-tabs
      v-model="activeTab"
      align-tabs="left"
      color="deep-purple-accent-4"
      >
          <v-tab :value="0">Роль</v-tab>
          <v-tab :value="1">Функции</v-tab>   
      </v-tabs>
      <br>

      <v-form @submit.prevent="addRole">
        <v-tabs-window v-model="activeTab">
          <v-tabs-window-item :key="0" :value="0">
              <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="name" ref="firstCell" tabindex="1" label="Название роли"
                    :error-messages="nameError ? [nameError] : []"></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="description" tabindex="2" label="Описание роли"
                    :error-messages="descriptionError ? [descriptionError] : []"></v-text-field>
                  </v-col>
              </v-row>
              <v-checkbox v-model="isActive" label="Активность"></v-checkbox>
          </v-tabs-window-item>
          
          <v-tabs-window-item :key="1" :value="1">
            <v-card-text>
                <v-treeview
                    v-model:selected="selectedFunctions"
                    :items="treeData"
                    select-strategy="leaf"
                    item-props
                    open-all
                    selectable
                />
            </v-card-text>
          </v-tabs-window-item>
        </v-tabs-window>
  
        <v-alert v-if="successMessage" type="success" dismissible @input="successMessage = false" class="alert">
          Роль добавлена!
        </v-alert>
  
        <div class="button-form">
          <v-btn type="submit" tabindex="4" color="primary" class="margin-right">Сохранить</v-btn>
          <v-btn color="grey" text to="/roles" tabindex="5">Назад</v-btn>
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
      const activeTab = ref(0);
      const treeData = ref([]);
      const selectedFunctions = ref([]);
      const isActive = ref(false);
      const successMessage = ref(false);
  
      const schema = yup.object({
        name: yup.string().required('Название роли обязательно'),
        description: yup.string().required('Описание роли обязательно'),
      });
  
      const { handleSubmit, errors } = useForm({
        validationSchema: schema,
      });
  
      const { value: name, errorMessage: nameError } = useField('name');
      const { value: description, errorMessage: descriptionError } = useField('description');
  
      const addRole = handleSubmit(async () => {
        try {
          const response = await axios.post(`${import.meta.env.VITE_APP_BASE_URL}/api/Role`, {
            name: name.value,
            description: description.value,
            active: isActive.value,
            functionIds: selectedFunctions.value
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
            const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/Role/ListFunctions`);

            const groupedFunctions = {};

            response.data.forEach(func => {
                const module = func.module || "Прочее"; 

                if (!groupedFunctions[module]) {
                    groupedFunctions[module] = [];
                }

                groupedFunctions[module].push({
                    title: func.name,
                    value: func.id,
                    selected: false
                });
            });

            treeData.value = Object.keys(groupedFunctions).map(moduleName => ({
                title: moduleName,
                value: moduleName,
                children: groupedFunctions[moduleName]
            }));

            console.log("treeData.value", treeData.value);

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
        description,
        nameError,
        descriptionError,
        isActive, 
        selectedFunctions,
        treeData,
        successMessage,
        addRole,
        firstCell,
        activeTab
      };
    },
  };
  </script>
  