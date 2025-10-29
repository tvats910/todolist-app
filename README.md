# Full-Stack To-Do List Application 📝

A modern and responsive task management application built with a Next.js frontend and a Node.js/Express backend. This project showcases modern full-stack development practices, allowing users to securely register, log in, and manage their daily tasks on a public, interactive task board.

## ✨ Features

- **Secure Authentication:** User registration and login with JWTs, including session expiration and a dropdown menu for account management.
- **Public Task Board:** A dynamic, grid-based view of tasks from all users, visible to everyone.
- **Task Previews & Modals:** User cards show a preview of recent tasks. Clicking a card opens a modal with a full, scrollable list.
- **User Dashboard:** A protected `/dashboard` route that displays detailed account information and a complete list of the logged-in user's tasks.
- **Search Functionality:** A real-time search bar to filter the public board by either username or task title.
- **Role-Based Access:** The backend is built with an `ADMIN` role, allowing for future expansion of administrative features.
- **Modern UI:** A beautiful, responsive interface built with Shadcn/UI, Tailwind CSS, and Framer Motion for staggered loading animations.
- **Dark/Light Mode:** A theme toggle to switch between light and dark modes.

## 🚀 Tech Stack

**Frontend:**
- **Framework:** [Next.js](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Shadcn/UI](https://ui.shadcn.com/)
- **Animation:** [Framer Motion](https://www.framer.com/motion/)

**Backend:**
- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** **[MySQL](https://www.mysql.com/)** (using the **[mysql2](https://github.com/sidorares/node-mysql2)** driver)
- **Authentication:** [JWT (JSON Web Token)](https://jwt.io/)

## ⚙️ Getting Started

Follow these instructions to get the project running locally.

### Prerequisites

You will need [Node.js](https://nodejs.org/en/) and a **MySQL server** running on your machine.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git)
    cd YOUR_REPO_NAME
    ```

2.  **Database Schema Setup:**
    Connect to your MySQL server and run the following SQL commands to create the database and the required tables.

    ```sql
    CREATE DATABASE your_database_name;
    USE your_database_name;

    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'USER'
    );

    CREATE TABLE tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      user_id INT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    ```

3.  **Install backend dependencies:**
    ```bash
    cd backend
    npm install
    ```

4.  **Install frontend dependencies:**
    ```bash
    # From the root directory
    npm install
    ```

5.  **Create environment files:**
    -   Inside the `backend` folder, create a new file named `.env` and add your configuration:
        ```env
        # Backend .env
        DB_HOST=localhost
        DB_USER=your_mysql_username
        DB_PASSWORD=your_mysql_password
        DB_NAME=your_database_name
        JWT_SECRET=a_very_strong_secret_key_for_jwt
        PORT=8000
        ```
    -   In the **root** project folder, create a new file named `.env.local` for the frontend:
        ```env
        # Frontend .env.local
        NEXT_PUBLIC_API_URL=http://localhost:8000
        ```

### Running the Application

You'll need two terminals open.

1.  **Start the Backend Server:**
    ```bash
    # In your first terminal, from the 'backend' directory
    npm run dev
    ```
    The backend server will run on `http://localhost:8000`.

2.  **Start the Frontend Server:**
    ```bash
    # In your second terminal, from the root project directory
    npm run dev
    ```
    Open `http://localhost:3000` in your browser to see the application.
