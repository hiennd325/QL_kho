# 🧪 API Testing Guide - Quản lý Người dùng

## 📌 Chuẩn bị

### Base URL
```
Local: http://localhost:3000
Production: https://your-domain.com
```

### Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

### Authentication
```bash
# 1. Login để lấy token
POST /auth/login
Body: {username, password}
Response: {token: "eyJhbGc..."}

# 2. Copy token vào Authorization header
Authorization: Bearer eyJhbGc...
```

---

## 🔍 API Endpoints

### 1️⃣ GET /users - Lấy danh sách người dùng

#### Basic Request
```bash
curl http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### With Search
```bash
curl "http://localhost:3000/users?search=nguyen" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### With Role Filter
```bash
curl "http://localhost:3000/users?role=admin" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### With Status Filter
```bash
curl "http://localhost:3000/users?status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Combined Filters
```bash
curl "http://localhost:3000/users?search=nguyen&role=staff&status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Response Success (200)
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "password": "$2b$10$hashed...",
    "role": "admin",
    "status": "active",
    "created_at": "2025-11-22T10:30:00.000Z"
  },
  {
    "id": 2,
    "username": "user_staff",
    "email": "staff@example.com",
    "password": "$2b$10$hashed...",
    "role": "staff",
    "status": "active",
    "created_at": "2025-11-22T11:15:00.000Z"
  }
]
```

#### Test Cases
```javascript
// Test 1: Get all users
GET /users → Should return array

// Test 2: Search user
GET /users?search=admin → Should filter by username/email

// Test 3: Filter by role
GET /users?role=staff → Should return only staff

// Test 4: Filter by status
GET /users?status=inactive → Should return inactive users

// Test 5: Multiple filters
GET /users?role=admin&status=active → Should return active admins

// Test 6: No results
GET /users?search=nonexistent → Should return empty array []

// Test 7: Invalid token
GET /users → Should return 401 Unauthorized

// Test 8: No token
GET /users → Should return 401 Unauthorized
```

---

### 2️⃣ GET /users/:id - Lấy một người dùng

#### Request
```bash
curl http://localhost:3000/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Response Success (200)
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "password": "$2b$10$hashed...",
  "role": "admin",
  "status": "active",
  "created_at": "2025-11-22T10:30:00.000Z"
}
```

#### Response Not Found (404)
```json
{
  "error": "User not found"
}
```

#### Test Cases
```javascript
// Test 1: Valid user ID
GET /users/1 → Should return user object

// Test 2: Invalid user ID
GET /users/999 → Should return 404

// Test 3: Non-numeric ID
GET /users/abc → Should return 404

// Test 4: Negative ID
GET /users/-1 → Should return 404
```

---

### 3️⃣ POST /users - Tạo người dùng mới

#### Request
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "password123",
    "role": "staff",
    "status": "active"
  }'
```

#### Request Body
```json
{
  "username": "newuser",           // required, unique
  "email": "newuser@example.com",  // required
  "password": "password123",        // required, min 6
  "role": "staff",                  // optional, default 'staff'
  "status": "active"                // optional, default 'active'
}
```

#### Response Success (201)
```json
{
  "id": 3
}
```

#### Response Errors (400/500)
```json
{
  "error": "Failed to create user"
}
```

#### Test Cases
```javascript
// Test 1: Valid data
POST /users {all required fields} 
→ Should return {id: 3}

// Test 2: Duplicate username
POST /users {username: "admin", ...}
→ Should return error (username exists)

// Test 3: Missing username
POST /users {email: "...", password: "...", ...}
→ Should return error

// Test 4: Missing password
POST /users {username: "...", email: "...", ...}
→ Should return error

// Test 5: Password too short
POST /users {password: "123", ...}
→ Should return error

// Test 6: Invalid email
POST /users {email: "notanemail", ...}
→ May be accepted (no validation) or error

// Test 7: Invalid role
POST /users {role: "superadmin", ...}
→ Should accept or validate against list

// Test 8: Empty body
POST /users {}
→ Should return error
```

---

### 4️⃣ PUT /users/:id - Cập nhật người dùng

#### Request - Update Email
```bash
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "newemail@example.com"
  }'
```

#### Request - Update Password
```bash
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "password": "newpassword123"
  }'
```

#### Request - Update Role & Status
```bash
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "role": "admin",
    "status": "inactive"
  }'
```

#### Request Body (All Optional)
```json
{
  "username": "updated_name",        // optional, but cannot change
  "email": "new@example.com",        // optional
  "password": "newpassword123",      // optional
  "role": "admin",                   // optional
  "status": "inactive"               // optional
}
```

#### Response Success (200)
```json
{
  "id": 1,
  "username": "admin",
  "email": "newemail@example.com",
  "password": "$2b$10$hashed...",
  "role": "admin",
  "status": "inactive",
  "created_at": "2025-11-22T10:30:00.000Z"
}
```

#### Response Not Found (404)
```json
{
  "error": "User not found"
}
```

#### Test Cases
```javascript
// Test 1: Update email
PUT /users/1 {email: "new@example.com"}
→ Should return updated user

// Test 2: Update password
PUT /users/1 {password: "newpass123"}
→ Should hash and update password

// Test 3: Update role
PUT /users/1 {role: "admin"}
→ Should change role to admin

// Test 4: Update status
PUT /users/1 {status: "inactive"}
→ Should deactivate user

// Test 5: Multiple updates
PUT /users/1 {role: "admin", status: "inactive", email: "new@ex.com"}
→ Should update all fields

// Test 6: No updates (empty body)
PUT /users/1 {}
→ Should return error "No updates provided"

// Test 7: Invalid user ID
PUT /users/999 {email: "new@ex.com"}
→ Should return 404

// Test 8: Password too short
PUT /users/1 {password: "123"}
→ Should return error
```

---

### 5️⃣ DELETE /users/:id - Xóa người dùng

#### Request
```bash
curl -X DELETE http://localhost:3000/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Response Success (200)
```json
{
  "message": "User deleted successfully"
}
```

#### Response Not Found (404)
```json
{
  "error": "User not found"
}
```

#### Test Cases
```javascript
// Test 1: Delete existing user
DELETE /users/2
→ Should return success message

// Test 2: Delete already deleted user
DELETE /users/2 (again)
→ Should return 404

// Test 3: Delete non-existent user
DELETE /users/999
→ Should return 404

// Test 4: Delete with invalid ID
DELETE /users/abc
→ Should return 404

// Test 5: Delete without authentication
DELETE /users/1 (no token)
→ Should return 401 Unauthorized
```

---

### 6️⃣ GET /users/count - Lấy số lượng người dùng

#### Request
```bash
curl http://localhost:3000/users/count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Response Success (200)
```json
{
  "count": 15
}
```

#### Test Cases
```javascript
// Test 1: Get count
GET /users/count
→ Should return {count: number}

// Test 2: After adding user
POST /users {...} → get count
GET /users/count
→ Count should increase

// Test 3: After deleting user
DELETE /users/:id → get count
GET /users/count
→ Count should decrease
```

---

## 🧪 Testing Scenarios

### Scenario 1: Full CRUD Cycle

#### Step 1: Get Initial Count
```bash
curl http://localhost:3000/users/count \
  -H "Authorization: Bearer TOKEN"
# Response: {"count": 5}
```

#### Step 2: Create User
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "staff"
  }'
# Response: {"id": 6}
```

#### Step 3: Get New User
```bash
curl http://localhost:3000/users/6 \
  -H "Authorization: Bearer TOKEN"
# Response: {id: 6, username: "testuser", ...}
```

#### Step 4: Update User
```bash
curl -X PUT http://localhost:3000/users/6 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "role": "admin",
    "status": "inactive"
  }'
# Response: {id: 6, role: "admin", status: "inactive", ...}
```

#### Step 5: Delete User
```bash
curl -X DELETE http://localhost:3000/users/6 \
  -H "Authorization: Bearer TOKEN"
# Response: {"message": "User deleted successfully"}
```

#### Step 6: Verify Count
```bash
curl http://localhost:3000/users/count \
  -H "Authorization: Bearer TOKEN"
# Response: {"count": 5}
```

---

### Scenario 2: Search & Filter

#### Search by Username
```bash
curl "http://localhost:3000/users?search=admin" \
  -H "Authorization: Bearer TOKEN"
# Returns all users with 'admin' in username
```

#### Search by Email
```bash
curl "http://localhost:3000/users?search=gmail" \
  -H "Authorization: Bearer TOKEN"
# Returns all users with 'gmail' in email
```

#### Filter by Role
```bash
curl "http://localhost:3000/users?role=admin" \
  -H "Authorization: Bearer TOKEN"
# Returns only admin users
```

#### Filter by Status
```bash
curl "http://localhost:3000/users?status=active" \
  -H "Authorization: Bearer TOKEN"
# Returns only active users
```

#### Combined
```bash
curl "http://localhost:3000/users?search=admin&role=admin&status=active" \
  -H "Authorization: Bearer TOKEN"
# Returns active admin users with 'admin' in username
```

---

## 🐛 Common Errors & Solutions

### 401 Unauthorized
```
Problem: Missing or invalid token
Solution:
1. Check token in Authorization header
2. Verify token hasn't expired
3. Re-login if needed

curl http://localhost:3000/users \
  -H "Authorization: Bearer VALID_TOKEN"
```

### 404 Not Found
```
Problem: User ID doesn't exist
Solution:
1. Check user ID is correct
2. Get /users/count to verify user exists
3. Try GET /users to see all users

curl http://localhost:3000/users/999
# If 404: user doesn't exist
```

### 400 Bad Request
```
Problem: Invalid request body
Solution:
1. Check all required fields present
2. Verify data types correct
3. Check JSON syntax

// Wrong (empty object)
-d '{}'

// Correct (all required)
-d '{
  "username": "newuser",
  "email": "user@ex.com",
  "password": "pass123"
}'
```

### 500 Internal Server Error
```
Problem: Server error
Solution:
1. Check backend logs
2. Verify database connection
3. Check for syntax errors
4. Restart server if needed
```

---

## 📊 Performance Testing

### Load Test - Create Multiple Users
```bash
#!/bin/bash
TOKEN="your_token_here"

for i in {1..100}; do
  curl -X POST http://localhost:3000/users \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"username\": \"user$i\",
      \"email\": \"user$i@example.com\",
      \"password\": \"password123\",
      \"role\": \"staff\"
    }"
  echo "Created user $i"
done
```

### Load Test - Read All Users
```bash
#!/bin/bash
TOKEN="your_token_here"

time curl http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN" > /dev/null

# Check response time
```

---

## 📝 Postman Collection

### Import into Postman

```json
{
  "info": {
    "name": "User Management API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Users",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/users",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ]
      }
    },
    {
      "name": "Get User by ID",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/users/1",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ]
      }
    },
    {
      "name": "Create User",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/users",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"username\": \"newuser\",\n  \"email\": \"new@example.com\",\n  \"password\": \"password123\",\n  \"role\": \"staff\"\n}"
        }
      }
    },
    {
      "name": "Update User",
      "request": {
        "method": "PUT",
        "url": "{{baseUrl}}/users/1",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"role\": \"admin\",\n  \"status\": \"inactive\"\n}"
        }
      }
    },
    {
      "name": "Delete User",
      "request": {
        "method": "DELETE",
        "url": "{{baseUrl}}/users/1",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ]
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "token",
      "value": "your_jwt_token_here"
    }
  ]
}
```

---

## ✅ Test Checklist

- [ ] GET /users returns all users
- [ ] GET /users?search=... filters correctly
- [ ] GET /users?role=... filters by role
- [ ] GET /users?status=... filters by status
- [ ] GET /users/:id returns single user
- [ ] POST /users creates new user
- [ ] POST /users validates required fields
- [ ] POST /users prevents duplicate username
- [ ] PUT /users/:id updates user
- [ ] PUT /users/:id hashes password correctly
- [ ] DELETE /users/:id removes user
- [ ] GET /users/count returns correct count
- [ ] 401 returned without token
- [ ] 404 returned for non-existent user
- [ ] Password hashed in database
- [ ] Timestamp created correctly
- [ ] Status update works
- [ ] Role update works

---

**Happy Testing! 🚀**

**Last Updated**: 22/11/2025  
**API Version**: 1.0  
**Status**: ✅ Production Ready
