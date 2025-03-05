import { createRouter, createWebHistory } from 'vue-router'
import Tasks from '../pages/Task/Calendar.vue'
import Users from '../pages/User/IndexUsers.vue'
import AddUser from '../pages/User/AddUser.vue'
import EditUser from '../pages/User/EditUser.vue'
import Roles from '../pages/Role/IndexRoles.vue'
import AddRole from '../pages/Role/AddRole.vue'
import EditRole from '../pages/Role/EditRole.vue'

const routes = [
  {
    path: '/tasks',
    name: 'Tasks',
    component: Tasks
  },
  {
    path: '/users',
    name: 'Users',
    component: Users
  },
  {
    path: '/users/add',
    name: 'AddUser',
    component: AddUser
  },
  {
    path: '/users/edit/:id',
    name: 'EditUser',
    component: EditUser,
    props: true
  },
  {
    path: '/roles',
    name: 'Roles',
    component: Roles
  },
  {
    path: '/roles/add',
    name: 'AddRole',
    component: AddRole
  },
  {
    path: '/roles/edit/:id',
    name: 'EditRole',
    component: EditRole,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes
})

export default router