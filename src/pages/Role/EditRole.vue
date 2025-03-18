<template>
    <v-container>
        <div>
            <h1>Редактировать роль: {{ role.name || 'Загрузка...' }} </h1>
        </div>
        <br>
        <v-form @submit.prevent="editRole">
            <v-row>
                <v-col cols="12" sm="6">
                    <v-text-field v-model="name" ref="firstCell" tabindex="1" label="Название роли"
                        :error-messages="nameError ? [nameError] : []"></v-text-field>
                </v-col>
            </v-row>

            <v-row>
                <v-col cols="12" sm="6">
                    <v-text-field v-model="description" tabindex="2" label="Описание роли"
                    :error-messages="descriptionError ? [descriptionError] : []"></v-text-field>
                </v-col>
            </v-row>

            <v-checkbox v-model="isActive" label="Активность"></v-checkbox>

            <v-combobox v-model="selectedFunctions" :items="functions" item-title="text" item-value="value"
                label="Выберите функции" multiple chips tabindex="3">

                <template v-slot:selection="{ item }">
                    <v-chip>
                        {{ item.text }}
                    </v-chip>
                </template>
            </v-combobox>

            <v-alert v-if="successMessage" type="success" dismissible @input="successMessage = false"
                style="position: fixed; top: 20px; right: 20px; z-index: 2401;">
                Роль изменена!
            </v-alert>

            <div style="display: flex; align-items: center;">
                <v-btn type="submit" tabindex="4" color="primary" style="margin-right: 20px;">Сохранить</v-btn>
                <v-btn color="grey" text to="/roles" tabindex="5">Назад</v-btn>
            </div>
        </v-form>
    </v-container>
</template>

<script>
import { useForm, useField } from 'vee-validate';
import * as yup from 'yup';
import axios from 'axios';
import { ref, onMounted } from 'vue';
import router from '../../router';
import { useRoute } from "vue-router";

export default {
    name: 'EditRole',
    setup() {
        const route = useRoute();
        const roleId = route.params.id;
        const firstCell = ref(null);
        const functions = ref([]);
        const role = ref({
            id: 0,
            name: "",
            description: "",
            active: false,
            functions: [],
        });

        const successMessage = ref(false);

        const schema = yup.object({
            name: yup.string().required('Название роли обязательно'),
            description: yup.string().required('Описание роли обязательно'),
        });

        const { handleSubmit, errors, setValues } = useForm({
            validationSchema: schema
        });

        const { value: name, errorMessage: nameError } = useField('name');
        const { value: description, errorMessage: descriptionError } = useField('description');
        const { value: selectedFunctions } = useField('functions');
        const isActive = ref(false);

        const fetchData = async () => {
            try {
                const [functionsResponse, roleResponse] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/Role/ListFunctions`),
                    axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/Role/${roleId}`)
                ]);

                functions.value = functionsResponse.data.map(func => ({
                    text: func.name,
                    value: func.id
                }));

                role.value = roleResponse.data;
                name.value = roleResponse.data.name;
                description.value = roleResponse.data.description;
                isActive.value = roleResponse.data.active;
                selectedFunctions.value = roleResponse.data.functions ? roleResponse.data.functions.map(func => ({
                    text: func.name,
                    value: func.id
                })) : [];

                if (firstCell.value) {
                    firstCell.value.focus();
                }
            } catch (error) {
                console.error("Ошибка при загрузке данных", error);
            }
        };

        const editRole = handleSubmit(async () => {
            try {
                const functionIds = selectedFunctions.value.map(functionItem => functionItem.value);
                await axios.put(`${import.meta.env.VITE_APP_BASE_URL}/api/Role`, {
                    id: role.value.id,
                    name: name.value,
                    description: description.value,
                    active: isActive.value,
                    functionIds: functionIds
                });

                successMessage.value = true;

                setTimeout(() => {
                    successMessage.value = false;
                    router.push("/roles");
                }, 2000);
            } catch (error) {
                console.error("Ошибка при сохранении изменений", error);
            }
        });

        onMounted(() => {
            fetchData();
        });

        return {
            name,
            description,
            role,
            nameError,
            descriptionError,
            selectedFunctions,
            isActive,
            successMessage,
            editRole,
            firstCell,
            functions,
        };
    }
}
</script>
