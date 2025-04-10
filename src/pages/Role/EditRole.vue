<template>
    <v-container>
        <div>
            <h1>Редактировать роль: {{ role.name || 'Загрузка...' }} </h1>
        </div>
        <br>
        <v-tabs
        v-model="activeTab"
        align-tabs="left"
        color="deep-purple-accent-4"
        >
            <v-tab :value="0">Роль</v-tab>
            <v-tab :value="1">Функции</v-tab>   
        </v-tabs>
        <br>

        <v-form @submit.prevent="editRole">
            <v-tabs-window v-model="activeTab">
                <v-tabs-window-item :key="0" :value="0">
                    <v-row>
                        <v-col cols="12" sm="6">
                            <v-text-field v-model="name" ref="firstCell" tabindex="1" label="Название роли"
                                :error-messages="nameError ? [nameError] : []"></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field v-model="description" tabindex="2" label="Описание роли"
                            :error-messages="descriptionError ? [descriptionError] : []"></v-text-field>
                        </v-col>
                    </v-row>

                    <v-checkbox v-model="isActive" label="Активность"></v-checkbox>
                </v-tabs-window-item>
                
                <v-tabs-window-item :key="1" :value="1">
                    <v-col cols="12" sm="4">
                        <v-select
                            v-model="selectedSortOrder"
                            :items="sortOptions"
                            label="Сортировка функций"
                            @update:modelValue="filterFunctions"
                        ></v-select>
                    </v-col>

                    <v-card-text>
                        <v-treeview
                            v-model:selected="selectedFunctions"
                            :items="treeData"
                            select-strategy="leaf"
                            item-props
                            open-all
                            selectable
                        />
                    </v-card-text>
                </v-tabs-window-item>
            </v-tabs-window>
            
            <v-alert v-if="successMessage" type="success" dismissible @input="successMessage = false" class="alert">
                Роль изменена!
            </v-alert>

            <div class="button-form">
                <v-btn type="submit" tabindex="4" color="primary" class="margin-right">Сохранить</v-btn>
                <v-btn color="grey" text to="/roles" tabindex="5">Назад</v-btn>
            </div>
        </v-form>
    </v-container>
</template>

<script>
import { useForm, useField } from 'vee-validate';
import * as yup from 'yup';
import { ref, onMounted, watch, inject } from 'vue';
import router from '../../router';
import { useRoute, useRouter } from 'vue-router';

export default {
    name: 'EditRole',
    setup() {
        const permissions = inject('permissions');
        const api = inject('api');

        const route = useRoute();
        const router = useRouter();

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
        const activeTab = ref(0);
        const treeData = ref([]);
        const selectedFunctions = ref([]);

        const successMessage = ref(false);

        const selectedSortOrder = ref("asc");
        const sortOptions = [
            { title: "По возрастанию приоритета", value: "desc" },
            { title: "По убыванию приоритета", value: "asc" }
        ];

        const schema = yup.object({
            name: yup.string().required('Название роли обязательно'),
            description: yup.string().required('Описание роли обязательно'),
        });

        const { handleSubmit, errors, setValues } = useForm({
            validationSchema: schema
        });

        const { value: name, errorMessage: nameError } = useField('name');
        const { value: description, errorMessage: descriptionError } = useField('description');
        const isActive = ref(false);

        const fetchData = async () => {
            try {
                const [functionsResponse, roleResponse] = await Promise.all([
                    api.get(`/api/Role/ListFunctions`, {
                        params: { order: route.query.order || "asc" }
                    }),
                    api.get(`/api/Role/${roleId}`)
                ]);

                const groupedFunctions = {};

                functionsResponse.data.forEach(func => {
                    const module = func.module || "Прочее";

                    if (!groupedFunctions[module]) {
                        groupedFunctions[module] = [];
                    }

                    groupedFunctions[module].push({
                        title: func.name,
                        value: func.id,
                        selected: roleResponse.data.functions.some(roleFunc => roleFunc.id === func.id)
                    });
                });

                treeData.value = Object.keys(groupedFunctions).map(moduleName => ({
                    title: moduleName,
                    value: moduleName,
                    children: groupedFunctions[moduleName]
                }));

                console.log("treeData.value", treeData.value);

                role.value = roleResponse.data;
                name.value = roleResponse.data.name;
                description.value = roleResponse.data.description;
                isActive.value = roleResponse.data.active;

                selectedFunctions.value = roleResponse.data.functions.map(func => func.id);

                if (firstCell.value) {
                    firstCell.value.focus();
                }
                
            } catch (error) {
                console.error("Ошибка при загрузке данных", error);
            }
        };

        const filterFunctions = async () => {
            router.replace({
            name: route.name,
            query: {
                ...route.query,
                order: selectedSortOrder.value,
            },
            });
        };
  

        const editRole = handleSubmit(async () => {
            try {
                await api.put(`/api/Role`, {
                    id: role.value.id,
                    name: name.value,
                    description: description.value,
                    active: isActive.value,
                    functionIds: selectedFunctions.value
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

        onMounted(async () => {
            if (route.query.order) {
                selectedSortOrder.value = route.query.order;
            }

            await fetchData();
        });

        watch(
            () => route.query.order,
            (newSort, oldSort) => {
            if (newSort !== oldSort) {
                selectedSortOrder.value = newSort;
                fetchData();
            }
            }
        );


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
            activeTab,
            treeData,
            selectedSortOrder,
            sortOptions,
            filterFunctions,
            permissions
        };
    }
}
</script>
