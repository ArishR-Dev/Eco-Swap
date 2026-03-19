<p align="center">
  <img src="./frontend/public/LOGO.png" alt="EcoSwap Logo" width="100">
</p>

# ♻️ EcoSwap (E-Waste Management Platform)
> Your ultimate full-stack digital e-waste companion.

EcoSwap is an end-to-end waste management platform connecting users, collectors, and recyclers. Built with a React frontend and Flask backend, it streamlines pickup scheduling, live route tracking, and secure certificate generation. Through robust role-based access, administrators can efficiently manage community recycling and sustainability goals.

## 📸 Platform Previews

| User Dashboard (Tracking) | Admin Control Center |
|:---:|:---:|
| <img src="SCREENSHOT/USER/TRACK/user%20dashboard%20-%20pickup%20details%20-%20track%20collected.png" alt="User Tracking" width="400"/> | <img src="SCREENSHOT/ADMIN/admin%20dashboard.png" alt="Admin Dashboard" width="400"/> |
| **Collector Dashboard (Routing)** | **Recycler Dashboard** |
| <img src="SCREENSHOT/COLLECTOR/collector%20dashboard%20-%20google%20maps%20directions.png" alt="Collector Dashboard" width="400"/> | <img src="SCREENSHOT/RECYCLER/recycler%20dashboard.png" alt="Recycler Dashboard" width="400"/> |
| **User Sign In** | **Pickup Management (Admin)** |
| <img src="SCREENSHOT/ACCOUNTS/SIGNIN/signin%20-%20citizen.png" alt="User Sign In" width="400"/> | <img src="SCREENSHOT/ADMIN/admin%20dashboard%20-%20pickup%20management.png" alt="Admin Pickup Management" width="400"/> |
| **Recycling Certificates** | **Collector Tasks** |
| <img src="SCREENSHOT/RECYCLER/recycler%20dashboard%20-%20recycling%20certificates.png" alt="Recycling Certificates" width="400"/> | <img src="SCREENSHOT/COLLECTOR/collector%20dashboard%20-%20my%20tasks.png" alt="Collector Tasks" width="400"/> |

### 🎥 Role Morphing Demo
<video src="SCREENSHOT/ACCOUNTS/ROLE%20MORPHING.mp4" controls="controls" width="100%">
  Your browser does not support the video tag.
</video>

*[Watch Role Morphing Video](./SCREENSHOT/ACCOUNTS/ROLE%20MORPHING.mp4)*

## ✨ Core Features

- **Smart Role-based Access Control**: Native JWT-secured dashboards tailored specifically for Admin, User (Citizen), Collector, and Recycler roles.
- **Complete Pickup Lifecycle**: Seamlessly manage the entire e-waste workflow: request → assign → en route → collected → handover → processing → recycled.
- **Live Location & Routing**: Integrated map features for Collectors to navigate to pickup spots seamlessly using Google Maps integrations.
- **Interactive Data Visualization**: Dynamic reports and analytics for operational visibility.
- **Secure Certificate Generation**: Automated PDF generation and download for verifyable recycling certificates once e-waste is processed.
- **Real-time Notifications**: Automated alerts for status changes, new assignments, and account approvals.
- **Secure Password Recovery**: Automated forgotten password workflows featuring one-time secure tokens and SMTP email delivery.
- **Admin Control Console**: A protected internal dashboard to monitor system health, pending approvals, manage users, and perform full pickup management.

## 🛠 Tech Stack

**Frontend Architecture (Vite + React)**
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui & Radix UI primitives
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **Maps**: Google Maps Integration

**Backend Architecture (Python + Flask)**
- **Framework**: Flask
- **Database ORM**: SQLAlchemy & Flask-Migrate
- **Database Engine**: MySQL (via `mysql-connector-python`)
- **Authentication**: JWT Auth (`Flask-JWT-Extended`)
- **Mailing**: SMTP Email Integration

## 🚀 Getting Started

To run EcoSwap locally, ensure you have Node.js and Python 3.10+ and MySQL installed on your machine.

### 1. Clone the repository
```bash
git clone https://github.com/ArishR-Dev/Eco-Swap.git
cd Eco-Swap
```

### 2. Install dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
python -m venv venv
# Activate the virtual environment (Windows: venv\Scripts\activate, Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
```

### 3. Setup the Database
EcoSwap requires a MySQL database. Create a database in your local MySQL instance. Use the provided SQL initialization files to set up the tables:

```bash
# Example setup via MySQL CLI
mysql -u root -p < sqlsa.sql
```

### 4. Configure Environment Variables
Create a `.env` file in both backend and frontend directories using their respective example files:

**Backend (`backend/.env`)**: Configure your database credentials, JWT secret, and SMTP configuration for emails.
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=ecoswapdb
SECRET_KEY=yoursecret
JWT_SECRET_KEY=yourjwtsecret
FRONTEND_URL=http://localhost:5173

# Optional SMTP (for emails/password reset):
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=ecoswap.notifications@gmail.com
MAIL_PASSWORD=<Gmail App Password (16 chars)>
MAIL_USE_TLS=True
MAIL_DEFAULT_SENDER=EcoSwap <ecoswap.notifications@gmail.com>
```
> **Important**: For Gmail, you must use an App Password (not your normal Gmail password).

**Frontend (`frontend/.env`)**:
```env
VITE_API_URL=http://127.0.0.1:5000
```

### 5. Start the Application

```bash
# Start the Flask API (http://127.0.0.1:5000)
cd backend
flask run

# Start the Vite Frontend (http://localhost:5173)
cd ../frontend
npm run dev
```

## ⚡ Windows Quick Start
If you are on Windows, simply double-click the `start_ecoswap.cmd` file in the root directory. It will spin up the frontend and backend servers together automatically!

## 🛡️ Internal Admin Console
The administration dashboard is restricted to users with the Admin role. It allows full CRUD management over the platform's data, verifying Collectors, and Re-assigning pickups.

**Access Instructions**:
1. You can generate a default Admin account easily using the backend CLI. From the `backend/` directory, run:
```bash
flask create-admin
```
This will automatically create (or reset) an admin with:
- **Email**: `admin@ecoswap.com`
- **Password**: `admin123`

2. Log in with these credentials to access the Admin routing options, approval grids, and analytics.

---