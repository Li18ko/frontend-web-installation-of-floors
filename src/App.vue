<script>
export default{
  name: "App"
}
</script>

<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title>Installation Of Floors</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text to="/tasks">Задачи</v-btn>
      <v-btn text to="/users">Пользователи</v-btn>
    </v-app-bar>

    <v-main>
      <router-view></router-view>
    </v-main>

    <v-footer app>
    </v-footer>
  </v-app>
</template>


<style scoped>
</style>

