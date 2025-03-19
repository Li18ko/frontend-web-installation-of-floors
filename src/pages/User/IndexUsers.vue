<template>
  <v-container>
    <div style="display: flex; align-items: center;">
      <h1>Пользователи</h1>
      <v-spacer></v-spacer>
      <v-btn color="green" text to="/users/add">Добавить</v-btn>
    </div>
    <br>
    <v-container>
      <v-row>
        <v-col cols="12" sm="8" class="pl-0">
          <v-text-field
            v-model="searchQuery"
            label="Поиск по имени, логину или почте"
            outlined
            @input="searchUsers"
          ></v-text-field>
        </v-col>

        <v-col cols="12" sm="4">
          <v-combobox
            v-model="selectedRoles"
            :items="roles"
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
      </v-row>
    </v-container>
    <v-progress-circular v-if="loading" indeterminate color="primary" 
        style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2401;"></v-progress-circular>

    <v-alert v-if="error" type="error" style="position: fixed; top: 20px; right: 20px; z-index: 2401;">{{ error }}</v-alert>

    <v-alert v-if="successMessage" type="success" dismissible @input="successMessage = false"
        style="position: fixed; top: 20px; right: 20px; z-index: 2401;">Пользователь удален!</v-alert>
      
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      v-model:page="currentPage"
      :headers="headers"
      :items="users"
      :items-length="totalItems"
      :loading="loading"
      :sort-by="[sortBy]"
      :sort-desc="sortBy.order === 'desc'"
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
    
      <template v-slot:[`item.email`]="{ item }">
        <a :href="'mailto:' + item.email" style="color: black; text-decoration: underline;">
          {{ item.email }}
        </a>
      </template>
      
      <template v-slot:[`item.action`]="{ item }">
        <v-tooltip text="Редактировать пользователя">
          <template v-slot:activator="{ props }">
            <v-btn size="30" v-bind="props" @click="editUser(item.id)">
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
        <v-card-text>Вы действительно хотите удалить пользователя?</v-card-text>
        <v-card-actions>
          <v-btn text @click="dialog = false">Отмена</v-btn>
          <v-btn color="red" text @click="deleteUser">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
import { ref, onMounted, watch, nextTick } from 'vue';
import axios from 'axios';
import router from '../../router';
import { useRoute } from 'vue-router';

export default {
  name: 'Users',
  setup() {
    const users = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const dialog = ref(false);
    const userIdToDelete = ref(null);
    const successMessage = ref(false);
    const selectedRoles = ref([]);
    const roles = ref([]);
    const searchQuery = ref('');
    const route = useRoute();
    const sortBy = ref({ key: route.query.sort || 'lastRevision', order: route.query.order  || 'desc' });
    const filterRole = ref(route.query.filter || '[]'); 
    const ROLE_NOT_FOUND = "Роли нет";

    const totalItems = ref(0);
    const itemsPerPage = ref(10)
    const currentPage = ref(1);


    const headers = ref([
      { title: 'Имя', align: 'start', key: 'name' },
      { title: 'Логин', key: 'login' },
      { title: 'Почта', key: 'email' },
      { title: 'id чата', key: 'chatId' },
      { title: 'Дата создания', key: 'createdAt' },
      { title: 'Дата редактирования', key: 'lastRevision' },
      { title: 'Роли', key: 'selectedRoles', sortable: false },
      { title: 'Действие', key: 'action', sortable: false },
    ]);

    const loadItems = async (options) => {
      console.log(options);
      const { sortBy, itemsPerPage: perPage, page } = options;

      console.log(perPage, page );

      itemsPerPage.value = perPage || 10; 
      currentPage.value = page || 1;

      const sortKey = sortBy[0]?.key || 'lastRevision'; 
      const sortOrder = sortBy[0]?.order || 'desc';

      router.replace({
        name: route.name,
        query: {
          ...route.query,
          sort: sortKey,
          order: sortOrder,
          itemsPerPage: itemsPerPage.value,
          currentPage: currentPage.value
        }
      });

      console.log("loadItems end");
    };

    const filterRoles = async () => {
      const selectedRoleIds = selectedRoles.value.length > 0 
        ? selectedRoles.value.map(role => role.value) 
        : "";
      
      console.log("selectedRoleIds" + selectedRoleIds);

      router.replace({
        name: route.name,
        query: {
          ...route.query,
          filter: selectedRoleIds.length > 0 ? selectedRoleIds : ''
        }
      });
    };

    const searchUsers = async () => {
      const searchParam = searchQuery.value.trim();

      if (searchParam) {
        router.replace({
          name: route.name,
          query: {
            ...route.query,
            search: searchParam
          }
        });
      }
    };

    const formatDate = (date) => {
      const d = new Date(date);
      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      return d.toLocaleString('ru-RU', options);
    };

    const fetchRoles = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/Role/List`);
        roles.value = response.data.map(role => ({
          text: role.name,
          value: role.id
        }));
      } catch (error) {
        error.value = 'Ошибка при загрузке ролей';
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/User/List`, {
          params: {
            sort: route.query.sort,    
            order: route.query.order,  
            skip: (route.query.currentPage - 1) * route.query.itemsPerPage,                      
            take: route.query.itemsPerPage,  
            filter: route.query.filter || null,           
            search: searchQuery.value.trim() 
          },
          paramsSerializer: { indexes: null }
        });

        users.value = response.data.items.map(user => {
          user.createdAt = formatDate(user.createdAt);
          user.lastRevision = formatDate(user.lastRevision);
          user.selectedRoles = user.roles.length !== 0 ? user.roles.join(', ') : ROLE_NOT_FOUND;
          return user;
        });
        loading.value = false;
        
        totalItems.value = response.data.count; 
      } catch (err) {
        error.value = 'Ошибка загрузки данных';
        loading.value = false;
        setTimeout(() => {
          error.value = null;
        }, 2000);
      }
    };

    const editUser = (id) => {
      router.push(`/users/edit/${id}`);
    };

    const deleteUser = async () => {
      if (!userIdToDelete.value) return;
      try {
        await axios.delete(`${import.meta.env.VITE_APP_BASE_URL}/api/User/${userIdToDelete.value}`);
        loading.value = true;
        dialog.value = false;
        successMessage.value = true;
        setTimeout(() => {
          successMessage.value = false;
        }, 2000);
        userIdToDelete.value = null;
        await fetchUsers();
      } catch (err) {
        error.value = 'Ошибка при удалении пользователя';
        setTimeout(() => {
          error.value = null;
        }, 2000);
      }
    };

    const confirmDelete = (id) => {
      userIdToDelete.value = id;
      dialog.value = true;
    };

    const restoreSelectedRoles = () => {
      if (route.query.filter) {
        const roleIds = Array.isArray(route.query.filter)
          ? route.query.filter.map(id => Number(id))
          : [Number(route.query.filter)];
        
        selectedRoles.value = roleIds.map(roleId => {
          const role = roles.value.find(role => role.value === roleId);
          return role || { text: `Роль с ID ${roleId} не найдена`, value: null };
        }).filter(role => role.value !== null);
      }
    };

    onMounted(() => {
      if (route.query.search) searchQuery.value = route.query.search;

      if (route.query.sort && route.query.order) {
        sortBy.value = {
          key: route.query.sort,
          order: route.query.order,
        };
      }

      if (route.query.currentPage){
        currentPage.value = route.query.currentPage;
        console.log("currentPage.value", currentPage.value);
      } 
      
      if (route.query.itemsPerPage) {
        itemsPerPage.value = route.query.itemsPerPage;
        console.log("itemsPerPage.value", itemsPerPage.value);
      }

      fetchRoles().then(() => {
        restoreSelectedRoles();
        fetchUsers();
      });
    });

    watch(
      () => ({
        search: route.query.search,
        sort: route.query.sort,
        order: route.query.order,
        filter: route.query.filter,
        currentPage: route.query.currentPage,
        itemsPerPage: route.query.itemsPerPage
      }),
      (newQuery, oldQuery) => {
        if (
          newQuery.search !== oldQuery.search ||
          newQuery.sort !== oldQuery.sort ||
          newQuery.order !== oldQuery.order ||
          newQuery.filter !== oldQuery.filter ||
          newQuery.itemsPerPage !== oldQuery.itemsPerPage ||
          newQuery.currentPage !== oldQuery.currentPage
        ){
          if (newQuery.sort && newQuery.order) {
            sortBy.value = {
              key: newQuery.sort,
              order: newQuery.order,
            };
          }

          if (newQuery.search) searchQuery.value = newQuery.search;

          console.log("newQuery.currentPage", currentPage.value);
          if (newQuery.currentPage) currentPage.value = parseInt(newQuery.currentPage, 10);

          console.log("newQuery.itemsPerPage", itemsPerPage.value);
          if (newQuery.itemsPerPage) itemsPerPage.value = parseInt(newQuery.itemsPerPage, 10);
          
          let roleIds = [];
          if (newQuery.filter) {
            roleIds = Array.isArray(newQuery.filter)
              ? newQuery.filter.map(id => parseInt(id, 10))
              : [parseInt(newQuery.filter, 10)];
          }

          selectedRoles.value = roleIds.map(roleId => roles.value.find(
            role => role.value === roleId)).filter(role => role !== undefined);

          fetchUsers();
        }
      },
      { immediate: false }
    );

    watch(roles, () => {
      restoreSelectedRoles();
    });

    return {
      users,
      loading,
      error,
      dialog,
      userIdToDelete,
      successMessage,
      formatDate,
      fetchUsers,
      editUser,
      deleteUser,
      confirmDelete,
      sortBy,
      selectedRoles,
      filterRoles,
      searchQuery,
      filterRole,
      roles,
      headers,
      loadItems,
      searchUsers,
      itemsPerPage,
      currentPage,
      totalItems
    };
  }
}

</script>
