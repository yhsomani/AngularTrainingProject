Apex Car Rental Management System

This is a full-stack application for managing car rentals, featuring a secure Angular frontend portal and a Node.js (Express/MongoDB) REST API backend.

The system supports two user roles:

Admin: Full access to dashboard, vehicle management, customer management, and booking control.

User (Customer): Restricted access to view vehicles, view their personal bookings, update their profile, and create new bookings.

🚀 Key Features

Frontend (Angular)

Role-Based Access Control (RBAC): Navigation and features are dynamically hidden or disabled based on the user's admin or user role.

User Registration: New users can create an account, which automatically creates a corresponding Customer profile with required details (mobile, city).

Profile Management: Logged-in users can view and update their personal details (name, email, mobile, city) and change their password (Feature #4).

Booking Workflow: Standard users can create multi-day bookings with automatically calculated rates (Feature #2) and check real-time availability (Feature #3).

Data Management: Dedicated pages for managing Vehicles, Customers, and Bookings (Admin only).

Backend (Node.js/Express/MongoDB)

JWT Authentication: Secure login, registration, and role-based middleware for all API routes.

User & Customer Synchronization: New user registration automatically creates a linked customer profile using the same MongoDB _id for seamless data retrieval (Feature #4).

Robust Booking Logic:

Supports multi-day rentals (startDate/endDate).

Automatically calculates duration and total bill for user-initiated bookings (Feature #2).

Implements a date-range overlap check to prevent double-booking of a vehicle (Feature #3).

Admin Endpoints: Routes for fetching consolidated dashboard data (Feature #1) and performing CRUD operations on Vehicles, Customers, and all Bookings.

🛠️ Technology Stack

Component

Technology

Description

Frontend

Angular (Standalone)

Modern application framework, uses Signals for state management.

Styling

Tailwind CSS

Utility-first CSS framework for a responsive, modern UI.

Backend

Node.js / Express

Fast, unopinionated backend API framework.

Database

MongoDB / Mongoose

Flexible NoSQL database with an ODM for schema validation.

Authentication

JSON Web Tokens (JWT) / bcryptjs

Secure session management and password hashing.

⚙️ Setup and Installation

This application requires two separate processes to run concurrently: the backend API and the Angular frontend.

1. Backend Setup

Navigate to the Working - Under Progress/car-rental-backend directory.

Install Dependencies:

npm install


Configure Environment:
Create a .env file in the root of the backend directory with your MongoDB connection string and a JWT secret.

.env

MONGO_URI=mongodb://localhost:27017/CarRentalDB # Use your actual Mongo URI
JWT_SECRET=superSecretKeyForCarRentalApp


Start the Server:

# You need `nodemon` installed globally (`npm install -g nodemon`)
npm run dev
# OR:
node server.js


The server should start on http://localhost:5000.

2. Frontend Setup (Angular)

Navigate to the Working - Under Progress/Car_Rental_App directory.

Install Dependencies:

npm install


Start the Angular Dev Server:
The project is configured to use a proxy (proxy.conf.json) to forward API requests from /api to the backend running on http://localhost:5000.

npm start
# This runs: ng serve --proxy-config proxy.conf.json


Access the Application:
Open your browser and navigate to http://localhost:4200/#/login.

🔑 Authentication and Testing

Default Credentials

Since all user accounts must be created through the registration page, there are no default login credentials.

Getting Started

Navigate to http://localhost:4200/#/register-customer.

Create an Admin Account: Fill out the form and select the Admin role. Use a clear test email (e.g., admin@test.com).

Create a User Account: Fill out the form again and select the User role. Use a different email (e.g., user@test.com).

Login: Use the credentials for your Admin account at http://localhost:4200/#/login to access the full Dashboard and Management features.

Role Differentiators

Feature

Admin Role

User Role

Dashboard Access

Full statistics (Revenue, Bookings, Customers).

Only My Total Bookings.

Vehicle Management

Full CRUD access on /vehicles page.

Read-only view on /vehicles page.

Customer Management

Full CRUD access on /customers page.

Redirected away (access denied).

Booking Creation

Full control (select any customer, custom bill amount).

Self-booking only, mandatory rate calculation.

Bookings List

Sees all bookings in the system.

Only sees their own bookings.

Profile (New)

View/Update all fields (name, email, mobile, city, password).

View/Update all fields (name, email, mobile, city, password).

📦 Project Structure Overview

The repository is divided into two main folders for the Angular frontend and the Node.js backend:

Working - Under Progress/Car_Rental_App/ (Frontend)

Path

Description

src/app/app.routes.ts

Defines all application routes, including new ones for registration and profile.

src/app/interceptors/auth.interceptor.ts

Attaches the JWT token to all API requests.

src/app/services/car-rental.service.ts

Centralized logic for all API calls, including role checks and data handling.

src/app/pages/booking/*

(Updated) Handles multi-day booking calculation and logic for both Admin/User flows.

src/app/pages/customer-register/*

(New) Component for public user registration.

src/app/pages/profile/*

(New) Component for users to manage their account details and password.

src/app/pages/vehicle/*

(Updated) Role guards added to restrict CRUD actions to Admins.

Working - Under Progress/car-rental-backend/ (Backend)

Path

Description

server.js

Main Express server setup and MongoDB connection.

middleware/auth.js

JWT validation middleware, extracts user ID and role from the token.

routes/carRentalRoutes.js

(Updated) Implements checkAdmin middleware to secure management routes (Vehicles, Customers, All Bookings, Dashboard).

controllers/authController.js

(Updated) Handles User registration and Customer profile creation synchronously. Includes new updateUser logic for profile changes.

controllers/bookingController.js

(Updated) Implements createUserBooking for user flow (auto-calculated bill/no discount) and booking overlap check (Feature #3).

models/User.js & models/Customer.js

Define Mongoose schemas; Customer schema is linked to User schema via matching _ids.
