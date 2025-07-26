# ReWare Server API Documentation

This document provides detailed information about the API endpoints available in the ReWare Server application.

## User Routes

### Register User

**Route Endpoint**: `/api/users/register`  
**Request Method**: POST  
**Authentication**: None

**Expected Request Body**:

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "address": "string",
  "gender": "string",
  "dateOfBirth": "date"
}
```

**Response Format**:

- Success (201):
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "firstName": "string",
      "lastName": "string"
    }
  }
  ```
- Error (400/500): `{ "message": "Error message" }`

**Data Handling**:

- Validates user input fields
- Checks for existing email
- Creates new user in database
- Generates JWT token
- Sets HTTP-only cookie

**Frontend Impact**:

- Store user data in application state
- Redirect to dashboard/home page
- Show success message
- No need to handle token storage (handled by HTTP-only cookie)

---

### Login User

**Route Endpoint**: `/api/users/login`  
**Request Method**: POST  
**Authentication**: None

**Expected Request Body**:

```json
{
  "email": "string",
  "password": "string"
}
```

**Response Format**:

- Success (200):
  ```json
  {
    "message": "Login successful",
    "user": {
      "firstName": "string",
      "lastName": "string",
      "_id": "string"
    }
  }
  ```
- Error (401/500): `{ "error": "Error message" }`

**Data Handling**:

- Validates credentials
- Compares password hash
- Generates JWT token
- Sets HTTP-only cookie

**Frontend Impact**:

- Store user data in application state
- Redirect to dashboard/home
- Show success/error messages
- No need to handle token storage (handled by HTTP-only cookie)

---

### Check Login Status

**Route Endpoint**: `/api/users/login`  
**Request Method**: GET  
**Authentication**: Required (via cookie token)

**Expected Request Body**: None

**Response Format**:

- Success (200):
  ```json
  {
    "message": "Login successful",
    "user": {
      "firstName": "string",
      "lastName": "string",
      "_id": "string"
    }
  }
  ```
- Error (401/403): `{ "error": "Error message" }`

**Data Handling**:

- Verifies JWT token from cookie
- Fetches user data

**Frontend Impact**:

- Use for session persistence
- Auto-login functionality
- Route protection verification

---

### Get User Profile

**Route Endpoint**: `/api/users/`  
**Request Method**: GET  
**Authentication**: Required

**Expected Request Body**: None

**Response Format**:

- Success (200):
  ```json
  {
    "message": "User details fetched successfully",
    "user": {
      "_id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string",
      "address": "string",
      "gender": "string",
      "dateOfBirth": "date",
      "profilePhoto": "string",
      "role": "string",
      "wishlist": "array",
      "conversations": "array",
      "notifications": "array",
      "points": "number",
      "waterSaved": "number",
      "co2Saved": "number"
    }
  }
  ```

**Data Handling**:

- Fetches complete user profile
- Excludes sensitive data (password)

**Frontend Impact**:

- Display user profile information
- Populate profile edit forms
- Show user statistics and achievements

---

### Update User Profile

**Route Endpoint**: `/api/users/`  
**Request Method**: PUT  
**Authentication**: Required

**Expected Request Body**: FormData with:

```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "address": "string",
  "gender": "string",
  "dateOfBirth": "date",
  "file": "File (optional, for profile photo)"
}
```

**Response Format**:

- Success (200):
  ```json
  {
    "message": "Update successful",
    "user": {
      "firstName": "string",
      "lastName": "string",
      "_id": "string"
    }
  }
  ```

**Data Handling**:

- Updates user profile
- Handles profile photo upload to Cloudinary
- Prevents updating of protected fields

**Frontend Impact**:

- Show success/error messages
- Update user profile display
- Reset form after successful update

---

### Add to Wishlist

**Route Endpoint**: `/api/users/wishlist`  
**Request Method**: PUT  
**Authentication**: Required

**Expected Request Params**: `?productId=string`

**Response Format**:

- Success (200): `{ "message": "Product added to wishlist" }`
- Error (400/409): `{ "message": "Error message" }`

**Data Handling**:

- Adds product to user's wishlist
- Prevents duplicate entries

**Frontend Impact**:

- Update wishlist UI
- Show success/error messages
- Update wishlist counter if present

---

### Remove from Wishlist

**Route Endpoint**: `/api/users/wishlist`  
**Request Method**: DELETE  
**Authentication**: Required

**Expected Request Params**: `?productId=string`

**Response Format**:

- Success (200): `{ "message": "Product removed from wishlist" }`

**Data Handling**:

- Removes product from user's wishlist

**Frontend Impact**:

- Update wishlist UI
- Show success message
- Update wishlist counter if present

---

### Get Wishlist

**Route Endpoint**: `/api/users/wishlist`  
**Request Method**: GET  
**Authentication**: Required

**Expected Request Body**: None

**Response Format**:

- Success (200):
  ```json
  {
    "wishlist": [
      {
        "_id": "string"
        // product details without customer, createdAt, and updatedAt
      }
    ]
  }
  ```

**Data Handling**:

- Fetches all products in user's wishlist
- Sorts by creation date (newest first)

**Frontend Impact**:

- Display wishlist items
- Show empty state if wishlist is empty
- Enable product interaction from wishlist

## Product Routes

### Get All Products

**Route Endpoint**: `/api/products/`  
**Request Method**: GET  
**Authentication**: None

**Expected Request Body**: None

**Response Format**:

- Success (200):
  ```json
  {
    "products": [
      {
        "_id": "string",
        "title": "string",
        "description": "string",
        "brand": "string",
        "category": "string",
        "images": ["string"],
        "carbonFootprint": "number",
        "waterUsage": "number"
      }
    ]
  }
  ```
- Error (500): `{ "error": "Internal server error" }`

**Data Handling**:

- Fetches all products from database
- Excludes customer, createdAt, and updatedAt fields
- Sorts by creation date (newest first)

**Frontend Impact**:

- Display products in a grid/list view
- Show product details
- Enable product interactions

---

### Add New Product

**Route Endpoint**: `/api/products/`  
**Request Method**: POST  
**Authentication**: Required

**Expected Request Body**: FormData with:

```json
{
  "title": "string",
  "description": "string",
  "brand": "string",
  "category": "string",
  "images": "File[] (multiple images)"
  // other product details
}
```

**Response Format**:

- Success (201):
  ```json
  {
    "message": "Product created successfully",
    "product": {
      "_id": "string",
      "title": "string",
      "description": "string",
      "brand": "string",
      "category": "string",
      "images": ["string"],
      "carbonFootprint": "number",
      "waterUsage": "number"
    }
  }
  ```
- Error (500): `{ "error": "Internal Server Error" }`

**Data Handling**:

- Validates product fields
- Uploads images to Cloudinary
- Makes ML prediction for carbon footprint and water usage
- Creates new product in database

**Frontend Impact**:

- Show success/error messages
- Redirect to product page
- Update product listing
- Display upload progress for images

---

### Delete Product

**Route Endpoint**: `/api/products/`  
**Request Method**: DELETE  
**Authentication**: Required

**Expected Request Params**: `?productId=string`

**Response Format**:

- Success (200): `{ "message": "Product deleted successfully" }`
- Error (400): `{ "error": "Invalid product ID" }`
- Error (403): `{ "error": "Unauthorized to delete this product" }`
- Error (404): `{ "error": "Product not found" }`

**Data Handling**:

- Validates product ID
- Checks user ownership
- Deletes product from database

**Frontend Impact**:

- Remove product from UI
- Show success/error messages
- Update product listing

---

### Search Products

**Route Endpoint**: `/api/products/search`  
**Request Method**: GET  
**Authentication**: None

**Expected Request Params**: `?searchQuery=string`

**Response Format**:

- Success (200):
  ```json
  {
    "products": [
      {
        "_id": "string",
        "title": "string",
        "description": "string"
        // other product fields
      }
    ]
  }
  ```
- Error (400): `{ "error": "Search query is required" }`

**Data Handling**:

- Performs case-insensitive search on title and description
- Excludes customer, createdAt, and updatedAt fields
- Sorts by creation date (newest first)

**Frontend Impact**:

- Display search results
- Update product listing
- Show empty state if no results
- Enable search functionality

---

### Get Product by ID

**Route Endpoint**: `/api/products/byId`  
**Request Method**: GET  
**Authentication**: None

**Expected Request Params**: `?productId=string`

**Response Format**:

- Success (200):
  ```json
  {
    "products": {
      "_id": "string",
      "title": "string",
      "description": "string"
      // other product fields
    }
  }
  ```
- Error (400): `{ "error": "Search query is required" }`
- Error (404): `{ "error": "Product not found" }`

**Data Handling**:

- Fetches specific product by ID
- Excludes customer, createdAt, and updatedAt fields

**Frontend Impact**:

- Display detailed product view
- Show error messages if product not found
- Enable product interactions

## Transaction Routes

### Get User Transactions

**Route Endpoint**: `/api/transactions/`  
**Request Method**: GET  
**Authentication**: Required

**Expected Request Body**: None

**Response Format**:

- Success (200):
  ```json
  {
    "transactions": [
      {
        "_id": "string",
        "product": "string",
        "owner": "string",
        "customer": "string",
        "status": "string"
        // other transaction fields excluding onetimePasscode
      }
    ]
  }
  ```
- Error (500): `{ "message": "Server error", "error": "error message" }`

**Data Handling**:

- Fetches all transactions where user is either owner or customer
- Excludes sensitive OTP data
- Returns transactions sorted by date

**Frontend Impact**:

- Display transaction history
- Show transaction status
- Enable transaction management

---

### Process Transaction

**Route Endpoint**: `/api/transactions/`  
**Request Method**: PUT  
**Authentication**: Required

**Expected Request Body**:

```json
{
  "transactionId": "string",
  "onetimePasscode": "string" // Required only for owner verification
}
```

**Response Format**:

- For Customer (OTP Generation):
  - Success (200): `{ "message": "OTP generated", "otpId": "string" }`
- For Owner (Transaction Completion):
  - Success (200): `{ "message": "Exchange successful" }`
- Error Cases:
  - 400: `{ "message": "Invalid or already processed transaction" }`
  - 400: `{ "message": "Invalid or mismatched OTP" }`
  - 400: `{ "message": "Product not available" }`
  - 400: `{ "message": "Customer has insufficient points" }`
  - 403: `{ "message": "Unauthorized: Not part of this transaction" }`

**Data Handling**:

- For Customer:
  - Generates new OTP if none exists
  - Associates OTP with transaction
- For Owner:
  - Verifies OTP
  - Checks product availability
  - Validates points balance
  - Transfers points between users
  - Updates product status
  - Updates transaction status

**Frontend Impact**:

- Show OTP to customer
- Enable OTP input for owner
- Update transaction status
- Show success/error messages
- Update points balance display
- Update product availability

---

### Cancel Transaction

**Route Endpoint**: `/api/transactions/`  
**Request Method**: DELETE  
**Authentication**: Required

**Expected Request Body**:

```json
{
  "transactionId": "string"
}
```

**Response Format**:

- Success (200): `{ "message": "Transaction cancelled successfully" }`
- Error Cases:
  - 404: `{ "message": "Transaction not found" }`
  - 400: `{ "message": "Only pending transactions can be cancelled" }`
  - 403: `{ "message": "Unauthorized to cancel this transaction" }`

**Data Handling**:

- Validates transaction exists
- Checks transaction status
- Verifies user authorization
- Updates transaction status to cancelled

**Frontend Impact**:

- Update transaction status
- Show success/error messages
- Update transaction listing
- Enable/disable cancel button based on status

## Request Routes

### Get All Requests

**Route Endpoint**: `/api/requests/all`  
**Request Method**: GET  
**Authentication**: Required

**Expected Request Body**: None

**Response Format**:

- Success (200): Array of request objects
  ```json
  [
    {
      "_id": "string",
      "owner": "string",
      "customer": "string",
      "product": "string",
      "status": "string",
      "transactionId": "string",
      "createdAt": "date"
    }
  ]
  ```
- Error (404): `{ "message": "No requests found" }`
- Error (500): `{ "message": "Server error", "error": "error message" }`

**Data Handling**:

- Fetches all requests where user is either owner or customer
- Sorts by creation date (newest first)

**Frontend Impact**:

- Display requests list
- Show request status
- Enable request management
- Show empty state if no requests

---

### Get Single Request

**Route Endpoint**: `/api/requests/`  
**Request Method**: GET  
**Authentication**: Required

**Expected Request Params**: `?requestId=string`

**Response Format**:

- Success (200): Single request object
  ```json
  {
    "_id": "string",
    "owner": "string",
    "customer": "string",
    "product": "string",
    "status": "string",
    "transactionId": "string",
    "createdAt": "date"
  }
  ```
- Error (404): `{ "message": "Request not found or access denied" }`

**Data Handling**:

- Fetches specific request by ID
- Verifies user authorization

**Frontend Impact**:

- Display request details
- Show request status
- Enable request actions based on status

---

### Create Request

**Route Endpoint**: `/api/requests/`  
**Request Method**: POST  
**Authentication**: Required

**Expected Request Body**:

```json
{
  "productId": "string"
}
```

**Response Format**:

- Success (201):
  ```json
  {
    "message": "Request created successfully",
    "request": "string" // request ID
  }
  ```
- Error (400): `{ "message": "Missing required fields" }`
- Error (404): `{ "message": "Product not found" }`

**Data Handling**:

- Validates product exists
- Creates new request with pending status
- Associates request with product owner and customer

**Frontend Impact**:

- Show success/error messages
- Update requests list
- Enable request tracking

---

### Accept Request

**Route Endpoint**: `/api/requests/accept`  
**Request Method**: PUT  
**Authentication**: Required

**Expected Request Params**: `?requestId=string`

**Response Format**:

- Success (200):
  ```json
  {
    "message": "Request accepted and transaction created",
    "transactionId": "string"
  }
  ```
- Error Cases:
  - 404: `{ "message": "Request not found" }`
  - 403: `{ "message": "Unauthorized: Not the product owner" }`
  - 400: `{ "message": "Request already processed" }`
  - 409: `{ "message": "A pending transaction already exists for this product" }`

**Data Handling**:

- Validates request exists and is pending
- Verifies user is product owner
- Creates new transaction
- Updates request status
- Links transaction to request

**Frontend Impact**:

- Update request status
- Show transaction details
- Enable transaction flow
- Show success/error messages

---

### Reject Request

**Route Endpoint**: `/api/requests/reject`  
**Request Method**: PUT  
**Authentication**: Required

**Expected Request Params**: `?requestId=string`

**Response Format**:

- Success (200): `{ "message": "Request Rejected" }`
- Error Cases:
  - 404: `{ "message": "Request not found" }`
  - 403: `{ "message": "Unauthorized: Not the product owner" }`
  - 400: `{ "message": "Request already processed" }`

**Data Handling**:

- Validates request exists and is pending
- Verifies user is product owner
- Updates request status to rejected

**Frontend Impact**:

- Update request status
- Show rejection message
- Update request list
- Enable appropriate actions

---

### Cancel Request

**Route Endpoint**: `/api/requests/cancel`  
**Request Method**: PUT  
**Authentication**: Required

**Expected Request Params**: `?requestId=string`

**Response Format**:

- Success (200): `{ "message": "Request Rejected" }`
- Error Cases:
  - 404: `{ "message": "Request not found" }`
  - 403: `{ "message": "Unauthorized: Not the product owner" }`
  - 400: `{ "message": "Request already processed" }`

**Data Handling**:

- Validates request exists and is pending
- Verifies user is request customer
- Updates request status to cancelled

**Frontend Impact**:

- Update request status
- Show cancellation message
- Update request list
- Disable further actions on request

## WebSocket Events

The chat functionality is implemented using WebSocket connections. The WebSocket server is available at `/ws?userId=<userId>`.

### Connection

- **URL**: `/ws?userId=<userId>`
- **Authentication**: Required (userId parameter)
- **Connection Validation**:
  - Validates origin
  - Verifies user exists
  - Maintains active connection in clients map

### Event Types

#### Send Message

**Event**: `SEND_MESSAGE`  
**Direction**: Client → Server  
**Payload**:

```json
{
  "type": "SEND_MESSAGE",
  "payload": {
    "conversationId": "string",
    "text": "string"
  }
}
```

**Response Events**:

- Success:
  ```json
  {
    "type": "MESSAGE_SENT",
    "payload": {
      "messageId": "string",
      "conversationId": "string"
    }
  }
  ```
- For Receiver:
  ```json
  {
    "type": "NEW_MESSAGE",
    "payload": {
      // message object
    }
  }
  ```
- Error:
  ```json
  {
    "type": "ERROR",
    "payload": "error message"
  }
  ```

#### Mark Message as Seen

**Event**: `MARK_SEEN`  
**Direction**: Client → Server  
**Payload**:

```json
{
  "type": "MARK_SEEN",
  "payload": {
    "messageId": "string"
  }
}
```

**Response Event**:

```json
{
  "type": "SEEN_CONFIRMED",
  "payload": {
    "messageId": "string"
  }
}
```

#### Get Messages History

**Event**: `GET_MESSAGES`  
**Direction**: Client → Server  
**Payload**:

```json
{
  "type": "GET_MESSAGES",
  "payload": {
    "conversationId": "string"
  }
}
```

**Response Event**:

```json
{
  "type": "MESSAGES_HISTORY",
  "payload": {
    "conversationId": "string",
    "messages": [
      {
        "_id": "string",
        "text": "string",
        "sender": {
          "_id": "string",
          "firstName": "string",
          "lastName": "string"
        },
        "createdAt": "date"
      }
    ]
  }
}
```

#### Get Conversations List

**Event**: `GET_CONVERSATIONS`  
**Direction**: Client → Server  
**Payload**:

```json
{
  "type": "GET_CONVERSATIONS"
}
```

**Response Event**:

```json
{
  "type": "CONVERSATIONS_LIST",
  "payload": {
    "conversations": [
      {
        "_id": "string",
        "updatedAt": "date",
        "receiver": {
          "_id": "string",
          "name": "string"
        },
        "lastMessage": {
          "text": "string",
          "createdAt": "date"
        }
      }
    ]
  }
}
```

#### Get/Create Single Conversation

**Event**: `GET_CONVERSATION`  
**Direction**: Client → Server  
**Payload**:

```json
{
  "type": "GET_CONVERSATION",
  "payload": {
    "receiverIdPay": "string",
    "productId": "string" // Optional, to get conversation with product owner
  }
}
```

**Response Event**:

```json
{
  "type": "SINGLE_CONVERSATION",
  "payload": {
    "_id": "string",
    "updatedAt": "date",
    "receiver": {
      "_id": "string",
      "name": "string"
    }
  }
}
```

#### Keep-Alive

**Event**: `PING`  
**Direction**: Client → Server  
**Response Event**:

```json
{
  "type": "PONG"
}
```

### Error Handling

All events can return an error response in the following format:

```json
{
  "type": "ERROR",
  "payload": "error message"
}
```

### Frontend Implementation Notes

1. **Connection Management**:

   - Establish connection with user ID
   - Handle reconnection on disconnection
   - Implement ping/pong for connection health

2. **Message Handling**:

   - Display messages in real-time
   - Show message status (sent/seen)
   - Handle offline messages on reconnection

3. **UI Considerations**:
   - Show online/offline status
   - Display typing indicators
   - Show message timestamps
   - Handle message failures gracefully
   - Implement retry mechanism for failed messages
