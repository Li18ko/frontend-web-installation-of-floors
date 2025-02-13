<script>
import axios from 'axios';

export default {
  data() {
    return {
      selectedDate: [new Date()],
      events: [],
      selectedEvents: [],
      currentDate: new Date(),
      dialog: false,
      selectedEvent: {},
      statusOptions: [
        { text: "Открыта", value: 0 },
        { text: "Выполнена", value: 1 },
        { text: "Отменена", value: 2 },
      ],
      formattedDeadline: "",
      calendarKey: Date.now()
    };
  },
  name: 'Tasks',
  computed: {
    currentMonth() {
      return this.currentDate.toLocaleDateString("ru-RU", { year: "numeric", month: "long" });
    },
    calendarDate: {
      get() {
        console.log(this.currentDate.toISOString());
        return this.currentDate.toISOString().split('T')[0];
      },
      set(newDate) {
        this.currentDate = new Date(newDate);
      }
    }
  },
  watch: {
    selectedEvent: {
      handler(newEvent) {
        if (newEvent && newEvent.start) {
          console.log('Полученная дата события:', newEvent.start);
          const date = new Date(newEvent.start);
          if (!isNaN(date.getTime())) {
            this.formattedDeadline = this.formatDateTimeLocal(date);
          } else {
            console.error("Неверная дата события:", newEvent.start);
          }
        }
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {
    this.loadEvents();
  },
  methods: {
    async loadEvents() {
      try {
        const response = await axios.get('http://localhost:5009/api/Task/List');  
        const fetchedEvents = response.data;

        console.log("Полученные события:", fetchedEvents);

        this.events = fetchedEvents.map(event => {
          const start = new Date(event.deadline);
          if (isNaN(start.getTime())) {
            console.error("Некорректная дата события:", event.deadline);
            return null;
          }

          return {
            start,
            end: start,
            title: event.title,
            comment: event.comment,
            address: event.address,
            createdAt: event.createdAt,
            workerId: event.workerId,
            status: event.status,
            color: this.getEventColor(event),
            id: event.id
          };
        }).filter(event => event !== null);

          
        console.log("Итоговый массив событий для календаря:", this.events);

        this.calendarKey = Date.now();

      } catch (error) {
        console.error('Ошибка при загрузке событий:', error);
      }
    },
    
    getEventColor(event) {
      if (event.status === 0) { 
        return 'blue';
      } else if (event.status === 1) {
        return 'green';
      } else if (event.status === 2) { 
        return 'red';
      }
      return 'grey';
    },

    openEventDialog(event) {
      this.selectedEvent = event; 
      this.dialog = true;
    },

    formatDate(date) {
      if (!date) return "нет данных";
      
      return new Intl.DateTimeFormat("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short"  
      }).format(new Date(date));
    },

    async saveEvent() {
      try {
        console.log('Данные для отправки на сервер:', {
          id: this.selectedEvent.id,
          title: this.selectedEvent.title,
          deadline: this.selectedEvent.start,  
          comment: this.selectedEvent.comment,
          address: this.selectedEvent.address,
          workerId: this.selectedEvent.workerId,
          status: this.selectedEvent.status
        });
        
        const response = await axios.put('http://localhost:5009/api/Task', {
          id: this.selectedEvent.id,
          title: this.selectedEvent.title,
          deadline: this.selectedEvent.start,
          comment: this.selectedEvent.comment,
          address: this.selectedEvent.address,
          workerId: this.selectedEvent.workerId,
          status: this.selectedEvent.status
        });

        console.log('Задача обновлена:', response.data);
        this.dialog = false;
        this.loadEvents();

        this.calendarKey = Date.now();
      } catch (error) {
        console.error('Ошибка при обновлении задачи:', error);
      }
    },
 
    async deleteEvent() {
      if (!confirm("Вы уверены, что хотите удалить задачу?")) return;

      try {
        await axios.delete(`http://localhost:5009/api/Task/${this.selectedEvent.id}`);

        console.log('Задача удалена:', this.selectedEvent.id);
        this.dialog = false;
        this.loadEvents();   
        this.calendarKey = Date.now();
      } catch (error) {
        console.error('Ошибка при удалении задачи:', error);
      }
    },

    formatDateTimeLocal(date) {
      const d = new Date(date);
      if (isNaN(d.getTime())) {  
        console.error('Invalid date:', date);
        return '';
      }
      return d.toISOString().slice(0, 16);
    },

    updateDeadline(event) {
      const deadline = new Date(this.formattedDeadline);  
      if (!isNaN(deadline.getTime())) {
        const utcDeadline = new Date(deadline.toISOString());
         this.selectedEvent.start = utcDeadline.toISOString();
         console.log('Новая дата дедлайна в UTC:', this.selectedEvent.start);
      } else {
        console.error('Неверная дата для дедлайна:', this.formattedDeadline);
      }
    }
  }
};
</script>

<template>
  <v-container>
    <v-calendar
      :key="calendarKey"
      v-model="selectedDate"
      type="month"
      :events="events"
      :first-day-of-week="1"
    >
      <template v-slot:event="{ event }">
        <v-card
          :color="event.color"
          dark
          class="ma-2 pa-2"
          style="max-width: 250px;"
          @click="openEventDialog(event)" 
        >
          <v-card-title class="headline">{{ event.title }}</v-card-title>
          <v-card-text>
            <div>
              <strong>Дедлайн:</strong>
              {{ formatDate(event.start) }}
            </div>
            <div>
              <strong>Исполнитель (ID):</strong> {{ event.workerId }}
            </div>
          </v-card-text>
        </v-card>
      </template>
    </v-calendar>

    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">Редактирование события</span>
        </v-card-title>

        <v-card-text>
          <v-text-field v-model="selectedEvent.title" label="Название"></v-text-field>

          <v-text-field v-model="selectedEvent.id" label="ID" disabled></v-text-field>

          <v-text-field
            v-model="formattedDeadline"
            label="Дедлайн"
            type="datetime-local"
            @input="updateDeadline"
          />

          <v-textarea v-model="selectedEvent.comment" label="Комментарий"></v-textarea>

          <v-text-field v-model="selectedEvent.address" label="Адрес"></v-text-field>

          <v-text-field v-model="selectedEvent.workerId" label="Исполнитель (ID)"></v-text-field>

          <v-select
            v-model="selectedEvent.status"
            :items="statusOptions"
            label="Статус"
            item-value="value"
            item-text="text"
          ></v-select>
        </v-card-text>

        <v-card-actions>
          <v-btn color="red" @click="deleteEvent">Удалить</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="blue" @click="saveEvent">Сохранить</v-btn>
          <v-btn color="gray" @click="dialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>


<style scoped>
</style>

