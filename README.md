**Convo websocket messaging application**

<img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/06a05dad-ffab-41e3-bb06-fd2077b4a4c5" />

**A modern, real-time messaging platform built for seamless communication**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-%5E18.0.0-61dafb)](https://reactjs.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-orange)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

[Features](#-features) • [Installation](#%EF%B8%8F-installation--setup) • [Tech Stack](#-tech-stack) • [Documentation](#-api-documentation) • [License](#-license)

---

## 📖 Overview

Convo Chat is a feature-rich, cross-platform real-time messaging application built with a modern full-stack architecture. It delivers a seamless messaging experience with a focus on speed, responsiveness, and user-friendly design. Powered by WebSocket for instant communication, Convo combines robust back-end logic with a polished, professional UI.

### ✨ Why Convo Chat?

- **⚡ Lightning Fast**: Sub-50ms message delivery with WebSocket protocol
- **🔒 Secure by Design**: 2FA authentication and encrypted sessions
- **🎨 Beautiful UI**: Smooth animations and modern design with theme support
- **📱 Cross-Platform**: Web, Desktop (Electron), and mobile-ready architecture
- **🚀 Production Ready**: Built with enterprise-grade technologies

---

## 🎯 Features

### 💬 Messaging
- **Real-time chat** with instant message delivery
- **Message states**: Track sent, delivered, and seen status
- **Reply system**: Context-aware message threading in real-time
- **Rich media**: Share images and resources seamlessly
- **Typing indicators**: See when friends are composing messages

### 👥 Social Features
- **Friend management**: Search, add, and manage connections
- **Online/Offline status**: Real-time presence tracking
- **Last seen updates**: Accurate activity timestamps
- **Unread badges**: Live counter updates for missed messages
- **Auto-refresh**: Keep your friend list always up-to-date

### 🔐 Security & Sessions
- **Two-Factor Authentication (2FA)**: Enhanced account security
- **Session management**: Track and manage active devices
- **Device information**: Monitor login locations and platforms
- **Secure WebSocket**: Encrypted real-time communication

### 🎨 User Experience
- **Light & Dark themes**: Comfortable viewing in any environment
- **Smooth animations**: Professional UI powered by Framer Motion
- **Responsive design**: Optimized for desktop, tablet, and mobile
- **Intuitive interface**: Clean, modern, and easy to navigate

---

## 🛠️ Tech Stack

### Frontend
```
React          → Component-based UI architecture
Electron       → Cross-platform desktop application
Tailwind CSS   → Utility-first styling framework
DaisyUI        → Beautiful, accessible UI components
Framer Motion  → Fluid animations and transitions
```

### Backend
```
Node.js        → JavaScript runtime environment
Express.js     → Fast, minimalist web framework
MySQL          → Relational database management
WebSocket      → Real-time bidirectional communication
```

### Design & Prototyping
```
Figma          → UI/UX design and collaboration
Adobe XD       → Interactive prototypes
Photoshop      → Image editing and assets
Illustrator    → Vector graphics and icons
```

---

## 📂 Project Structure

```
real-time-chat-application/

├── 📁 build/                      # Production build output
│   └── [compiled files]
│
├── 📁 node_modules/               # Root dependencies
│
├── 📁 public/                     # Static public assets
│   ├── index.html                 # HTML entry point
│   ├── favicon.ico                # Application icon
│   └── manifest.json              # PWA manifest
│
├── 📁 Server/                     # Backend Node.js application
│   │
│   ├── 📁 date-format/            # Date formatting utilities
│   │
│   ├── 📁 node_modules/           # Server dependencies
|   |
|   ├── 📁 routes/                 # Server Side API Endpoints (api/v1....)     
|   |
│   ├── 📁 templates/              # Email/notification templates
│   │
│   ├── 📁 uploads/                # User uploaded files
│   │
│   ├── 📁 util/                   # middlewares
│   │
│   ├── 📁 validation/             # Input validation schemas
│   │
│   ├── 📄 .env                    # Environment variables (private)
│   ├── 📄 .gitignore              # Server-specific git ignore
│   ├── 📄 connection.js           # Database connection config
│   ├── 📄 server.js               # Server entry point
│   ├── 📄 ws.js                   # Websocket     
│   ├── 📄 package-lock.json       # Dependency lock file
│   └── 📄 package.json            # Server dependencies
│
├── 📁 src/                        # Frontend React application
│   │
│   ├── 📁 components/             # Reusable UI components
│   │   ├── ResourcePreview.jsx
│   │   ├── Friend.jsx
│   │   ├── FriendProfilePreview.jsx
│   │   ├── Message.jsx
│   │   ├── UserDetails.jsx
│   │
│   ├── 📁 constant/               # Application constants
│   │
│   ├── 📁 context/                # React Context providers
│   │
│   ├── 📁 fonts/                  # Custom font files
│   │
│   ├── 📁 methods/                # Utility functions & helpers
│   │
│   ├── 📁 resource/               # Static resources
│   │
│   ├── 📁 screen/                 # Page-level components (Routes)
│   │   ├── ChatScreen.jsx
│   │   ├── RegisterScreen.jsx
│   │   ├── EmailVerificationScreen.jsx
│   │   ├── LoginScreen.jsx
│   │   ├── ProfileScreen.jsx
│   │   ├── DeviceInformationScreen.jsx
|   |   ├── TwoFactorScreen.jsx
|   |   └── SplashScreen.jsx
│   │
│   ├── 📄 App.css                 # Main application styles
│   ├── 📄 App.jsx                 # Root React component
│   └── 📄 index.js                # React DOM entry point
│
├── 📄 .gitignore                  # Git ignore rules
├── 📄 main.js                     # Electron main process
├── 📄 package-lock.json           # Root dependency lock
├── 📄 package.json                # Root package configuration
├── 📄 tailwind.config.js          # Tailwind CSS configuration
└── 📄 README.md                   # Project documentation
```


## ⚙️ Installation & Setup

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- **Git** - [Download](https://git-scm.com/)

### Step-by-Step Installation

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/DilshanX09/convo-websocket-messenger-application-v1
cd convo-websocket-messenger-application-v1
```

#### 2️⃣ Install Dependencies
```bash
npm install
```
This will install all required packages for both frontend and backend.

#### 3️⃣ Database Setup

Create a MySQL database:
```sql
CREATE DATABASE chat_app;
```

Import the database schema:
```bash
mysql -u root -p chat_app < database/schema.sql
```

#### 4️⃣ Configure Environment Variables

Navigate to the `server` directory and create a `.env` file:

```bash
cd server
touch .env
```

Add the following configuration to `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=chat_app

# Server Configuration
PORT=5000

# Session Configuration
SESSION_SECRET=your_random_secret_key_here

# Email Configuration (for 2FA and notifications)
EMAIL=your_email@gmail.com
