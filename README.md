# 🚛 TransitOps - Smart Transport Operations Platform

TransitOps is a comprehensive, modern, and highly interactive transport operations platform built to digitize vehicle, driver, dispatch, maintenance, and expense management while enforcing business rules and providing operational insights. It serves Fleet Managers, Drivers, Safety Officers, and Financial Analysts with robust Role-Based Access Control (RBAC), intelligent safety metrics, and a beautiful, fully animated user interface.

## ✨ Key Features

*   **🛡️ Role-Based Access Control (RBAC):** Tailored views and permissions for different roles:
    *   **Fleet Manager (Manager):** Full oversight of fleet assets, maintenance, vehicle lifecycle, and operational efficiency.
    *   **Driver:** Creates trips, assigns vehicles and drivers, monitors active deliveries, and manages maintenance logs.
    *   **Safety Officer:** Dedicated `Safety & Compliance Center` dashboard, ensures driver compliance, tracks license validity, and monitors safety scores.
    *   **Financial Analyst:** Reviews operational expenses, fuel consumption, maintenance costs, and profitability. Supports PDF report generation.
*   **🎨 Premium UI / UX:** Built with a stunning "Glassmorphism" aesthetic, featuring frosted-glass panels, smooth gradients, and micro-interactions powered by Framer Motion.
*   **📊 Safety & Compliance Center:** A specialized dashboard that maps out the entire fleet's safety standing, instantly flagging high-risk drivers (Score < 70) and licenses expiring within 30 days.
*   **🌟 Interactive Safety Ratings:** Safety Officers can interactively adjust a driver's safety score post-trip using a custom-built, animated slider modal.
*   **🚚 Intelligent Trip Dispatching:** Real-time business logic blocks trips if a driver's license category doesn't match the vehicle class, or if the cargo exceeds the vehicle's maximum capacity.
*   **💸 Financial Tracking:** Full expense logging and maintenance cost tracking, entirely standardized in Indian Rupees (₹).
*   **📈 Advanced Analytics:** Visualized cost distributions and revenue tracking utilizing Recharts.
*   **🔢 Animated UI Components:** Features like an animated running Odometer, dynamic license plates, and animated avatar badges.

---

## 🛠️ Technology Stack

### Frontend (Client)
*   **Core:** React 19 (via Vite)
*   **Styling:** Tailwind CSS v4 & custom generic CSS for Glassmorphism
*   **Animations:** Framer Motion & Canvas Confetti
*   **Icons:** Lucide React
*   **Visualizations:** Recharts
*   **Routing:** React Router DOM (v7)
*   **HTTP Client:** Axios
*   **Toast Notifications:** Sonner
*   **PDF Generation:** jsPDF & React-to-Print

### Backend (API)
*   **Environment:** Node.js
*   **Framework:** Express.js (v5)
*   **Database:** MongoDB via Mongoose
*   **Authentication:** JWT (JSON Web Tokens) & BcryptJS
*   **Email Services:** Nodemailer
*   **CORS:** Cross-Origin Resource Sharing enabled

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+ recommended)
*   MongoDB (cloud or local instance)

### Installation

1.  **Clone the Repository (if applicable)**
2.  **Install Backend Dependencies:**
    ```bash
    cd backend
    npm install
    ```
3.  **Install Frontend Dependencies:**
    ```bash
    cd frontend
    npm install
    ```
4.  **Environment Variables:**
    *   Create a `.env` file in the `backend/` directory:
        ```env
        PORT=5000
        MONGO_URI=your_mongodb_connection_string
        JWT_SECRET=your_jwt_secret_key
        ```
    *   Create a `.env` file in the `frontend/` directory:
        ```env
        VITE_API_URL=http://localhost:5000/api
        ```

### Running the Application Locally

1.  **Start the Backend Server:**
    ```bash
    cd backend
    npm run dev
    ```
    *The server will run on `http://localhost:5000`*

2.  **Start the Frontend Client:**
    ```bash
    cd frontend
    npm run dev
    ```
    *The React application will be available at `http://localhost:5173`*

---

## 🔒 Security

*   Passwords are securely hashed using `bcryptjs` before being stored in the database.
*   API endpoints are protected using a custom `authMiddleware` that verifies JWT tokens.
*   Routes are strictly locked down on both the Frontend (`ProtectedRoute` wrappers) and Backend (`authorize` middleware) to ensure users only execute actions permitted by their role.

---

## 💡 Usage

Upon launching the application, you can log in / sign up using varying roles to experience the different dashboards. For example, registering as a **Safety Officer** instantly overrides the standard fleet dashboard with the dedicated Safety Center.

---

## 👥 Team Collaboration (Git Workflow)

To ensure clear, individual contribution metrics for evaluation, please follow this team collaboration model:

### 1. Local Configuration
Before committing, each teammate must configure their GitHub identity on their local machine:
```bash
git config --global user.name "Your Full Name"
git config --global user.email "your_email@example.com"
```

### 2. Feature-Branch Model
*   Never push or commit directly to the `main` branch.
*   Always branch out from up-to-date `main` to work on your module:
    ```bash
    git checkout main
    git pull origin main
    git checkout -b feature/your-module-name
    ```
*   Commit and push your feature branch:
    ```bash
    git add .
    git commit -m "feat: implement vehicles registry CRUD"
    git push origin feature/your-module-name
    ```
*   Open a **Pull Request (PR)** on GitHub, request a review from a teammate, and merge it into `main` after verification.

---

*Designed with ❤️ for smart transport operations.*
