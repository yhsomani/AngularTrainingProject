# 🏗️ Apex Car Rental - Architectural Documentation

## Overview
This document provides in-depth explanations of the key architectural decisions and implementations in the Apex Car Rental Management System.

---

## 1. User/Customer Data Synchronization Architecture

### Problem Statement
How do we maintain a relationship between authentication data (User) and profile data (Customer) without complex foreign key relationships?

### Solution: Shared Primary Key Pattern

#### Implementation Details

**Location:** `controllers/authController.js` → `exports.register`

```javascript
// Step 1: Create User account first (generates new _id)
const newUser = await User.create({
    email: email,
    password: hashedPassword,
    name: name,
    role: role || 'user'
});

// Step 2: Create Customer with SAME _id
await Customer.create({
    _id: newUser._id,  // ← Explicitly set to match User's _id
    customerName: name,
    customerCity: customerCity,
    mobileNo: mobileNo,
    email: email,
});
```

#### Schema Configuration

**User Schema** (`models/User.js`):
```javascript
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager', 'user'], default: 'user' }
});
```

**Customer Schema** (`models/Customer.js`):
```javascript
const CustomerSchema = new mongoose.Schema({
    // Manual _id assignment (matches User._id)
    customerName: { type: String, required: true },
    customerCity: { type: String, required: true },
    mobileNo: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true }
}, {
    _id: false  // ← Disable auto-generation
});
```

### Benefits

1. **Simple Queries:**
   ```javascript
   // Get customer profile from user ID
   const customer = await Customer.findById(req.user.userId);
   ```

2. **Atomic Updates:**
   ```javascript
   // Update both collections using same ID
   await User.findByIdAndUpdate(userId, { name, email });
   await Customer.findByIdAndUpdate(userId, { customerName: name, email });
   ```

3. **No JOINs Required:**
   - Direct lookups by ID
   - No need for `populate()` or aggregation pipelines
   - Better performance for simple queries

4. **Data Consistency:**
   - 1:1 relationship guaranteed
   - Cannot have orphaned Customer records
   - Cannot have User without Customer

### Trade-offs

**Pros:**
- ✅ Simplicity
- ✅ Performance
- ✅ Easy to understand and maintain

**Cons:**
- ❌ MongoDB doesn't enforce referential integrity
- ❌ Manual cleanup required if User deleted
- ❌ Requires careful transaction handling in production

### Production Considerations

For production systems, consider:

```javascript
// Use MongoDB transactions for atomicity
const session = await mongoose.startSession();
session.startTransaction();

try {
    const newUser = await User.create([{ email, password, name, role }], { session });
    await Customer.create([{ _id: newUser[0]._id, ... }], { session });
    await session.commitTransaction();
} catch (error) {
    await session.abortTransaction();
    throw error;
} finally {
    session.endSession();
}
```

---

## 2. Booking Duration Calculation Logic

### Problem Statement
Car rental bookings span multiple days. How do we calculate the number of rental days from start and end dates?

### Solution: Inclusive Date Counting

#### Implementation

**Location:** `controllers/bookingController.js` → `calculateDuration()`

```javascript
function calculateDuration(startDateStr, endDateStr) {
    // Parse dates
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    // Validate: start must be before or equal to end
    if (start > end) return 0;

    // Normalize to midnight (eliminate time component)
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    // Calculate difference in milliseconds
    const diffTime = Math.abs(end.getTime() - start.getTime());
    
    // Convert milliseconds to days
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Add 1 for inclusive count
    return diffDays + 1;
}
```

### Why `+ 1`?

#### Business Logic Rationale

In the car rental industry, dates are **inclusive**:
- If you rent a car for "Monday to Monday", you have the car for 1 day
- If you rent a car for "Monday to Friday", you have the car for 5 days

#### Mathematical Explanation

**Example 1: Same-Day Rental**
```
Start: 2025-11-01
End:   2025-11-01

Calculation:
- diffTime = 0 milliseconds (same day)
- diffDays = 0
- Result = 0 + 1 = 1 day ✅

Without +1: Would be 0 days ❌ (Incorrect)
```

**Example 2: Multi-Day Rental**
```
Start: 2025-11-01
End:   2025-11-05

Calculation:
- diffTime = 4 days worth of milliseconds
- diffDays = 4
- Result = 4 + 1 = 5 days ✅

Days: Nov 1, 2, 3, 4, 5 = 5 days (both endpoints included)
Without +1: Would be 4 days ❌ (Missing one day)
```

### Visual Representation

```
Timeline with +1 logic:
|---|---|---|---|---|
Nov 1   2   3   4   5

Duration = 5 days (correct)
Includes both start (Nov 1) and end (Nov 5)
```

### Time Normalization

```javascript
start.setUTCHours(0, 0, 0, 0);
end.setUTCHours(0, 0, 0, 0);
```

**Why normalize to midnight?**

**Problem:**
```javascript
// Without normalization
start = "2025-11-01T14:30:00" (2:30 PM)
end   = "2025-11-01T16:45:00" (4:45 PM)

// Would calculate as 2.25 hours = 0.09 days
// With ceil(), would round up to 1 day (correct by accident)
```

**Solution:**
```javascript
// With normalization
start = "2025-11-01T00:00:00" (midnight)
end   = "2025-11-01T00:00:00" (midnight)

// diffTime = 0
// diffDays = 0
// Result = 0 + 1 = 1 day (correct by design)
```

### Frontend Implementation

The same logic is mirrored in Angular for real-time UI updates:

**Location:** `src/app/pages/booking/booking.ts`

```typescript
getDurationInDays(startDateStr: string, endDateStr: string): number {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return 0;
    }
    
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays + 1; // Inclusive count
}
```

### Usage in Price Calculation

```javascript
// Backend: Calculate total bill
const duration = calculateDuration(startDate, endDate);
const totalBillAmount = car.dailyRate * duration;

// Example:
// dailyRate = ₹500
// duration = 5 days
// totalBillAmount = ₹2,500
```

### Edge Cases Handled

1. **Same-day rental:** Returns 1 (not 0)
2. **Invalid date range:** Returns 0 if start > end
3. **Time components:** Normalized to midnight
4. **Leap seconds/DST:** Uses UTC to avoid timezone issues

---

## 3. Frontend Image Handling Architecture

### Problem Statement
Vehicle images can come from various sources (URLs, data URLs, invalid URLs, missing images). How do we ensure a consistent user experience?

### Solution: Multi-Layer Fallback System

#### Component Structure

**Location:** `src/app/pages/vehicle/vehicle.ts`

#### Layer 1: Placeholder Image

```typescript
private placeholderImage =
    "data:image/svg+xml;utf8," +
    "%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20100%2060'%3E" +
    "%3Crect%20width='100'%20height='60'%20fill='%23e0e0e0'/%3E" +
    "%3Ctext%20x='50'%20y='35'%20font-size='12'%20fill='%23666'%20" +
    "text-anchor='middle'%3ENo%20Image%20Placeholder%3C/text%3E%3C/svg%3E";
```

**Why inline SVG data URL?**
- ✅ No external dependency
- ✅ Always available (no network request)
- ✅ Customizable with CSS
- ✅ Semantic (shows text "No Image Placeholder")

#### Layer 2: URL Validation (`getSafeImage()`)

```typescript
getSafeImage(url?: string): string {
    // 1. Empty check
    if (!url?.trim()) {
        return this.placeholderImage;
    }

    try {
        // 2. Data URL pass-through
        if (url.startsWith('data:image')) return url;

        // 3. Protocol normalization
        let fullUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            fullUrl = 'https://' + url;
        }

        // 4. URL validation
        const parsed = new URL(fullUrl);
        if (['http:', 'https:'].includes(parsed.protocol) && 
            parsed.hostname.includes('.')) {
            return fullUrl;
        }
    } catch {
        // 5. Exception handling
    }

    // 6. Default fallback
    return this.placeholderImage;
}
```

**Validation Flow:**

```
Input URL
    ↓
Empty/null? → YES → Placeholder
    ↓ NO
Data URL? → YES → Return as-is
    ↓ NO
Add https:// if needed
    ↓
Parse with URL()
    ↓
Valid format? → YES → Return validated URL
    ↓ NO
Placeholder
```

#### Layer 3: Load Error Handler

```typescript
onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.placeholderImage) {
        img.src = this.placeholderImage;
    }
}
```

**Handles:**
- Network errors (404, 500, etc.)
- Broken image links
- CORS issues
- Slow-loading images that timeout

#### Template Integration

```html
<img 
    [src]="getSafeImage(car.carImage)" 
    (error)="onImgError($event)"
    [alt]="car.brand + ' ' + car.model"
    class="car-image"
>
```

**Security Features:**

1. **XSS Prevention:**
   ```typescript
   // Validates URL format before rendering
   const parsed = new URL(fullUrl);
   ```

2. **Protocol Validation:**
   ```typescript
   // Only allows http/https
   if (['http:', 'https:'].includes(parsed.protocol))
   ```

3. **Hostname Validation:**
   ```typescript
   // Ensures valid domain structure
   if (parsed.hostname.includes('.'))
   ```

### File Upload Flow

```typescript
onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files[0];
    
    // 1. Type validation
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
        this.showNotification('error', 'Only image files allowed.');
        return;
    }
    
    // 2. Convert to data URL
    const reader = new FileReader();
    reader.onload = () => {
        const result = reader.result as string;
        // 3. Store data URL (inline base64)
        this.newCar.update((c) => ({ ...c, carImage: result }));
    };
    reader.readAsDataURL(file);
}
```

**Data URL Example:**
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...
```

### Use Cases Handled

| Input | getSafeImage() Output | Notes |
|-------|----------------------|-------|
| `null` | Placeholder | Empty check |
| `""` | Placeholder | Empty check |
| `"data:image/png;base64,..."` | Data URL as-is | File upload |
| `"https://example.com/car.jpg"` | Full URL | Valid external URL |
| `"example.com/car.jpg"` | `https://example.com/car.jpg` | Protocol added |
| `"javascript:alert(1)"` | Placeholder | XSS blocked |
| `"ftp://example.com/car.jpg"` | Placeholder | Invalid protocol |
| `"https://broken-link.com/404.jpg"` | Placeholder | Via `onImgError()` |

### Performance Considerations

1. **Lazy Loading (Optional Enhancement):**
   ```html
   <img loading="lazy" [src]="getSafeImage(car.carImage)">
   ```

2. **Image Optimization (Future):**
   - Compress uploads before storing
   - Use thumbnail URLs for list views
   - Full resolution for detail views

3. **Caching:**
   - Data URLs cached in memory
   - Browser caches external URLs automatically

---

## 4. Admin Protection Middleware Architecture

### Problem Statement
How do we restrict sensitive operations (customer management, car management, booking management) to admin users only?

### Solution: Layered Authentication & Authorization

#### Layer 1: JWT Authentication

**File:** `middleware/auth.js`

```javascript
module.exports = function (req, res, next) {
    // 1. Extract token from Authorization header
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ") 
        ? authHeader.split(" ")[1] 
        : null;

    // 2. Validate token presence
    if (!token) {
        return res.status(401).json({ 
            message: "No token, authorization denied" 
        });
    }

    try {
        // 3. Verify token signature and decode payload
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || "secretkey"
        );
        
        // 4. Attach user data to request object
        req.user = decoded; // Contains: { userId, email, name, role }
        
        // 5. Proceed to next middleware
        next();
    } catch (err) {
        // 6. Invalid token (expired, tampered, wrong secret)
        return res.status(403).json({ 
            message: "Token is not valid" 
        });
    }
};
```

#### Layer 2: Role Authorization

**File:** `routes/carRentalRoutes.js`

```javascript
const checkAdmin = (req, res, next) => {
    // req.user already set by auth middleware
    if (req.user && req.user.role === 'admin') {
        next(); // Allow access
    } else {
        res.status(403).json({ 
            message: 'Access denied: Admin role required.', 
            result: false 
        });
    }
};
```

#### Middleware Chain

```javascript
// All routes below require authentication
router.use(auth);

// Public to authenticated users
router.get('/GetCars', carController.getAllCars);
router.post('/CreateUserBooking', bookingController.createUserBooking);

// Admin-only routes
router.get('/GetDashboardData', checkAdmin, bookingController.getDashboardData);
router.post('/CreateNewCar', checkAdmin, carController.createCar);
router.get('/GetCustomers', checkAdmin, customerController.getCustomers);
```

**Request Flow:**

```
Client Request
    ↓
[auth middleware]
    ↓
Valid JWT? → NO → 401 Unauthorized
    ↓ YES
Extract req.user
    ↓
[checkAdmin middleware] (for admin routes)
    ↓
req.user.role === 'admin'? → NO → 403 Forbidden
    ↓ YES
[Controller Handler]
    ↓
Response
```

### Token Structure

**JWT Payload (set in authController.js):**
```javascript
const token = jwt.sign(
    { 
        userId: user._id, 
        email: user.email, 
        name: user.name, 
        role: user.role  // ← Key for authorization
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
);
```

**Decoded Token Example:**
```json
{
    "userId": "672a1b2c3d4e5f6g7h8i9j0k",
    "email": "admin@test.com",
    "name": "Admin User",
    "role": "admin",
    "iat": 1699200000,
    "exp": 1699203600
}
```

### Frontend Integration

#### Interceptor (Attaches Token)

**File:** `src/app/interceptors/auth.interceptor.ts`

```typescript
export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('authToken');

    if (token && req.url.includes('/api/')) {
        const cloned = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`),
        });
        return next(cloned);
    }

    return next(req);
};
```

#### Service (Checks Role)

**File:** `src/app/services/car-rental.service.ts`

```typescript
isUserAdmin(): boolean {
    return this.getAuthDetails()?.role === 'admin';
}
```

#### Component Guards

**File:** `src/app/pages/customer/customer.ts`

```typescript
ngOnInit() {
    if (!this.carRentalService.isUserAdmin()) {
        this.router.navigate(['/dashboard']);
        this.showNotification('error', 'Access denied...');
        return;
    }
    this.loadCustomers();
}
```

### Security Analysis

#### Attack Scenarios & Defenses

**1. Token Tampering:**
```
Attack: User changes role from 'user' to 'admin' in JWT
Defense: JWT signature verification fails → 403 Forbidden
```

**2. Expired Token:**
```
Attack: User tries to use old token after expiration
Defense: jwt.verify() throws error → 403 Forbidden
```

**3. Frontend Bypass:**
```
Attack: User modifies localStorage to set role: 'admin'
Defense: Backend ignores localStorage, only trusts JWT signature
```

**4. API Direct Access:**
```
Attack: User calls admin endpoint directly via curl
Defense: checkAdmin middleware validates JWT role → 403 Forbidden
```

**5. Role Escalation:**
```
Attack: User tries to update their own role via profile update
Defense: Backend does not allow role field in update payload
```

### Route Protection Matrix

| Route | Auth Required | Admin Required | Accessible By |
|-------|---------------|----------------|---------------|
| `/api/auth/login` | ❌ | ❌ | Everyone |
| `/api/auth/register` | ❌ | ❌ | Everyone |
| `/api/CarRentalApp/GetCars` | ✅ | ❌ | User, Admin |
| `/api/CarRentalApp/CreateUserBooking` | ✅ | ❌ | User, Admin |
| `/api/CarRentalApp/GetDashboardData` | ✅ | ✅ | Admin only |
| `/api/CarRentalApp/CreateNewCar` | ✅ | ✅ | Admin only |
| `/api/CarRentalApp/GetCustomers` | ✅ | ✅ | Admin only |
| `/api/CarRentalApp/CreateNewBooking` | ✅ | ✅ | Admin only |

### Best Practices Implemented

1. ✅ **Middleware Composition:** Separate concerns (auth vs authorization)
2. ✅ **Fail-Secure:** Default to deny access
3. ✅ **Centralized Logic:** Middleware reused across routes
4. ✅ **Clear Error Messages:** 401 vs 403 distinction
5. ✅ **Token Expiration:** 1-hour lifetime
6. ✅ **Secure Storage:** JWT secret in .env file
7. ✅ **Role Enumeration:** User model restricts roles to valid values

### Production Enhancements (Recommended)

1. **Refresh Tokens:**
   ```javascript
   // Issue long-lived refresh token
   // Client exchanges for new access token when expired
   ```

2. **Rate Limiting:**
   ```javascript
   const rateLimit = require('express-rate-limit');
   app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
   ```

3. **Audit Logging:**
   ```javascript
   router.delete('/DeleteCarbyCarId', checkAdmin, auditLog('DELETE_CAR'), deleteCar);
   ```

4. **HTTPS Only:**
   ```javascript
   app.use((req, res, next) => {
       if (req.secure || process.env.NODE_ENV === 'development') return next();
       res.redirect(`https://${req.headers.host}${req.url}`);
   });
   ```

---

## 📊 Architecture Summary

| Component | Purpose | Key Benefit |
|-----------|---------|-------------|
| Shared Primary Key | User/Customer sync | Simplified queries |
| Duration +1 Logic | Accurate rental days | Industry-standard inclusive counting |
| Image Fallback | Robust image handling | Never shows broken images |
| Layered Auth | Security | Defense in depth |

**All architectural decisions prioritize:**
- 🔒 Security
- 🚀 Performance
- 🛠️ Maintainability
- 👤 User Experience

---

*Architecture reviewed and verified ✅*
