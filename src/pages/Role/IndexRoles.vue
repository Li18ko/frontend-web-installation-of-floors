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

      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        v-model:page="currentPage"
        :headers="headers"
        :items="roles"
        :items-length="totalItems"
        :loading="loading"
        item-value="name"
        @update:options="loadItems"
      >
        <template v-for="header in headers" :key="header.value" v-slot:[`column:${header.value}`]="{ column }">
          <span> 
            {{ column.label }} 
          </span>
        </template>

        <template v-slot:[`item.name`]="{ item }">
          <router-link :to="{ name: 'EditUser', params: { id: item.id } }" style="color: black; text-decoration: underline;">
            {{ item.name }}
          </router-link>
        </template>
        
        <template v-slot:[`item.action`]="{ item }">
          <v-tooltip text="Редактировать пользователя">
            <template v-slot:activator="{ props }">
              <v-btn size="30" v-bind="props" @click="editRole(item.id)">
                <v-icon size="25">mdi-pencil</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip text="Удалить пользователя">
            <template v-slot:activator="{ props }">
              <v-btn size="30" v-bind="props" @click="confirmDelete(item.id)">
                <v-icon size="25" color="red">mdi-delete-outline</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </template>
      </v-data-table-server>
  
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

    const totalItems = ref(0);
    const itemsPerPage = ref(10);
    const currentPage = ref(1);

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

    const headers = ref([
      { title: 'Роль', align: 'start', key: 'name', sortable: false },
      { title: 'Описание', key: 'description', sortable: false },
      { title: 'Действие', key: 'action', sortable: false },
    ]);

    const loadItems = async (options) => {
      console.log(options);
      const { itemsPerPage: perPage, page } = options;

      console.log(perPage, page );

      itemsPerPage.value = perPage || 10; 
      currentPage.value = page || 1;

      router.replace({
        name: route.name,
        query: {
          ...route.query,
          itemsPerPage: itemsPerPage.value,
          currentPage: currentPage.value
        }
      });

      console.log("loadItems end");
    };

    const filterRoles = async () => {
      const statusParam = statusFilter.value.length > 0 
        ? statusFilter.value.map(item => item.value) 
        : null;
      console.log('statusParam ', statusParam);

      const newQuery = {
        ...route.query,
        status: statusParam,
      };

      if (!statusParam) {
        delete newQuery.status; 
      }

      router.replace({
        name: route.name,
        query: newQuery,
      });
    };

    const fetchRoles = async () => {
      try {
        console.log("run fetchRoles");
        console.log(route.query.currentPage);
        console.log(route.query.itemsPerPage);
        console.log(route.query.status);
        const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/Role/List`,{
          params: {
            status: route.query.status || null,  
            skip: (route.query.currentPage - 1) * route.query.itemsPerPage,                      
            take: route.query.itemsPerPage
          }, paramsSerializer: { indexes: null }
        });

        console.log("СЕЙЧАС1", response.data);

        roles.value = response.data.items.map(role => ({
          name: role.name,
          id: role.id,
          description: role.description,
        }));

        loading.value = false;
        totalItems.value = response.data.count; 
        console.log("СЕЙЧАС3", totalItems.value);
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
      if (route.query.status) {
        const statusFromQuery = Array.isArray(route.query.status) 
          ? route.query.status 
          : [route.query.status]; 

        statusFilter.value = statusFromQuery.map(s => {
              const foundItem = statusOptions.value.find(opt => String(opt.value) === String(s));
              return foundItem ? foundItem : null; 
            }).filter(Boolean);
      }
    
      if (route.query.currentPage){
        currentPage.value = parseInt(route.query.currentPage, 10);
        console.log("currentPage.value", currentPage.value);
      } 
      
      if (route.query.itemsPerPage) {
        itemsPerPage.value = parseInt(route.query.itemsPerPage, 10);
        console.log("itemsPerPage.value", itemsPerPage.value);
      }

      setTimeout(() => {
        fetchRoles();
        }, 500);
    });

    watch(
      () => ({
        status: route.query.status,
        currentPage: route.query.currentPage,
        itemsPerPage: route.query.itemsPerPage
      }),
      (newQuery, oldQuery) => {
        if (
          newQuery.status !== oldQuery.status ||
          newQuery.itemsPerPage !== oldQuery.itemsPerPage ||
          newQuery.currentPage !== oldQuery.currentPage
        ){
          console.log("newQuery.currentPage", currentPage.value);
          if (newQuery.currentPage) currentPage.value = parseInt(newQuery.currentPage, 10);

          console.log("newQuery.itemsPerPage", itemsPerPage.value);
          if (newQuery.itemsPerPage) itemsPerPage.value = parseInt(newQuery.itemsPerPage, 10);
          
          if (newQuery.status) {
            const statusFromQuery = Array.isArray(newQuery.status) 
              ? newQuery.status 
              : [newQuery.status]; 
            
              statusFilter.value = statusFromQuery.map(s => {
                const foundItem = statusOptions.value.find(opt => String(opt.value) === String(s));
                return foundItem ? foundItem : null; 
              }).filter(Boolean);

          } else {
            statusFilter.value = []; 
          }

          fetchRoles();
        }
      },
      { immediate: false }
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
      filterRoles,
      itemsPerPage,
      currentPage,
      totalItems,
      loadItems,
      headers,
    };
  }
}

</script>
