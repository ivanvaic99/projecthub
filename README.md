# ProjectHub – Kanban Project Manager

ProjectHub is a simple, offline‑friendly Kanban board for managing projects and tasks. It lets you create tasks, drag them between **Backlog**, **In Progress** and **Done** columns, add optional descriptions and due dates, and persist your work in the browser using **IndexedDB** via **Dexie**. You can export all tasks to CSV and import them again later.

## Live Demo

When deployed to GitHub Pages the app will be accessible at:

```
https://ivanvaic99.github.io/projecthub/
```

![ProjectHub desktop](./public/screenshots/projecthub/projecthub_home_desktop_1440x900.png)

## Features

* **Drag and drop** – Move tasks between columns using the native HTML5 drag‑and‑drop API.
* **Offline storage** – Tasks persist in the browser via IndexedDB; no backend required.
* **CSV import/export** – Backup your tasks or migrate them to another installation.
* **Search and filter** – Quickly find tasks by title or description.
* **Due dates** – Optional due dates help you prioritise.

## Tech Stack

| Category  | Libraries / Tools              |
|---------:|---------------------------------|
| Framework | React 18                        |
| Styling   | TailwindCSS                     |
| Persistence | Dexie (IndexedDB)            |
| Build     | Vite                            |
| Deployment | GitHub Pages + Actions        |

## Getting Started

Install dependencies and start the dev server:

```sh
npm install
npm run dev
```

To build for production:

```sh
npm run build
```

## CSV Format

Exported CSV files include the following columns: `id`, `title`, `description`, `dueDate` and `column`. To import, ensure your CSV includes the same header row. The application will ignore the `id` column and assign new identifiers.

## License

Provided under the MIT License. Feel free to fork and adapt this project for your own use.