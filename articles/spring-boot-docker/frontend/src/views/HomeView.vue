<script setup lang="ts">
import { ref, onMounted } from 'vue'
type Todo = {
  id: number
  title: string
  completed: boolean
}

const todos = ref<Todo[]>([])
const newTodo = ref('')

const fetchTodos = async () => {
  const res = await fetch(`${import.meta.env.VITE_API_HOST}/api/todo`)
  todos.value = await res.json()
}

const addTodo = async () => {
  const res = await fetch(`${import.meta.env.VITE_API_HOST}/api/todo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: newTodo.value, completed: false })
  })
  const added = await res.json()
  todos.value.push(added)
  newTodo.value = ''
}

const completeTodo = async (id: number) => {
  const res = await fetch(`${import.meta.env.VITE_API_HOST}/api/todo/complete/${id}`, {
    method: 'PUT'
  })
  const updated = await res.json()
  const idx = todos.value.findIndex(t => t.id === id)
  if (idx !== -1) todos.value[idx] = updated
}

const deleteTodo = async (id: number) => {
  await fetch(`${import.meta.env.VITE_API_HOST}/api/todo/${id}`, {
    method: 'DELETE'
  })
  todos.value = todos.value.filter(t => t.id !== id)
}

onMounted(fetchTodos)
</script>

<template>
  <div class="todo-app">
    <h1>Todo App</h1>

    <form @submit.prevent="addTodo">
      <input v-model="newTodo" placeholder="New todo" required />
      <button type="submit">Add</button>
    </form>

    <ul>
      <li v-for="todo in todos" :key="todo.id" :class="{ completed: todo.completed }">
        <span>{{ todo.title }}</span>
        <button @click="completeTodo(todo.id)" :disabled="todo.completed">Complete</button>
        <button @click="deleteTodo(todo.id)">Delete</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.todo-app {
  max-width: 500px;
  margin: auto;
  font-family: sans-serif;
}

.completed span {
  text-decoration: line-through;
  color: gray;
}

form {
  margin-bottom: 1em;
}

button {
  margin-left: 0.5em;
}
</style>