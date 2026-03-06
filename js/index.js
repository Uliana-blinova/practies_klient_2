let eventBus = new Vue()
Vue.component('task-creator', {
    template: `
        <div class="creator-panel">
            <form @submit.prevent="handleCreate">
                <div class="input-block">
                    <label>Название задачи</label>
                    <input v-model="form.title" placeholder="Введите заголовок" required>
                </div>
                
                <div class="steps-container">
                    <div v-for="(step, index) in form.steps" :key="index" class="step-entry">
                        <div class="step-num">Шаг {{ index + 1 }}</div>
                        <div class="step-controls">
                            <input v-model="step.content" placeholder="Описание действия" required>
                            <button 
                                type="button" 
                                v-if="index >= 2" 
                                @click="removeStep(index)"
                                class="icon-btn remove">−</button>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" @click="addStep" v-if="form.steps.length < 5" class="btn-secondary">
                        Добавить шаг
                    </button>
                    <button type="submit" class="btn-primary">Создать задачу</button>
                </div>
            </form>
        </div>
    `,
    data() {
        return {
            form: {
                title: '',
                steps: [
                    { content: '', status: false },
                    { content: '', status: false },
                    { content: '', status: false }
                ]
            }
        }
    },
    methods: {
        addStep() {
            if (this.form.steps.length < 5) {
                this.form.steps.push({ content: '', status: false })
            }
        },
        removeStep(index) {
            if (index >= 2) {
                this.form.steps.splice(index, 1)
            }
        },
        handleCreate() {
            const payload = {
                title: this.form.title,
                steps: this.form.steps.map(s => ({ content: s.content, status: false })),
                meta: { created: Date.now() }
            }

            eventBus.$emit('task:created', payload)
            this.form.title = ''
            this.form.steps = [
                { content: '', status: false },
                { content: '', status: false },
                { content: '', status: false }
            ]
        }
    }

})

Vue.component('task-card', {
    props: {
        data: Object,
        type: Boolean
    },
    template: `
        <article class="task-item" :class="{ loked: type }">
            <header>
                <h4>{{ data.title }}</h4>
            </header>
            <ul class="task-steps">
                <li v-for="(step, index) in data.steps" :key="index">
                    <label class="checkbox-label">
                        <input 
                            type="checkbox" 
                            :checked="step.status"
                            @change="emitChange(index)"
                            :disabled="step.status || type"
                        >
                        <span :class="{ ready: step.status }">{{ step.content }}</span>
                    </label>
                </li>
            </ul>
            <footer v-if="data.meta && data.meta.completed">
                <time>Завершено: {{ formatTime(data.meta.completed) }}</time>
            </footer>
        </article>
    `,
    methods: {
        emitChange(index) {
            if (this.type) return
            this.$emit('step-update', {
                taskId: this.data.id,
                stepIndex: index
            })
        },
        formatTime(ts) {
            return new Date(ts).toLocaleString('ru-RU')
        }
    }
})
