# Full-Stack To-Do List Application 📝

A modern and responsive task management application built with Next.js, TypeScript, and a Node.js/Express backend. This project allows users to securely register, log in, and manage their daily tasks through a clean and intuitive interface designed with Shadcn/UI.

## ✨ Features

- **User Authentication:** Secure user registration and login using JSON Web Tokens (JWT).
- **Task Management:** Full CRUD (Create, Read, Update, Delete) functionality for tasks.
- **Responsive Design:** A clean, component-based UI that works seamlessly on desktop and mobile devices.
- **Protected Routes:** Backend middleware ensures that users can only access and modify their own tasks.

## 🚀 Tech Stack

**Frontend:**
- **Framework:** [Next.js](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Shadcn/UI](https://ui.shadcn.com/)

**Backend:**
- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication:** [JWT (JSON Web Token)](https://jwt.io/)

## 📸 Screenshot

*It's a great idea to add a screenshot or a GIF of your application here! It helps people quickly see what you've built.*

![App Screenshot](link-to-your-screenshot.png)


## ⚙️ Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

You will need [Node.js](https://nodejs.org/en/) installed on your machine. You will also need a MongoDB connection string (you can get a free one from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git)
    cd YOUR_REPO_NAME
    ```

2.  **Install backend dependencies:**
    ```bash
    cd backend
    npm install
    ```

3.  **Install frontend dependencies:**
    ```bash
    # From the root directory
    npm install
    ```

4.  **Create the environment file for the backend:**
    Inside the `backend` folder, create a new file named `.env` and add the following variables.
    ```env
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=a_very_strong_secret_key_for_jwt
    PORT=8000
    ```

### Running the Application

You'll need two terminals open to run both the frontend and backend servers.

1.  **Start the Backend Server:**
    ```bash
    # In your first terminal, from the 'backend' directory
    npm run dev
    ```
    The backend server should now be running on http://localhost:8000.

2.  **Start the Frontend Server:**
    ```bash
    # In your second terminal, from the root project directory
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.
