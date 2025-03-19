import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createVuetify } from "vuetify";
import "vuetify/styles";
import '@mdi/font/css/materialdesignicons.css';

import * as components from "vuetify/components"; 
import * as directives from "vuetify/directives";

import { VCalendar } from "vuetify/labs/VCalendar";
import { VTreeview } from 'vuetify/labs/VTreeview'
import { VList, VListItem, VListItemTitle, VListGroup} from 'vuetify/components';



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

app.use(vuetify);
app.use(router);

app.mount("#app");