package com.example.backend.controller;

import com.example.backend.model.Todo;
import com.example.backend.repository.TodoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/todo")
public class TodoController {
    private final TodoRepository repository;

    public TodoController(TodoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<Todo>> getTodos() {
        List<Todo> todos = repository.findAll();
        return new ResponseEntity<>(todos, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<Todo> createTodo(@RequestBody Todo todo) {
        Todo newTodo = repository.save(todo);
        return new ResponseEntity<>(newTodo, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTodo(@PathVariable int id) {
        repository.deleteById(id);
    }

    @PutMapping("/complete/{id}")
    public ResponseEntity<Todo> completeTodo(@PathVariable int id) {
        Optional<Todo> todoOpt = repository.findById(id);
        if (todoOpt.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "entity not found");

        Todo todo = todoOpt.get();
        todo.setCompleted(true);
        todo = repository.save(todo);
        return new ResponseEntity<>(todo, HttpStatus.OK);
    }
}
