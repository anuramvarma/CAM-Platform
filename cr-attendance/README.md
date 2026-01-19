# 🎓 CR-Attendance: Smart Attendance Management System

[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

> A premium, high-performance attendance management portal designed specifically for Class Representatives (CRs) to streamline classroom operations within the **CAM-Platform** ecosystem.

---

## ✨ Overview

**CR-Attendance** is a modern, full-stack web application that empowers Class Representatives to track student attendance digitally, eliminating paper-based logs and manual errors. Built with a focus on speed, user experience, and real-time data synchronization, it provides a seamless bridge between the classroom and department administration.

### 🚀 Key Features

- 📱 **Digital Attendance Marking**: Fast and intuitive interface to mark attendance by session and subject.
- 🕒 **Real-time History**: View and manage attendance records with instant feedback on absentee counts.
- 📋 **Student Management**: Comprehensive student lists with search and filter capabilities.
- 📚 **Subject Tracking**: Dynamic subject management tailored to the class schedule.
- 🛡️ **Permission System**: Integrated workflow for student leaves and late-entry permissions, synced with the HOD portal.
- 🧙 **Setup Wizard**: Effortless onboarding with support for:
    - **Multiple Degrees**: B.Tech and M.Tech support.
    - **Department Specifics**: 9+ departments including CSE, IT, AI&ML, ECE, etc.
    - **Smart Roll Generation**: Range-based generation for Regular and **Lateral Entry** students.
    - **Class Configuration**: Setup for specific years (1st-4th) and sections (A-D).
- 🌓 **Dynamic Themes**: Beautiful, glassmorphic UI with full support for Dark and Light modes.
- 📊 **Quick Analytics**: Instant dashboard stats showing daily trends and student strength.
- ✅ **Approval Workflow**: Secure access through an automated approval process.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 (TypeScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Routing**: React Router DOM

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ORM)
- **Auth**: JWT (JSON Web Tokens) & BcryptJS
- **Task Scheduling**: Node-cron (for automated analytics)

---

## 📂 Project Structure

```bash
cr-attendance/
├── src/                # Frontend Source
│   ├── components/     # Reusable UI Architecture
│   ├── context/        # Global State (Auth, Theme, App)
│   ├── pages/          # View-level Components
│   ├── services/       # API Communications
│   └── types/          # TypeScript Definitions
├── backend/            # Backend Source
│   ├── controllers/    # Request Handling Logic
│   ├── models/         # Mongoose Schemas
│   ├── routes/         # API Endpoints
│   └── server.js       # Entry Point
├── public/             # Static Assets
└── package.json        # Dependencies & Scripts
```

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)
- npm or yarn

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/CAM-Platform.git
   cd CAM-Platform/cr-attendance
   ```

2. **Frontend Setup**
   ```bash
   npm install
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create a .env file with the variables listed below
   npm start
   ```
---

## 🗺️ CAM-Platform Ecosystem

This portal is part of the **CAM (College Attendance Management)** Platform, which includes:
1. **CR Portal**: For ground-level attendance marking.
2. **HOD Portal**: For department-wide analytics and class management.
3. **Super Portal**: For college-wide administration and configuration.

---

## 📄 License

Distributed under the ISC License. See `LICENSE` for more information.

---
<p align="center">Made for modern education by Anuram Varma</p>
