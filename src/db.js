import Dexie from 'dexie';

// Initialise IndexedDB via Dexie. The schema is simple: a table of
// tasks with an auto‑incrementing primary key and a few indexed
// properties. Additional properties can be added in future versions.
export const db = new Dexie('projecthub');
db.version(1).stores({
  tasks: '++id, title, description, dueDate, column',
});