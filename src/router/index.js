import { createRouter, createWebHistory } from 'vue-router'
import Tasks from '../pages/Task/Calendar.vue'
import Users from '../pages/User/IndexUsers.vue'
import AddUser from '../pages/User/AddUser.vue'
import EditUser from '../pages/User/EditUser.vue'
import Roles from '../pages/Role/IndexRoles.vue'
import AddRole from '../pages/Role/AddRole.vue'
import EditRole from '../pages/Role/EditRole.vue'
import Login from '../pages/Auth/Login.vue'
import Profile from '../pages/Auth/Profile.vue'
import NotFound from '../pages/Errors/404.vue'
import Forbidden from '../pages/Errors/403.vue'

const routes = [
  {
    path: '/',
    redirect: '/login' 
  },
  {
    path: '/tasks', name: 'Tasks', component: Tasks, meta: { auth: true }
  },
  {
    path: '/users', name: 'Users', component: Users, meta: { auth: true }
  },
  {
    path: '/users/add', name: 'AddUser', component: AddUser, meta: { auth: true }
  },
  {
    path: '/users/edit/:id', name: 'EditUser', component: EditUser, props: true, meta: { auth: true }
  },
  {
    path: '/roles', name: 'Roles', component: Roles, meta: { auth: true }
  },
  { path: '/roles/add', name: 'AddRole', component: AddRole, meta: { auth: true }
  },
  { path: '/roles/edit/:id', name: 'EditRole', component: EditRole, props: true, meta: { auth: true }
  },
  {
    path: '/login', name: 'Login', component: Login, meta: { auth: false }
  },
  {
    path: '/profile', name: 'Profile', component: Profile, meta: { auth: true }
  },
  {
    path: '/403', name: 'Forbidden', component: Forbidden, meta: { auth: false }
  },
  {
    path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound, meta: { auth: false }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('accessToken');  

  if (to.meta.auth && !isAuthenticated) {
    next('/login'); 
  } else if (to.path === '/login' && isAuthenticated) {
    next('/profile');   
  } 

  if (to.meta.requiredPermission) {
    const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
    if (!permissions.includes(to.meta.requiredPermission)) {
      return next('/403');
    }
  }

  next();
});

export default router