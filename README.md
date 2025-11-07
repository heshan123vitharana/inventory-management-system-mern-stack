# 🛒 Inventory Management System for Food Market

A comprehensive, full-stack inventory management platform crafted for food markets and retail environments. This system streamlines inventory tracking, transaction management, waste reduction, and performance analytics — all secured through modern web standards.

![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?logo=react\&style=flat)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js\&style=flat)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb\&style=flat)
![Tailwind CSS](https://img.shields.io/badge/Styling-TailwindCSS-38B2AC?logo=tailwindcss\&style=flat)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## 📌 Project Overview

This Inventory Management System is built to replace inefficient, manual processes in food retail. It enhances productivity, improves stock control, and offers real-time visibility for smarter business decisions.

### 🎯 Key Objectives

* Reduce stock loss due to expiry.
* Automate manual inventory tracking.
* Provide real-time dashboards for informed decision-making.
* Enable remote access for managing operations securely.

---

## ✨ Features

* **🔐 Role-Based Access Control**: Separate access levels for Admins and Managers.
* **📦 Real-Time Inventory Dashboard**: Live stock levels, transactions, and expiry alerts.
* **⚠️ Automated Alerts**: Notifications for low stock and expiring products.
* **🚛 Delivery Company Management**: Track delivery company records and contacts.
* **📈 Analytics & Reports**: Visual charts and reports for sales and stock forecasting.
* **📷 Barcode/QR Code Integration**: Simplifies adding/updating stock.
* **♻️ Waste Reduction**: Suggests discounts/promotions to avoid expired waste.
* **🔐 Security First**: JWT authentication with secure data storage.

---

## 🧱 Technology Stack

| Layer          | Technology              |
| -------------- | ----------------------- |
| Frontend       | React.js + Tailwind CSS |
| Backend        | Node.js (Express.js)    |
| Database       | MongoDB                 |
| Authentication | JWT                     |
| API            | RESTful API             |

---

## 🧠 System Architecture

```
React.js + Tailwind CSS
         ↓
     Node.js (Express)
         ↓
        MongoDB
```

### Key Design Principles

* **Separation of Concerns**: Frontend, backend, and DB operate independently.
* **Scalable API Structure**: Easily extendable endpoints.
* **Component-Based UI**: Reusable React components.
* **Modular Codebase**: Organized by features and responsibilities.

---

## 🚀 Getting Started

### 📦 Prerequisites

* Node.js (v14 or later)
* MongoDB (local or Atlas)
* Git
* IDE (e.g., VS Code)

### 🛠 Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/heshan123vitharana/inventory-management-food-market.git
cd inventory-management-food-market
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

* Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

* Start the server:

```bash
npm run dev
```

#### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm start
```

> React server runs at: [http://localhost:3000](http://localhost:3000)
> Backend server runs at: [http://localhost:5000](http://localhost:5000)

---

## 👥 Project Team

| Name                    | ID       |
| ----------------------- | -------- |
| W\.A.H. Witharana       | 22IT0550 |
| V.M. Muhni              | 22IT0512 |
| M.B.M. Mufaris          | 22IT0511 |
| R.M.D.S. Senevirathne   | 22IT0531 |
| R. Sutheshika           | 22IT0536 |
| P.M.K.R.N. Pannila      | 22IT0514 |
| P.K.A.D. Madhushan      | 22IT0501 |
| H.D.S. Amadi            | 22IT0454 |
| T.W\.G.D.K. Wawewaththa | 22IT0546 |
| A.M.D.C. Adhikari       | 22IT0452 |

---

## 🧪 Quality Assurance

* **✅ Unit Testing**: Individual function/component testing
* **🔗 Integration Testing**: API and DB communication
* **🖥️ System Testing**: End-to-end workflow coverage
* **👥 UAT**: Feedback-driven from real market users
* **🔁 Regression Testing**: Avoid bugs on new deployments
* **📈 Load Testing**: Ensures resilience under demand

---

## 📊 Performance Metrics

| Metric        | Target    |
| ------------- | --------- |
| Response Time | < 200ms   |
| Uptime        | 99.9%+    |
| Transactions  | 1000+/min |
| Error Rate    | < 1%      |

---

## 📱 Future Roadmap

* [ ] 📧 Email notifications for stock alerts
* [ ] 📱 React Native mobile app
* [ ] 🧾 Billing & Invoicing system
* [ ] 🌍 Internationalization (i18n)
* [ ] 📡 Real-time socket updates

---

## 🔐 License

This project is licensed under the [MIT License](./LICENSE).

---

## 💬 Feedback & Contributions

We welcome contributions and feedback from the community! If you encounter any issues or have suggestions:

* Open a GitHub issue
* Submit a pull request
* Contact the maintainers

---

> **Thank you for checking out our Inventory Management System for Food Market!** Empowering food retailers with intelligent inventory control.
