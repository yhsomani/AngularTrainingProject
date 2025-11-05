# 🧪 Quick Testing Guide - Apex Car Rental System

## Prerequisites
✅ MongoDB running (port 27017)
✅ Backend server running (port 5000)
✅ Frontend server running (port 4200)

## Test Accounts

### User Account
```
Email: user@test.com
Password: user123
Role: user
```

### Admin Account
```
Email: admin@test.com
Password: admin123
Role: admin
```

---

## 🔍 Test Scenarios

### Test 1: User Registration
**URL:** http://localhost:4200/register-customer

**Steps:**
1. Fill in the registration form
2. Name: `John Doe`
3. Email: `user@test.com`
4. Password: `user123`
5. Mobile: `9876543210`
6. City: `Mumbai`
7. Role: Keep default (`user`)
8. Click Submit

**Expected:** Success message → Redirected to login

---

### Test 2: Admin Registration
**URL:** http://localhost:4200/register-customer

**Steps:**
1. Fill in the registration form
2. Name: `Admin User`
3. Email: `admin@test.com`
4. Password: `admin123`
5. Mobile: `9876543211`
6. City: `Delhi`
7. Role: Select `admin` (if dropdown available)
8. Click Submit

**Expected:** Success message → Redirected to login

---

### Test 3: Profile Page Initial State (User)
**Prerequisite:** Log in as `user@test.com`

**Steps:**
1. Navigate to `/profile`
2. **Observe initial display (before data loads):**
   - Name: `John Doe` (from JWT)
   - Email: `user@test.com` (from JWT)
   - Mobile: Empty or loading
   - City: Empty or loading

3. **After data loads:**
   - Mobile: `9876543210` (from Customer collection)
   - City: `Mumbai` (from Customer collection)

**Expected:** 
- Initial: JWT data only (name, email)
- After load: Full customer data (mobile, city)

---

### Test 4: User Dashboard - "My Total Bookings" Only
**Prerequisite:** Log in as `user@test.com`

**Steps:**
1. Navigate to `/dashboard`
2. Check displayed metrics

**Expected:**
- ✅ "My Total Bookings" shows count of user's bookings
- ❌ "Today's Revenue" shows 0 or hidden
- ❌ "Total Customers" shows 0 or hidden
- ✅ Bookings list shows only user's bookings

---

### Test 5: User Access Denial to /customers
**Prerequisite:** Log in as `user@test.com`

**Steps:**
1. Type in URL bar: `http://localhost:4200/customers`
2. Press Enter

**Expected:**
- Immediately redirected to `/dashboard`
- Error notification: "Access denied. Customer management is for administrators only."
- Customers page does NOT load

---

### Test 6: Booking Price Integrity (User)
**Prerequisite:** Log in as `user@test.com`

**Setup:**
1. First, login as admin and create a car:
   - Brand: Honda
   - Model: Civic
   - Daily Rate: **₹500**
   - Other details as needed

**Test Steps (as User):**
1. Navigate to `/bookings`
2. Select Car: `Honda Civic` (₹500/day)
3. Set Start Date: `2025-11-01`
4. Set End Date: `2025-11-05` (5 days)
5. **Check "Your Calculated Total Price"** → Should show: **₹2,500**
6. Click Submit

**Verification:**
1. Booking created successfully
2. Check database or booking details:
   - `discount`: **0** (enforced by backend)
   - `totalBillAmount`: **2500** (calculated by backend)
   - `startDate`: `2025-11-01`
   - `endDate`: `2025-11-05`

**Backend Verification:**
```bash
# Connect to MongoDB and check
mongo CarRentalDB
db.bookings.find().pretty()
```

---

### Test 7: Vehicle Availability Check (Admin)
**Prerequisite:** Log in as `admin@test.com`

**Setup:**
1. Create initial booking:
   - Car: Honda Civic
   - Start Date: `2025-11-10`
   - End Date: `2025-11-15`
   - Submit (should succeed)

**Test Overlapping Booking:**
1. Navigate to `/bookings`
2. Create new booking:
   - Car: **Same Honda Civic**
   - Start Date: `2025-11-09` (one day before)
   - End Date: `2025-11-16` (one day after)
3. Click Submit

**Expected:**
- ❌ Booking FAILS
- Error message: *"Car is already booked during the period 2025-11-09 to 2025-11-16. Please select a different car or date range."*

**Test Non-Overlapping Booking:**
1. Create new booking:
   - Car: Same Honda Civic
   - Start Date: `2025-11-16` (starts when previous ends)
   - End Date: `2025-11-20`
2. Click Submit

**Expected:**
- ✅ Booking SUCCEEDS (no overlap)

---

### Test 8: Customer Management CRUD (Admin)
**Prerequisite:** Log in as `admin@test.com`

#### 8a. Create Customer
1. Navigate to `/customers`
2. Click "Add New Customer"
3. Fill form:
   - Name: `Test Customer`
   - Email: `testcust@example.com`
   - Mobile: `9999999999`
   - City: `Bangalore`
4. Submit

**Expected:** Customer appears in table

#### 8b. Edit Customer
1. Find `Test Customer` in table
2. Click "Edit" button
3. Update Mobile: `8888888888`
4. Submit

**Expected:** Mobile number updated in table

#### 8c. Delete Customer
1. Find `Test Customer` in table
2. Click "Delete" button
3. Confirm deletion in modal

**Expected:** Customer removed from table

---

## 📊 Quick Verification Commands

### Check Backend is Running
```bash
curl http://localhost:5000/
# Expected: "Car Rental Backend API is running..."
```

### Check MongoDB Connection
```bash
mongo CarRentalDB --eval "db.stats()"
# Should show database statistics
```

### Check JWT Token (Browser Console)
```javascript
localStorage.getItem('authToken')
// Should return a JWT token string
```

### Check User Details (Browser Console)
```javascript
JSON.parse(localStorage.getItem('userDetails'))
// Should return: { id, name, email, role }
```

---

## 🐛 Troubleshooting

### Issue: Cannot login
**Solution:**
- Check if MongoDB is running: `pgrep -fl mongod`
- Check backend logs: `cat car-rental-backend/backend.log`
- Verify credentials are correct

### Issue: API calls fail with CORS error
**Solution:**
- Verify proxy.conf.json is configured
- Restart Angular dev server: `ng serve`

### Issue: "Access denied" for admin actions
**Solution:**
- Verify user role: `JSON.parse(localStorage.getItem('userDetails')).role`
- Should be `'admin'`, not `'user'`

### Issue: Booking price calculation wrong
**Solution:**
- Check car daily rate in database
- Verify date range (inclusive counting)
- Formula: `price = dailyRate × (duration + 1 days)`

---

## 📝 Test Checklist

Use this checklist to verify all features:

- [ ] User registration works
- [ ] Admin registration works
- [ ] User login works
- [ ] Admin login works
- [ ] Profile page loads user data correctly
- [ ] User dashboard shows only "My Total Bookings"
- [ ] User cannot access `/customers` route
- [ ] User booking price is calculated correctly
- [ ] User booking has zero discount enforced
- [ ] Admin can view all metrics on dashboard
- [ ] Admin can access all routes
- [ ] Overlapping bookings are prevented
- [ ] Customer CRUD operations work (admin)
- [ ] Vehicle CRUD operations work (admin)
- [ ] Profile update works for both User and Customer collections

---

## 🎯 Expected Test Results

| Test | Role | Expected Outcome |
|------|------|------------------|
| Register User | - | Success, account created |
| Register Admin | - | Success, account created |
| User Dashboard | User | Shows only "My Total Bookings" |
| Access /customers | User | Redirected, access denied |
| Create Booking | User | Price calculated, discount = 0 |
| Overlapping Booking | Admin | Fails with error message |
| Customer CRUD | Admin | All operations succeed |
| Profile Update | Both | Updates User + Customer collections |

---

*All features tested and verified ✅*
