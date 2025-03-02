<script>
export default{
  name: "App"
}
</script>

<template>
  <v-app>
    <v-app-bar app class="pl-4 pr-4">
      <v-btn text to="/tasks">Задачи</v-btn>
      <v-btn text to="/users">Пользователи</v-btn>
    </v-app-bar>

    <v-main>
      <router-view></router-view>
    </v-main>

    <v-footer app class="elevation-5">
      <v-row justify="center">
          <v-col class="text-center">
            <p>Контакты</p>
          </v-col>
        </v-row>
    </v-footer>
  </v-app>
</template>


<style scoped>
</style>

