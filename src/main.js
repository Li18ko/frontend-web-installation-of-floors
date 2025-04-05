import { createApp } from 'vue'
import App from './App.vue'
import usePermissions from './plugins/usePermissions';
import axios from "axios";
import router from './router'
import { createVuetify } from "vuetify";
import "vuetify/styles";
import '@mdi/font/css/materialdesignicons.css';
import './assets/styles.css'; 

import * as components from "vuetify/components"; 
import * as directives from "vuetify/directives";
import { VCalendar } from "vuetify/labs/VCalendar";
import { VTreeview } from 'vuetify/labs/VTreeview'
import { VList, VListItem, VListItemTitle, VListGroup} from 'vuetify/components';


const api = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5009',
  headers: { 'Content-Type': 'application/json' }
});


const vuetify = createVuetify({
    components: {
        ...components, 
        VCalendar,
        VList,
        VListItem,
        VListItemTitle,
        VListGroup,
        VTreeview
    },
    directives,
});
  
const app = createApp(App);

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error("No refresh token available");

        const { data } = await api.post('/api/Account/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/login');
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      router.push('/403');
    }
    
    return Promise.reject(error);
  }
);

app.provide('api', api);
app.use(usePermissions, { api });
app.use(vuetify);
app.use(router);

app.mount("#app");