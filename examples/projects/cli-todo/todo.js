#!/usr/bin/env node
// Chapter 35 — Project 1: Command-line Todo app
//
// Usage:
//   node todo.js add "Buy milk"
//   node todo.js list
//   node todo.js complete 1
//   node todo.js remove 1
//
// Stores todos in todos.json next to this file. No external dependencies.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "todos.json");

// --- Data layer ------------------------------------------------------

function loadTodos() {
  if (!existsSync(DATA_FILE)) return [];
  const raw = readFileSync(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

function saveTodos(todos) {
  writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2), "utf8");
}

// --- Command handlers --------------------------------------------------

function addTodo(todos, text) {
  if (!text || !text.trim()) {
    console.log('Usage: todo.js add "<text>"');
    return todos;
  }
  const nextId = todos.reduce((max, t) => Math.max(max, t.id), 0) + 1;
  const todo = { id: nextId, text: text.trim(), done: false };
  console.log(`Added #${todo.id}: ${todo.text}`);
  return [...todos, todo];
}

function listTodos(todos) {
  if (todos.length === 0) {
    console.log("No todos yet. Add one with: todo.js add \"<text>\"");
    return;
  }
  for (const todo of todos) {
    const box = todo.done ? "[x]" : "[ ]";
    console.log(`  ${box} #${todo.id}  ${todo.text}`);
  }
}

function completeTodo(todos, idArg) {
  const id = Number(idArg);
  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    console.log(`No todo with id ${idArg}`);
    return todos;
  }
  todo.done = true;
  console.log(`Completed #${todo.id}: ${todo.text}`);
  return todos;
}

function removeTodo(todos, idArg) {
  const id = Number(idArg);
  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    console.log(`No todo with id ${idArg}`);
    return todos;
  }
  console.log(`Removed #${todo.id}: ${todo.text}`);
  return todos.filter((t) => t.id !== id);
}

function printUsage() {
  console.log(`Todo CLI — usage:
  node todo.js add "<text>"     Add a new todo
  node todo.js list              List all todos
  node todo.js complete <id>     Mark a todo as done
  node todo.js remove <id>       Delete a todo`);
}

// --- Dispatcher ---------------------------------------------------

const [, , command, ...args] = process.argv;
let todos = loadTodos();

switch (command) {
  case "add":
    todos = addTodo(todos, args.join(" "));
    break;
  case "list":
    listTodos(todos);
    break;
  case "complete":
    todos = completeTodo(todos, args[0]);
    break;
  case "remove":
    todos = removeTodo(todos, args[0]);
    break;
  default:
    printUsage();
    process.exit(command ? 1 : 0);
}

saveTodos(todos);
