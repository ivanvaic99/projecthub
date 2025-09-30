import React, { useEffect, useState, useRef } from 'react';
import { db } from './db.js';

// Column identifiers and human‑friendly titles for rendering.
const COLUMN_TITLES = {
  backlog: 'Backlog',
  inprogress: 'In Progress',
  done: 'Done',
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const titleRef = useRef();
  const descriptionRef = useRef();
  const dueRef = useRef();
  const fileInputRef = useRef();

  // Load tasks from IndexedDB on first render.
  useEffect(() => {
    const load = async () => {
      const all = await db.tasks.toArray();
      setTasks(all);
    };
    load();
  }, []);

  // Save a new task to DB and state.
  const addTask = async (e) => {
    e.preventDefault();
    const title = titleRef.current.value.trim();
    const description = descriptionRef.current.value.trim();
    const dueDate = dueRef.current.value ? new Date(dueRef.current.value).toISOString() : null;
    if (!title) return;
    const id = await db.tasks.add({ title, description, dueDate, column: 'backlog' });
    const newTask = { id, title, description, dueDate, column: 'backlog' };
    setTasks((prev) => [...prev, newTask]);
    titleRef.current.value = '';
    descriptionRef.current.value = '';
    dueRef.current.value = '';
  };

  // Update a task's column (e.g. when dragged).
  const updateTaskColumn = async (id, column) => {
    await db.tasks.update(id, { column });
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, column } : t)));
  };

  // Delete a task entirely.
  const deleteTask = async (id) => {
    await db.tasks.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Export tasks to CSV and trigger a download.
  const exportCSV = () => {
    const header = 'id,title,description,dueDate,column\n';
    const lines = tasks.map((t) => {
      return [t.id, escapeCsv(t.title), escapeCsv(t.description || ''), t.dueDate || '', t.column].join(',');
    });
    const blob = new Blob([header + lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projecthub_tasks.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Escape double quotes in CSV fields and wrap in quotes if needed.
  const escapeCsv = (value) => {
    const str = String(value || '').replace(/"/g, '""');
    if (str.search(/[,\n"]/g) >= 0) {
      return '"' + str + '"';
    }
    return str;
  };

  // Handle CSV import by reading the selected file and parsing lines.
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/).filter(Boolean);
      // Skip header line
      const importedTasks = [];
      for (let i = 1; i < lines.length; i++) {
        const [idStr, title, description, dueDate, column] = parseCsvLine(lines[i]);
        const t = {
          title,
          description,
          dueDate: dueDate || null,
          column: column || 'backlog',
        };
        const id = await db.tasks.add(t);
        importedTasks.push({ id, ...t });
      }
      setTasks((prev) => [...prev, ...importedTasks]);
      fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Parse a CSV line into an array of values, handling quoted fields.
  const parseCsvLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  // Filter tasks by search term.
  const filteredTasks = tasks.filter((t) => {
    const term = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(term) ||
      (t.description && t.description.toLowerCase().includes(term))
    );
  });

  // Drag handlers to support HTML5 drag and drop.
  const onDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', String(id));
  };
  const onDragOver = (e) => {
    e.preventDefault();
  };
  const onDrop = (e, column) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData('text/plain'));
    updateTaskColumn(id, column);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow">
        <h1 className="text-2xl font-bold">ProjectHub</h1>
      </header>
      <main className="flex-1 p-4 overflow-auto">
        {/* Controls */}
        <div className="mb-4 flex flex-col md:flex-row md:items-end gap-4">
          <form onSubmit={addTask} className="flex flex-col md:flex-row gap-2 flex-wrap">
            <input
              ref={titleRef}
              type="text"
              placeholder="Task title"
              className="border rounded p-2 w-48"
              required
            />
            <input
              ref={descriptionRef}
              type="text"
              placeholder="Description"
              className="border rounded p-2 w-56"
            />
            <input
              ref={dueRef}
              type="date"
              className="border rounded p-2"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Task
            </button>
          </form>
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="border rounded p-2 flex-1"
            />
            <button
              onClick={exportCSV}
              className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
            >
              Export CSV
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700"
            >
              Import CSV
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </div>
        {/* Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.keys(COLUMN_TITLES).map((col) => (
            <div
              key={col}
              className="column bg-gray-100 dark:bg-gray-800 rounded p-3 flex flex-col"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col)}
            >
              <h2 className="text-lg font-semibold mb-2 text-center">
                {COLUMN_TITLES[col]}
              </h2>
              <div className="space-y-2 min-h-[50px]">
                {filteredTasks
                  .filter((t) => t.column === col)
                  .sort((a, b) => {
                    // Sort by due date ascending or id
                    const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
                    const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
                    return da - db;
                  })
                  .map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, task.id)}
                      className="bg-white dark:bg-gray-700 p-3 rounded shadow-sm cursor-move"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{task.title}</h3>
                          {task.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {task.description}
                            </p>
                          )}
                          {task.dueDate && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          aria-label="Delete task"
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <footer className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Built with React, Tailwind and Dexie. Tasks are stored locally in your browser and never leave your device.
      </footer>
    </div>
  );
}