# Apex Car Rental Management System

This is a complete full-stack application for managing car rentals, featuring a secure **Angular (Standalone)** frontend portal and a **Node.js (Express/MongoDB)** REST API backend. The system supports two distinct user roles: **Admin** and **User (Customer)**, with granular Role-Based Access Control (RBAC) applied to all features.

## 🚀 Key Features

The project is built around robust and modernized features:

### Frontend (Angular)

  * **Role-Based Access Control (RBAC):** Navigation elements and actionable buttons (CRUD operations) are dynamically displayed based on the logged-in user's role (Admin vs. User).
  * **User Registration:** A public registration page allows new users to create an account, which automatically creates and links a corresponding Customer profile with all necessary details (mobile number, city).
  * **Profile Management (Feature \#4):** Logged-in users can access a dedicated profile page to view and securely update their personal details (name, email, mobile, city) and change their password.
  * **Booking Workflow:**
      * **Multi-Day Rentals (Feature \#2):** The booking form uses `startDate` and `endDate`, with the total bill automatically calculated for standard users based on the selected car's `dailyRate` and the number of rental days.
      * **Self-Service Booking:** Standard users can only book for themselves, while the Admin has full control over all fields.
  * **Data Management:** Dedicated pages for managing Vehicles, Customers, and Bookings are available exclusively to the **Admin**.

### Backend (Node.js/Express/MongoDB)

  * **Secure Authentication:** Uses **JWT** for token-based authentication and **bcryptjs** for secure password hashing.
  * **User & Customer Synchronization:** New user registration and profile updates automatically maintain data consistency by synchronizing changes across the linked `User` and `Customer` documents in the database.
  * **Robust Booking Logic:**
      * **Availability Check (Feature \#3):** Implements a server-side logic to check for date-range overlap to prevent multiple bookings of the same vehicle for conflicting time periods.
      * **Role-Specific Endpoints:** Separate endpoints (`/CreateUserBooking` vs. `/CreateNewBooking`) enforce business rules for users (calculated bill/zero discount) and grant full control to admins.
  * **Dashboard API (Feature \#1):** A dedicated, Admin-protected route (`/GetDashboardData`) provides consolidated statistics on revenue, total bookings, and customers.

-----

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **Angular** (Standalone Components) | Modern framework using Signals for efficient state management. |
| **Styling** | **Tailwind CSS** | Utility-first CSS framework for a responsive UI. |
| **Backend** | **Node.js / Express** | Fast, unopinionated backend API framework. |
| **Database** | **MongoDB / Mongoose** | NoSQL database with an Object Data Modeling (ODM) layer for schema validation. |
| **Authentication** | **JWT / bcryptjs** | Secure session management and password hashing. |

-----

## ⚙️ Setup and Installation

This project requires **two separate processes** running concurrently: the backend API and the Angular frontend.

### 1\. Backend Setup (`Working - Under Progress/car-rental-backend`)

1.  **Navigate to the Backend Directory:**

    ```bash
    cd Working - Under Progress/car-rental-backend
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

    *Key dependencies include:* `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, and `dotenv`.

3.  **Configure Environment:**
    Create a file named **`.env`** in the root of the backend directory with the following content (replace placeholders with your actual values):

    ```
    MONGO_URI=mongodb://localhost:27017/CarRentalDB
    JWT_SECRET=superSecretKeyForCarRentalApp
    ```

    > **Note:** The default `MONGO_URI` is set to a local instance.

4.  **Start the Server:**

    ```bash
    npm run dev
    # OR (if nodemon is not installed globally):
    # node server.js
    ```

    The server should start on `http://localhost:5000`.

### 2\. Frontend Setup (`Working - Under Progress/Car_Rental_App`)

1.  **Navigate to the Frontend Directory:**

    ```bash
    cd ../Car_Rental_App
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

    *The project is based on Angular CLI version 20.3.7*.

3.  **Start the Angular Dev Server (with Proxy):**
    The project is configured with a `proxy.conf.json` to forward all API requests from `/api` to the backend running at `http://localhost:5000`.

    ```bash
    npm start
    # This runs: ng serve --proxy-config proxy.conf.json
    ```

4.  **Access the Application:**
    Open your browser and navigate to:
    **`http://localhost:4200/#/login`**

-----

## 🔑 Authentication and Testing

There are no default credentials. All user accounts must be created through the public registration page.

### Getting Started

1.  Navigate to **`http://localhost:4200/#/register-customer`**.
2.  **Create an Admin Account:** Fill out the form, ensure you provide a valid mobile number and city, and select the **`Admin`** role.
3.  **Create a User Account:** Create at least one additional account, selecting the **`User`** role.
4.  **Login:** Use the credentials for your **Admin** account to access the full portal.

### Role Differentiators

| Feature | Admin Role | User Role |
| :--- | :--- | :--- |
| **Dashboard** | Full statistics (Revenue, Bookings, Customers) | Only My Total Bookings. |
| **Vehicle Mgmt (`/vehicles`)** | Full CRUD access (Create, Edit, Delete). | Read-only view of available cars. |
| **Customer Mgmt (`/customers`)** | Full CRUD access. | Redirected away (access denied). |
| **Booking Creation** | Full control (any customer, custom bill, discount). | Self-booking only, calculated rate, zero discount enforced. |
| **Bookings List** | Sees all bookings in the system. | Only sees their personal bookings. |

-----

## 📦 Project Structure Overview

The repository is organized into distinct directories for the front and back ends:

  * **`Working - Under Progress/Car_Rental_App/`** (Angular Frontend)
      * `src/app/services/car-rental.service.ts`: Central API service layer with role-based logic and data handling.
      * `src/app/interceptors/auth.interceptor.ts`: Attaches the JWT token to all API requests.
      * `src/app/pages/profile/`: New feature for user profile viewing and updating.
      * `src/app/pages/customer-register/`: Public page for creating new user/customer accounts.
  * **`Working - Under Progress/car-rental-backend/`** (Node.js Backend)
      * `server.js`: Main Express server and MongoDB connection setup.
      * `middleware/auth.js`: JWT validation and token decoding (extracts user role).
      * `routes/carRentalRoutes.js`: Central API routes, where `checkAdmin` middleware secures management endpoints.
      * `controllers/bookingController.js`: Contains `checkDateOverlap` and `calculateDuration` for robust booking logic.
      * `models/`: Mongoose schemas for `User`, `Customer`, `Car`, and `Booking`.
