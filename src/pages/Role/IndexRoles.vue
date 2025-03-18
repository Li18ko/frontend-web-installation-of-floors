<template>
    <v-container>
      <div style="display: flex; align-items: center;">
        <h1>Роли</h1>
        <v-spacer></v-spacer>
        <v-btn color="green" text to="/roles/add">Добавить</v-btn>
      </div>
      <br>
      
      <v-progress-circular v-if="loading" indeterminate color="primary" 
          style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2401;"></v-progress-circular>
  
      <v-alert v-if="error" type="error" style="position: fixed; top: 20px; right: 20px; z-index: 2401;">{{ error }}</v-alert>
  
      <v-alert v-if="successMessage" type="success" dismissible @input="successMessage = false"
          style="position: fixed; top: 20px; right: 20px; z-index: 2401;">Роль удалена!</v-alert>

      <v-col cols="12" sm="4">
          <v-combobox
            v-model="statusFilter"
            :items="statusOptions"
            item-title="text"
            item-value="value"
            label="Выберите роли"
            multiple
            chips
            @update:modelValue="filterRoles"
          >
            <template v-slot:selection="{ item }">
              <v-chip>
                {{ item.text }}
              </v-chip>
            </template>
          </v-combobox>
        </v-col>
  
      <v-table :height="'500px'" :density="'comfortable'" fixed-header>
        <thead>
          <tr>
            <th>Роль</th>
            <th>Описание</th>
            <th>Функции</th>
            <th>Действие</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item) in roles" :key="item.id">
            <td>
              <router-link :to="{ name: 'EditRole', params: { id: item.id } }" style="color:black">{{ item.name
              }}</router-link>
            </td>
            <td>{{ item.description }}</td>
            <td>{{ item.functions.map(f => f.name).join(', ') }}</td>
            <td>
              <v-tooltip text="Редактировать роль">
                <template v-slot:activator="{ props }">
                  <v-btn size="30" v-bind="props" @click="editRole(item.id)">
                    <v-icon size="25">mdi-pencil</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
  
              <v-tooltip text="Удалить роль">
                <template v-slot:activator="{ props }">
                  <v-btn size="30" v-bind="props" @click="confirmDelete(item.id)">
                    <v-icon size="25" color="red">mdi-delete-outline</v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
            </td>
          </tr>
        </tbody>
      </v-table>
  
      <v-dialog v-model="dialog" max-width="400px">
        <v-card>
          <v-card-title class="headline">Подтвердите удаление</v-card-title>
          <v-card-text>Вы действительно хотите удалить роль?</v-card-text>
          <v-card-actions>
            <v-btn text @click="dialog = false">Отмена</v-btn>
            <v-btn color="red" text @click="deleteRole">Удалить</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
    </v-container>
  </template>

<script>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import router from '../../router';
import { useRoute, useRouter } from 'vue-router';

export default {
  name: 'Roles',
  setup() {
    const route = useRoute();
    const router = useRouter();

    const roles = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const dialog = ref(false);
    const roleIdToDelete = ref(null);
    const successMessage = ref(false);

    const statusFilter = ref(null);
    const statusOptions = ref([
      { text: 'Активные', value: true },
      { text: 'Неактивные', value: false }
    ]);

    const filterRoles = async () => {
      const statusParam = statusFilter.value.length ? statusFilter.value.map(item => item.value)  : null;
        console.log('Отправка query-параметров:', statusParam);

        router.push({
          name: route.name,
          query: {...route.query, status: statusParam}
        });

    };

    const fetchRoles = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/Role/List`,{
            params: {
            status: statusFilter.value.length ? statusFilter.value: undefined
          }
        });
        roles.value = response.data.map(role => ({
            name: role.name,
            id: role.id,
            description: role.description,
            functions: role.functions
          }));
        loading.value = false;
      } catch (err) {
          error.value = 'Ошибка загрузки данных';
          loading.value = false;
          setTimeout(() => {
            error.value = null;
          }, 2000);
      };
    }

    const editRole  = (id) => {
      router.push(`/roles/edit/${id}`);
    };

    const deleteRole = async () => {
      if (!roleIdToDelete.value) return;
      try {
        await axios.delete(`${import.meta.env.VITE_APP_BASE_URL}/api/Role/${roleIdToDelete.value}`);
        loading.value = true;
        dialog.value = false;
        successMessage.value = true;
        setTimeout(() => {
          successMessage.value = false;
        }, 2000);
        roleIdToDelete.value = null;
        await fetchRoles();
      } catch (err) {
        if(err.response.data.error){
          error.value = err.response.data.error;
        }else{
          error.value = 'Ошибка при удалении роли';
          setTimeout(() => {
          error.value = null;
        }, 2000);
        }

        setTimeout(() => {
          dialog.value = false;
          error.value = null;
        }, 2000);
      }
    };

    const confirmDelete = (id) => {
      roleIdToDelete.value = id;
      dialog.value = true;
    };

    onMounted(() => {
      const statusFromQuery = route.query.status;
      console.log('Статус при монтировании:', statusFromQuery);
      statusFilter.value = Array.isArray(statusFromQuery) 
      ? statusFromQuery.map(s => statusOptions.value.find(opt => String(opt.value) === s)).filter(Boolean)
      : [statusOptions.value.find(opt => String(opt.value) === statusFromQuery)].filter(Boolean);

      fetchRoles();
    });

    watch(
      () => route.query.status,
      (newStatus) => {
        const statusArray = Array.isArray(newStatus) ? newStatus : [newStatus];
        statusFilter.value = statusArray.map(val => statusOptions.value.find(opt => String(opt.value) === val)).filter(Boolean);
        fetchRoles();
      },
      { immediate: true }
    );


    return {
      loading,
      error,
      dialog,
      successMessage,
      editRole,
      deleteRole,
      confirmDelete,
      roles,
      statusOptions,
      statusFilter,
      filterRoles
    };
  }
}

</script>
