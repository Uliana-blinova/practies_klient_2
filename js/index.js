
let eventBus = new Vue()

Vue.component('task-creator', {
    template: `
        <div class="creator-panel">
            <form @submit.prevent="handleCreate">
                <div class="input-block">
                    <label>Название задачи</label>
                    <div class="step-controls title-controls">
                        <input v-model="form.title" placeholder="Введите заголовок" required>
                    </div>
                </div>
                
                <div class="steps-container">
                    <div v-for="(step, index) in form.steps" :key="index" class="step-entry">
                        <div class="step-num">Шаг {{ index + 1 }}</div>
                        <div class="step-controls">
                            <input v-model="step.content" placeholder="Описание действия" required>
                            <button 
                                type="button" 
                                v-if="index >= 3" 
                                @click="removeStep(index)"
                                class="icon-btn remove">−</button>
                            <div v-else class="btn-placeholder"></div>
                        </div>

                        <div class="sub-steps-list">
                            <div v-for="(sub, sIndex) in step.subSteps" :key="sIndex" class="sub-step-entry step-controls">
                                <input v-model="sub.content" placeholder="Подпункт">
                                <button type="button" @click="removeSubStep(index, sIndex)" class="icon-btn remove">−</button>
                            </div>
                            <button 
                                type="button" 
                                v-if="step.subSteps.length < 7" 
                                @click="addSubStep(index)" 
                                class="icon-btn add">
                                + Добавить подпункт
                            </button>
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
                    { content: '', status: false, subSteps: [] },
                    { content: '', status: false, subSteps: [] },
                    { content: '', status: false, subSteps: [] }
                ]
            }
        }
    },
    methods: {
        addStep() {
            if (this.form.steps.length < 5) {
                this.form.steps.push({ content: '', status: false, subSteps: [] })
            }
        },
        removeStep(index) {
            if (index >= 3 && this.form.steps.length > 3) {
                this.form.steps.splice(index, 1)
            }
        },
        addSubStep(stepIndex) {
            this.form.steps[stepIndex].subSteps.push({ content: '', status: false })
        },
        removeSubStep(stepIndex, subIndex) {
            this.form.steps[stepIndex].subSteps.splice(subIndex, 1)
        },
        handleCreate() {
            if (!this.form.title.trim()) {
                alert('Заполните заголовок')
                return
            }

            let allFilled = true
            for (let step of this.form.steps) {
                if (!step.content.trim()) {
                    allFilled = false
                    break
                }
                for (let sub of step.subSteps) {
                    if (!sub.content.trim()) {
                        allFilled = false
                        break
                    }
                }
            }

            if (!allFilled) {
                alert('Заполните все действия и подпункты')
                return
            }

            const payload = {
                title: this.form.title,
                steps: this.form.steps.map(step => ({
                    content: step.content,
                    status: false,
                    subSteps: step.subSteps.map(sub => ({ content: sub.content, status: false }))
                })),
                meta: { created: Date.now() }
            }

            eventBus.$emit('task:created', payload)

            this.form.title = ''
            this.form.steps = [
                { content: '', status: false, subSteps: [] },
                { content: '', status: false, subSteps: [] },
                { content: '', status: false, subSteps: [] }
            ]
        }
    }
});

Vue.component('task-card', {
    props: {
        data: Object,
        readonly: Boolean
    },
    data() {
        return {
            openAccordion: {}
        }
    },
    template: `
        <article class="task-item" :class="{ loked: readonly }">
            <header>
                <h4>{{ data.title }}</h4>
            </header>
            <ul class="task-steps">
                <li v-for="(step, index) in stepsList" :key="index">
        
                    <div class="step-header">
                        <label class="checkbox-label" style="flex:1">
                            <input 
                                type="checkbox" 
                                :checked="step.status"
                                @change="handleParentCheck(index)"
                                :disabled="isParentDisabled(step) || readonly"
                            >
                            <span :class="{ ready: step.status }">{{ step.content }}</span>
                        </label>
                  
                        <button 
                            v-if="step.subSteps && step.subSteps.length > 0"
                            class="accordion-toggle" 
                            @click="toggleAccordion(index)">
                            {{ openAccordion[index] ? '▲' : '▼' }}
                        </button>
                    </div>

                    <div v-if="openAccordion[index] && step.subSteps && step.subSteps.length > 0" class="sub-steps-container">
                        <div v-for="(sub, sIndex) in step.subSteps" :key="sIndex" class="sub-step-item">
                            <input 
                                type="checkbox" 
                                :checked="sub.status"
                                @change="handleSubCheck(index, sIndex)"
                                :disabled="readonly"
                            >
                            <span :class="{ ready: sub.status }">{{ sub.content }}</span>
                        </div>
                    </div>
                </li>
            </ul>
            <footer v-if="data.meta && data.meta.completed">
                <p>Завершено: {{ formatTime(data.meta.completed) }}</p>
            </footer>
        </article>
    `,
    computed: {
        stepsList() {
            return this.data.steps
        }
    },
    methods: {
        toggleAccordion(index) {
            this.$set(this.openAccordion, index, !this.openAccordion[index])
        },

        isParentDisabled(step) {
            if (!step.subSteps || step.subSteps.length === 0) {
                return false
            }
            if (step.status) {
                return false
            }
            for (let i = 0; i < step.subSteps.length; i++) {
                if (!step.subSteps[i].status) {
                    return true
                }
            }
            return false
        },

        handleParentCheck(index) {
            const step = this.data.steps[index]

            this.emitChange(index)
        },

        handleSubCheck(stepIndex, subIndex) {
            const step = this.data.steps[stepIndex]
            const sub = step.subSteps[subIndex]

            sub.status = !sub.status

            let allSubsDone = true
            for (let i = 0; i < step.subSteps.length; i++) {
                if (!step.subSteps[i].status) {
                    allSubsDone = false
                    break
                }
            }

            if (allSubsDone) {
                if (!step.status) {
                    step.status = true
                    this.emitChange(stepIndex)
                }
            } else {
                if (step.status) {
                    step.status = false
                    this.emitChange(stepIndex)
                }
            }

            this.persist()
        },

        emitChange(index) {
            if (this.readonly) return
            this.$emit('step-update', {
                taskId: this.data.id,
                stepIndex: index
            })
        },
        persist() {
            eventBus.$emit('tasks:save')
        },
        formatTime(ts) {
            return new Date(ts).toLocaleString('ru-RU')
        }
    }
})

Vue.component('phase-list', {
    props: {
        phaseId: Number,
        tasks: Array,
        capacity: Number
    },
    template: `
        <div class="task-stack">
            <task-card 
                v-for="task in currentTasks" 
                :key="task.id"
                :data="task"
                :readonly="lockState(task)"
                @step-update="processCheck"
            ></task-card>
        </div>
    `,
    computed: {
        currentTasks() {
            return this.tasks.filter(t => t.phase === this.phaseId)
        }
    },
    methods: {
        lockState(task) {
            if (this.phaseId !== 1) return false
            const phase2Count = this.tasks.filter(t => t.phase === 2).length
            if (phase2Count >= 5) {
                if (this.calcPercent(task) > 50) return true
            }
            return false
        },
        calcPercent(task) {
            const list = task.steps
            if (!list.length) return 0
            const completed = list.filter(s => s.status).length
            return Math.round((completed / list.length) * 100)
        },
        processCheck(payload) {
            const target = this.tasks.find(t => t.id === payload.taskId)
            if (!target) return

            this.evaluateFlow(target)
            this.persist()
        },
        evaluateFlow(task) {
            const percent = this.calcPercent(task)

            if (task.phase === 1 && percent >= 50) {
                const phase2Count = this.tasks.filter(t => t.phase === 2).length
                if (phase2Count < 5) {
                    task.phase = 2
                    this.persist()
                }
            } else if (task.phase === 2 && percent === 100) {
                task.phase = 3
                if (!task.meta) task.meta = {}
                task.meta.completed = Date.now()
                this.persist()
            }
        },
        persist() {
            eventBus.$emit('tasks:save')
        }
    }
})

Vue.component('board-column', {
    props: {
        data: Object,
        tasks: Array
    },
    template: `
    <section class="workflow-column">
        <h3 class="column-title">{{ data.label }}</h3>
        <phase-list
        :phase-id="data.id"
        :tasks="tasks"
        :capacity="data.limit"
        ></phase-list>
    </section>
    `
})

Vue.component('app', {
    template: `
        <div>
            <header class="app-header">
                <h1>Заметки</h1>
            </header>
            <div class="search-bar">
                <input 
                    v-model="searchQuery" 
                    placeholder="Поиск по названию задачи..." 
                >
            </div>

            <task-creator></task-creator>
            <div class="kanban-board">
                <board-column 
                    v-for="phase in phases" 
                    :key="phase.id"
                    :data="phase"
                    :tasks="filteredTasks">
                </board-column>
            </div>
        </div>
    `,
    data() {
        return {
            searchQuery: '',
            phases: [
                { id: 1, label: 'Новые', limit: 3 },
                { id: 2, label: 'В процессе', limit: 5 },
                { id: 3, label: 'Готовые', limit: null }
            ],
            taskList: []
        }
    },
    computed: {
        filteredTasks() {
            if (!this.searchQuery) return this.taskList;
            const query = this.searchQuery.toLowerCase();
            return this.taskList.filter(task =>
                task.title.toLowerCase().includes(query)
            );
        }
    },
    methods: {
        saveTasks() {
            try {
                localStorage.setItem('workflow_tasks', JSON.stringify(this.taskList))
            } catch (e) {
                console.error('Ошибка сохранения:', e)
            }
        },
        loadTasks() {
            try {
                const saved = localStorage.getItem('workflow_tasks')
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed)) {
                        this.taskList = parsed
                    }
                }
            } catch (e) {
                console.error('Ошибка загрузки:', e)
                this.taskList = []
            }
        },
        clearTasks() {
            localStorage.removeItem('workflow_tasks')
            this.taskList = []
        }
    },
    mounted() {
        this.loadTasks()

        eventBus.$on('task:created', (payload) => {
            const phase1Count = this.taskList.filter(t => t.phase === 1).length
            if (phase1Count >= 3) {
                alert('Первая колонка переполнена (максимум 3 задачи)')
                return
            }
            const newTask = {
                id: Date.now(),
                title: payload.title,
                steps: payload.steps,
                phase: 1,
                meta: payload.meta
            }
            this.taskList.push(newTask)
            this.saveTasks()
        })

        eventBus.$on('tasks:save', () => {
            this.saveTasks()
        })

    }
})

const app = new Vue({
    el: '#workflow-app',
})