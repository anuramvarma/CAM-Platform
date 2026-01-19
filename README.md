# 🏦 CAM-Platform: College Attendance Management System

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**CAM-Platform** is a sophisticated, multi-tiered attendance management ecosystem designed to digitize and automate the attendance tracking process across an entire educational institution. It provides specialized portals for every level of the hierarchy—from students and class representatives to department heads and college administration.

---

## 🏗️ System Architecture

The platform is divided into three main operational portals, each serving a specific role:

### 1. 📱 [CR Portal (cr-attendance)](./cr-attendance)
**Target**: Class Representatives (CRs)
- **Purpose**: The "ground level" portal where daily attendance is marked.
- **Key Features**: Digital roll-call, session-wise marking, class setup wizard, and real-time student lists.
- **Stack**: React, Vite, Node/Express, MongoDB.

### 2. 🏛️ [HOD Portal (hod-portal)](./hod-portal)
**Target**: Head of Departments
- **Purpose**: Monitoring and administrative control over departmental attendance.
- **Key Features**: Statistics dashboard, class promotion (academic year updates), permission approvals, and student records management.
- **Stack**: React, Vite, Tailwind CSS.

### 3. 🌐 [Super Portal (super-portal)](./super-portal)
**Target**: College Management / Principal
- **Purpose**: High-level institutional analytics and cross-departmental oversight.
- **Key Features**: College-wide overview, live report generation (PDF), department-wise comparison, and deep-dive analytics for specific sections.
- **Stack**: Next.js/Vite, Framer Motion, jsPDF.

---

## 🚀 Vision

Moving away from traditional paper-based attendance, **CAM-Platform** ensures:
- **Zero Data Loss**: Cloud-synchronized records.
- **Instant Reporting**: No more manual tallying at the end of the month.
- **Transparency**: Real-time visibility for HODs and Management.
- **Scalability**: Designed to handle thousands of students across multiple years and branches.

---

## 🛠️ Quick Start

To run the entire platform locally, follow the instructions in each sub-directory's README:

1.  **Backend**: Start the shared backend in `cr-attendance/backend`.
2.  **CR Portal**: `cd cr-attendance && npm run dev`
3.  **HOD Portal**: `cd hod-portal && npm run dev`
4.  **Super Portal**: `cd super-portal && npm run dev`

---

## 📁 Repository Layout

```bash
CAM-Platform/
├── cr-attendance/     # CR Portal & Shared Backend
│   ├── backend/       # Express API (Supports all portals)
│   └── src/           # React Frontend
├── hod-portal/        # HOD Management Dashboard
└── super-portal/      # Institutional Overview Dashboard
```

---

## 🤝 Project Maintainer
**Anurag** - *Lead Developer & Architect*

---
<p align="center">Empowering Education through Digital Innovation</p>
