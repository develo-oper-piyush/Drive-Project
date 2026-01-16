# 🗂️ Drive Project

A modern cloud storage solution that allows users to securely store, manage, and access files from anywhere. Built with Express.js, MongoDB, and Supabase Storage.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## ✨ Features

-   🔐 **Secure Authentication** - JWT-based user authentication with encrypted passwords
-   📁 **File Upload & Storage** - Upload files securely to Supabase cloud storage
-   👁️ **File Preview** - View uploaded files directly in the browser
-   📥 **File Download** - Download your files anytime
-   ✏️ **Rename Files** - Easily rename your uploaded files
-   🗑️ **Delete Files** - Remove unwanted files from storage
-   🔍 **Filter & Search** - Filter files by type (Images, Videos, Audio, Documents, Others)
-   👤 **User Profile** - View account info and change password
-   📊 **Storage Limits** - 12 files per user, 5MB max per file
-   🎨 **Modern UI** - Beautiful dark theme with smooth animations
-   🔔 **Toast Notifications** - Real-time feedback for all actions
-   📱 **Responsive Design** - Works on all devices

---

## 🛠️ Tech Stack

### Backend

-   **Node.js** - Runtime environment
-   **Express.js** - Web framework
-   **MongoDB** - Database for user data
-   **Mongoose** - MongoDB ODM
-   **JWT** - Authentication tokens
-   **bcrypt** - Password hashing
-   **express-validator** - Input validation

### Frontend

-   **EJS** - Templating engine
-   **Tailwind CSS v4** - Styling
-   **Vanilla JavaScript** - Client-side interactions

### Cloud Storage

-   **Supabase Storage** - File storage solution

---

## 📦 Installation

### Prerequisites

-   Node.js (v16 or higher)
-   MongoDB database
-   Supabase account

### Steps

1. **Clone the repository**

    ```bash
    git clone https://github.com/develo-oper-piyush/Drive-Project.git
    cd Drive-Project
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Create environment file**

    Create a `.env` file in the root directory:

    ```env
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret_key
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_KEY=your_supabase_anon_key
    SUPABASE_BUCKET=your_bucket_name
    ```

4. **Run the application**

    ```bash
    node app.js
    ```

5. **Open in browser**
    ```
    http://localhost:3000
    ```

---

## 🔧 Set Environment Variables

---

## 📁 Project Structure

```
Drive/
├── config/
│   ├── db.js           # MongoDB connection
│   └── supabase.js     # Supabase client setup
├── models/
│   └── user.model.js   # User schema
├── routes/
│   ├── index.routes.js # Main routes (home, upload, delete, etc.)
│   └── user.routes.js  # Auth routes (login, register, profile)
├── views/
│   ├── home.ejs        # Dashboard
│   ├── index.ejs       # Landing page
│   ├── login.ejs       # Login page
│   ├── register.ejs    # Register page
│   ├── profile.ejs     # User profile
│   └── error.ejs       # Error page
├── public/             # Static assets
├── app.js              # Entry point
├── package.json
└── .env                # Environment variables (not in repo)
```

---

## 🚀 Deployment

This app can be deployed on **Render.com**:

1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables in Render dashboard
4. Deploy!

---

## 📸 Screenshots

### Landing Page

-   Animated welcome text with fluid cursor effect
-   Modern glassmorphism design

### Dashboard

-   File grid with hover effects
-   Upload, view, rename, and delete functionality
-   Real-time file count display

### Profile Page

-   View account information
-   Change password functionality

---

## 🔒 Security Features

-   Passwords hashed with bcrypt (10 salt rounds)
-   JWT tokens stored in HTTP-only cookies
-   Input validation on all forms
-   File type and size restrictions
-   User-specific file isolation

---

## 📝 API Routes

### Authentication

| Method | Route                   | Description       |
| ------ | ----------------------- | ----------------- |
| GET    | `/user/register`        | Registration page |
| POST   | `/user/register`        | Create new user   |
| GET    | `/user/login`           | Login page        |
| POST   | `/user/login`           | Authenticate user |
| GET    | `/user/logout`          | Logout user       |
| GET    | `/user/profile`         | Profile page      |
| POST   | `/user/change-password` | Update password   |

### File Operations

| Method | Route                 | Description          |
| ------ | --------------------- | -------------------- |
| GET    | `/home`               | Dashboard with files |
| POST   | `/upload`             | Upload a file        |
| GET    | `/download/:filename` | Download a file      |
| GET    | `/delete/:filename`   | Delete a file        |
| POST   | `/rename/:filename`   | Rename a file        |

---

## 🤝 Contributing

Contributions are welcome! Feel free to submit a Pull Request.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Piyush Chaudhary**

-   GitHub: [@develo-oper-piyush](https://github.com/develo-oper-piyush)

---

⭐ **Star this repo if you found it helpful!**