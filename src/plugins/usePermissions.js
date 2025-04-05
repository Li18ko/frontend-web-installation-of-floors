import { ref } from 'vue';
import { jwtDecode } from 'jwt-decode';

export default {
  install: (app, { api }) => { 
    const isAuthenticated = ref(false);
    const permissions = ref([]);

    const getUserIdFromToken = (token) => {
      if (!token) return null;
      try {
        const decoded = jwtDecode(token);
        return decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    };

    const fetchPermissions = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        isAuthenticated.value = false;
        return;
      }

      try {
        const userId = getUserIdFromToken(accessToken);
        if (!userId) throw new Error('Invalid user ID');

        const response = await api.post('/api/Account/userPermissions', parseInt(userId));

        permissions.value = response.data;
        isAuthenticated.value = true;
      } catch (error) {
        console.error('Error fetching permissions:', error);
        logout();
        throw error;
      }
    };

    const logout = async () => {
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const response = await api.post('/api/Account/refresh', JSON.stringify(refreshToken));
          const newAccessToken = response.data.accessToken;
          const newRefreshToken = response.data.refreshToken;
          
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          await api.post('/api/Account/logout', JSON.stringify(newRefreshToken));
        } catch (error) {
          console.error('Ошибка обновления токена', error);
        }finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          isAuthenticated.value = false;
          permissions.value = [];
        }
      }
    };

    const init = async () => {
      if (localStorage.getItem('accessToken')) {
        try {
          await fetchPermissions();
        } catch {
          logout();
        }
      }
    };

    app.provide('permissions', {
      isAuthenticated,
      permissions,
      fetchPermissions,
      hasPermission: (permission) => permissions.value.includes(permission),
      logout
    });

    init();
  }
};
