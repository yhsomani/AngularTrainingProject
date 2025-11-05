# 🗺️ Apex Car Rental - System Flow Diagrams

## Quick Reference Visual Guide

---

## 1. User Registration & Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW                             │
└─────────────────────────────────────────────────────────────────┘

User fills registration form
         ↓
    POST /api/auth/register
         ↓
┌────────────────────────┐
│  authController.js     │
│  - Hash password       │
│  - Create User doc     │
│  - Create Customer doc │ ← Uses User._id as Customer._id
│    (same _id)          │
└────────────────────────┘
         ↓
    Success → Redirect to /login


┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                │
└─────────────────────────────────────────────────────────────────┘

User enters credentials
         ↓
    POST /api/auth/login
         ↓
┌────────────────────────┐
│  authController.js     │
│  - Verify password     │
│  - Generate JWT        │
│  - Return token + data │
└────────────────────────┘
         ↓
    Store in localStorage:
    - authToken (JWT)
    - userDetails (id, name, email, role)
         ↓
    Redirect to /dashboard
```

---

## 2. Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              REQUEST WITH JWT TOKEN                              │
└─────────────────────────────────────────────────────────────────┘

Client makes API call
         ↓
    Auth Interceptor attaches:
    Authorization: Bearer <JWT_TOKEN>
         ↓
┌─────────────────────────┐
│   auth.js middleware    │
│                         │
│  1. Extract token       │
│  2. Verify signature    │
│  3. Decode payload      │
│  4. Set req.user        │
└─────────────────────────┘
         ↓
    Token valid? ──NO──→ 401 Unauthorized
         ↓ YES
    req.user = { userId, email, name, role }
         ↓
┌─────────────────────────┐
│  checkAdmin middleware  │  (for admin routes only)
│                         │
│  Check req.user.role    │
│  === 'admin'?           │
└─────────────────────────┘
         ↓
    Is Admin? ──NO──→ 403 Forbidden
         ↓ YES
    Route Handler
         ↓
    Response to client
```

---

## 3. User Booking Creation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                USER BOOKING CREATION                             │
└─────────────────────────────────────────────────────────────────┘

User (role: 'user') on /bookings page
         ↓
    Select car (e.g., Honda Civic, ₹500/day)
         ↓
    Set dates: Nov 1 - Nov 5 (5 days)
         ↓
    Frontend calculates:
    Duration = (Nov 5 - Nov 1) + 1 = 5 days
    Estimated Total = ₹500 × 5 = ₹2,500
         ↓
    Display: "Your Calculated Total Price: ₹2,500"
         ↓
    User clicks Submit
         ↓
    POST /api/CarRentalApp/CreateUserBooking
    {
      carId: "xyz123",
      startDate: "2025-11-01",
      endDate: "2025-11-05",
      customerName: "John Doe",
      email: "user@test.com",
      discount: 0,          ← Client sends, but ignored
      totalBillAmount: 0    ← Client sends, but ignored
    }
         ↓
┌────────────────────────────────────────────┐
│  bookingController.js                      │
│  processBookingCreation(req, res, false)   │ ← isAdmin = false
│                                            │
│  1. Check availability (no overlap)        │
│  2. Find Customer by email                 │
│  3. Find Car by carId                      │
│  4. Calculate duration = 5 days            │
│  5. ENFORCE: discount = 0                  │
│  6. CALCULATE: totalBillAmount =           │
│     car.dailyRate × duration = ₹2,500      │
│  7. Create Booking doc                     │
└────────────────────────────────────────────┘
         ↓
    Booking saved with:
    - discount: 0 (backend enforced)
    - totalBillAmount: ₹2,500 (backend calculated)
         ↓
    Success response → Update UI
```

---

## 4. Admin Booking with Availability Check

```
┌─────────────────────────────────────────────────────────────────┐
│         ADMIN BOOKING WITH OVERLAP DETECTION                     │
└─────────────────────────────────────────────────────────────────┘

Admin (role: 'admin') on /bookings page
         ↓
    Existing Booking:
    Car: Honda Civic (ID: xyz123)
    Dates: Nov 10 - Nov 15
         ↓
    Admin attempts new booking:
    Car: Honda Civic (same car)
    Dates: Nov 9 - Nov 16 (overlaps)
         ↓
    POST /api/CarRentalApp/CreateNewBooking
         ↓
┌────────────────────────────────────────────┐
│  bookingController.js                      │
│  processBookingCreation(req, res, true)    │ ← isAdmin = true
│                                            │
│  1. Find all bookings for carId: xyz123    │
│  2. For each existing booking:             │
│     checkDateOverlap(                      │
│       newStart: Nov 9,                     │
│       newEnd: Nov 16,                      │
│       existingStart: Nov 10,               │
│       existingEnd: Nov 15                  │
│     )                                      │
│                                            │
│  3. Overlap detected:                      │
│     Nov 9 ≤ Nov 15 AND Nov 16 ≥ Nov 10     │
│     → TRUE (overlaps!)                     │
│                                            │
│  4. Throw error                            │
└────────────────────────────────────────────┘
         ↓
    400 Bad Request
    {
      message: "Car is already booked during 
                the period 2025-11-09 to 2025-11-16.
                Please select a different car or 
                date range.",
      result: false
    }
         ↓
    Frontend displays error notification
         ↓
    Booking NOT created
```

---

## 5. User Access to Admin Route (Denied)

```
┌─────────────────────────────────────────────────────────────────┐
│              USER ATTEMPTS ADMIN ROUTE                           │
└─────────────────────────────────────────────────────────────────┘

User (role: 'user') types in URL bar:
    http://localhost:4200/customers
         ↓
    Angular Router activates CustomerComponent
         ↓
┌────────────────────────┐
│  customer.ts           │
│  ngOnInit() {          │
│    if (!isUserAdmin()) │ ← Check role in localStorage
│      redirect          │
│      show error        │
│      return            │
│  }                     │
└────────────────────────┘
         ↓
    Redirect to /dashboard
         ↓
    Show notification:
    "Access denied. Customer management 
     is for administrators only."


BACKEND PROTECTION (if user bypasses frontend):
         ↓
    User tries: GET /api/CarRentalApp/GetCustomers
         ↓
┌────────────────────────┐
│  auth middleware       │
│  - Validates JWT ✅    │
│  - Sets req.user       │
└────────────────────────┘
         ↓
┌────────────────────────┐
│  checkAdmin middleware │
│  - req.user.role       │
│  - 'user' !== 'admin'  │
└────────────────────────┘
         ↓
    403 Forbidden
    {
      message: "Access denied: Admin role required.",
      result: false
    }
```

---

## 6. Profile Update (Dual Collection Update)

```
┌─────────────────────────────────────────────────────────────────┐
│              PROFILE UPDATE FLOW                                 │
└─────────────────────────────────────────────────────────────────┘

User/Admin on /profile page
         ↓
    ngOnInit() loads initial data:
    1. From localStorage (JWT):
       - name: "John Doe"
       - email: "user@test.com"
    
    2. From API (Customer collection):
       GET /api/CarRentalApp/GetCustomerProfileById?userId=<id>
       - mobileNo: "9876543210"
       - customerCity: "Mumbai"
         ↓
    User edits profile:
    - Name: "John Doe Jr."
    - Mobile: "9999999999"
         ↓
    Click Update
         ↓
    PUT /api/auth/update
    {
      name: "John Doe Jr.",
      email: "user@test.com",
      mobileNo: "9999999999",
      customerCity: "Mumbai"
    }
         ↓
┌────────────────────────────────────────────┐
│  authController.js → updateUser()          │
│                                            │
│  const userId = req.user.userId (from JWT) │
│                                            │
│  1. Check uniqueness (email, mobile)       │
│  2. Update User collection:                │
│     User.findByIdAndUpdate(userId, {       │
│       name: "John Doe Jr.",                │
│       email: "user@test.com"               │
│     })                                     │
│                                            │
│  3. Update Customer collection:            │
│     Customer.findByIdAndUpdate(userId, {   │ ← Same ID
│       customerName: "John Doe Jr.",        │
│       email: "user@test.com",              │
│       mobileNo: "9999999999"               │
│     })                                     │
└────────────────────────────────────────────┘
         ↓
    Both collections updated atomically
         ↓
    Success response
         ↓
    Update localStorage with new UserDetails
         ↓
    Reload profile data
```

---

## 7. Image Handling with Fallback

```
┌─────────────────────────────────────────────────────────────────┐
│              IMAGE DISPLAY FLOW                                  │
└─────────────────────────────────────────────────────────────────┘

Template attempts to display car image:
    <img [src]="getSafeImage(car.carImage)">
         ↓
┌────────────────────────┐
│  getSafeImage(url)     │
│                        │
│  url empty?            │ ──YES──→ Return placeholder SVG
│    ↓ NO                │
│  data:image/*?         │ ──YES──→ Return as-is (file upload)
│    ↓ NO                │
│  Add https:// if       │
│  protocol missing      │
│    ↓                   │
│  Validate URL format   │
│  with URL() API        │
│    ↓                   │
│  Valid?                │ ──NO──→ Return placeholder SVG
│    ↓ YES               │
│  Return validated URL  │
└────────────────────────┘
         ↓
    Browser attempts to load image
         ↓
    Load successful? ──YES──→ Display image
         ↓ NO
    (error) event triggers
         ↓
┌────────────────────────┐
│  onImgError(event)     │
│                        │
│  img.src =             │
│    placeholderImage    │
└────────────────────────┘
         ↓
    Display placeholder SVG
    (gray box with text)
```

---

## 8. Booking Duration Calculation

```
┌─────────────────────────────────────────────────────────────────┐
│           DURATION CALCULATION (Inclusive)                       │
└─────────────────────────────────────────────────────────────────┘

Example: Nov 1 to Nov 5
         ↓
    startDate = new Date("2025-11-01")
    endDate = new Date("2025-11-05")
         ↓
    Normalize to midnight:
    start.setUTCHours(0, 0, 0, 0) → Nov 1, 00:00:00
    end.setUTCHours(0, 0, 0, 0)   → Nov 5, 00:00:00
         ↓
    diffTime = end - start
             = 4 days in milliseconds
             = 4 × 24 × 60 × 60 × 1000
             = 345,600,000 ms
         ↓
    diffDays = Math.ceil(diffTime / (1000 × 60 × 60 × 24))
             = Math.ceil(345,600,000 / 86,400,000)
             = Math.ceil(4)
             = 4 days
         ↓
    duration = diffDays + 1
             = 4 + 1
             = 5 days ✅
         ↓
    Includes: Nov 1, 2, 3, 4, 5 (5 days total)


WITHOUT +1 (INCORRECT):
    Nov 1 to Nov 1 → 0 days ❌ (should be 1 day)
    Nov 1 to Nov 5 → 4 days ❌ (should be 5 days)

WITH +1 (CORRECT):
    Nov 1 to Nov 1 → 1 day ✅
    Nov 1 to Nov 5 → 5 days ✅
```

---

## 9. Complete Request Flow (User Booking)

```
┌─────────────────────────────────────────────────────────────────┐
│           END-TO-END USER BOOKING REQUEST                        │
└─────────────────────────────────────────────────────────────────┘

Browser (user@test.com logged in)
         ↓
    POST /api/CarRentalApp/CreateUserBooking
    Headers: Authorization: Bearer <JWT_TOKEN>
    Body: { carId, startDate, endDate, ... }
         ↓
┌────────────────────────┐
│  Auth Interceptor      │ (Angular)
│  - Attaches JWT        │
└────────────────────────┘
         ↓
    Request sent to backend
         ↓
┌────────────────────────┐
│  CORS middleware       │ (Express)
│  - Allows origin       │
└────────────────────────┘
         ↓
┌────────────────────────┐
│  express.json()        │ (Express)
│  - Parse JSON body     │
└────────────────────────┘
         ↓
┌────────────────────────┐
│  auth middleware       │
│  - Verify JWT          │
│  - Set req.user        │
└────────────────────────┘
         ↓
┌────────────────────────┐
│  Route Handler         │
│  createUserBooking()   │
│                        │
│  - Check availability  │
│  - Find customer       │
│  - Calculate price     │
│  - Enforce discount=0  │
│  - Save booking        │
└────────────────────────┘
         ↓
    MongoDB write operation
         ↓
    Response: 201 Created
    { message: "Car booked successfully", result: true, data: {...} }
         ↓
    Browser receives response
         ↓
┌────────────────────────┐
│  Angular Component     │
│  - Parse response      │
│  - Update UI           │
│  - Show notification   │
│  - Reload booking list │
└────────────────────────┘
```

---

## 10. Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    COLLECTIONS & RELATIONSHIPS                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│   Users Collection  │
│                     │
│  _id: ObjectId      │ ←──┐
│  email: String      │    │ SAME ID
│  password: String   │    │
│  name: String       │    │
│  role: String       │    │
└─────────────────────┘    │
                           │
                           │
┌─────────────────────┐    │
│ Customers Collection│    │
│                     │    │
│  _id: ObjectId      │ ───┘ (manually set to match User._id)
│  customerName: Str  │
│  email: String      │
│  mobileNo: String   │
│  customerCity: Str  │
└─────────────────────┘
         ↓
    Referenced by Bookings
         ↓
┌─────────────────────┐
│ Bookings Collection │
│                     │
│  _id: ObjectId      │
│  customerId: ObjId  │ → References Customer._id
│  carId: ObjectId    │ → References Car._id
│  startDate: String  │
│  endDate: String    │
│  discount: Number   │
│  totalBillAmount:N  │
│  (denormalized)     │
│  customerName: Str  │
│  brand: String      │
│  model: String      │
└─────────────────────┘


┌─────────────────────┐
│   Cars Collection   │
│                     │
│  _id: ObjectId      │
│  brand: String      │
│  model: String      │
│  year: Number       │
│  color: String      │
│  dailyRate: Number  │
│  carImage: String   │
│  regNo: String      │
└─────────────────────┘
         ↑
    Referenced by Bookings
```

---

## Legend

```
┌──────────────────────────────────────────┐
│              SYMBOLS                     │
└──────────────────────────────────────────┘

→  Flow direction
↓  Sequential step
✅  Success / Correct
❌  Error / Incorrect
←  Reference / Assignment
═  Database operation
```

---

*Visual flow diagrams for Apex Car Rental System* 🗺️
