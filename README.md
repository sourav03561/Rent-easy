# RentEasy

RentEasy is a student accommodation rental platform that helps students discover, compare, and book PGs, hostels, and mess facilities. Property owners can create listings, manage rooms, and approve or reject booking requests.

This version focuses on the core web-service features and intentionally excludes payment gateways, microservices, Kafka, Elasticsearch, Kubernetes, Terraform, and other advanced infrastructure.

---

## Features

### Student

- Register and log in
- View and update profile
- Search accommodation listings
- Filter by city, property type, rent range, and gender policy
- View listing details and available rooms
- Submit booking requests
- View booking history
- Cancel pending bookings
- Submit ratings and reviews

### Property Owner

- Register and log in
- Create, update, and delete listings
- Add and manage rooms
- View booking requests
- Approve or reject bookings
- View owned listings

### Administrator

- Manage users
- Manage listings
- View and manage bookings
- Remove inappropriate listings or reviews

---

## Technology Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Tailwind CSS

### Backend

- Node.js
- Express.js
- TypeScript
- Supabase
- Supabase JavaScript Client
- JWT
- bcrypt
- Zod

### Development Tools

- Git
- GitHub
- Postman
- Supabase Studio

---

## Architecture

```text
React Frontend
      |
      | HTTP REST API
      v
Node.js + Express Backend
      |
      v
Supabase Database
```

The application follows a modular monolith architecture. Each business area is separated into its own backend module while running inside a single API application.

---

## Project Structure

```text
renteasy/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── listings/
│   │   │   ├── rooms/
│   │   │   ├── bookings/
│   │   │   └── reviews/
│   │   ├── middleware/
│   │   ├── config/
│   │   ├── common/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── routes/
│   │   └── types/
│   ├── package.json
│   └── .env.example
│
├── supabase/
│   └── schema.sql
└── README.md
```

---

## Core Modules

### Auth Module

Handles:

- User registration
- User login
- Password hashing
- JWT generation
- Authentication middleware
- Role-based authorization

### Users Module

Handles:

- Current-user profile
- Profile updates
- User administration

### Listings Module

Handles:

- Property creation
- Property updates
- Property deletion
- Public listing search
- Listing details
- Owner-scoped listing management

### Rooms Module

Handles:

- Room creation
- Room updates
- Room deletion
- Availability management

### Bookings Module

Handles:

- Booking requests
- Owner approval
- Owner rejection
- Student cancellation
- Room availability updates

### Reviews Module

Handles:

- Rating submission
- Review submission
- Listing review retrieval
- Duplicate-review prevention

---

## User Roles

| Role | Permissions |
|---|---|
| Student | Search listings, request bookings, cancel bookings, write reviews |
| Owner | Create listings, manage rooms, approve or reject bookings |
| Admin | Manage users, listings, bookings, and reviews |

---

## Database Design

### User

```text
id
name
email
passwordHash
phone
role
createdAt
updatedAt
```

### Listing

```text
id
ownerId
name
description
propertyType
genderPolicy
address
city
monthlyRent
amenities
imageUrl
createdAt
updatedAt
```

### Room

```text
id
listingId
roomNumber
roomType
capacity
availableBeds
rent
isAvailable
createdAt
updatedAt
```

### Booking

```text
id
studentId
listingId
roomId
startDate
endDate
status
createdAt
updatedAt
```

### Review

```text
id
studentId
listingId
rating
comment
createdAt
updatedAt
```

---

## Enums

### User Role

```text
STUDENT
OWNER
ADMIN
```

### Property Type

```text
PG
HOSTEL
MESS
```

### Gender Policy

```text
BOYS
GIRLS
CO_ED
ANY
```

### Booking Status

```text
PENDING
APPROVED
REJECTED
CANCELLED
COMPLETED
```

---

## API Endpoints

Base URL:

```text
http://localhost:3000/api
```

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Log in and receive a JWT |
| GET | `/users/me` | Get current user profile |
| PATCH | `/users/me` | Update current user profile |

### Listings

| Method | Endpoint | Description |
|---|---|---|
| GET | `/listings` | Get listings with filters |
| GET | `/listings/:id` | Get listing details |
| POST | `/listings` | Create a listing |
| PATCH | `/listings/:id` | Update a listing |
| DELETE | `/listings/:id` | Delete a listing |
| GET | `/owners/me/listings` | Get owner's listings |

Example search:

```http
GET /api/listings?city=Siliguri&type=PG&minRent=3000&maxRent=7000
```

### Rooms

| Method | Endpoint | Description |
|---|---|---|
| GET | `/listings/:listingId/rooms` | Get rooms of a listing |
| POST | `/listings/:listingId/rooms` | Add a room |
| PATCH | `/rooms/:roomId` | Update a room |
| DELETE | `/rooms/:roomId` | Delete a room |

### Bookings

| Method | Endpoint | Description |
|---|---|---|
| POST | `/bookings` | Create a booking request |
| GET | `/bookings/me` | Get student's bookings |
| GET | `/bookings/:id` | Get booking details |
| PATCH | `/bookings/:id/cancel` | Cancel a booking |
| GET | `/owners/me/bookings` | Get owner's booking requests |
| PATCH | `/bookings/:id/approve` | Approve a booking |
| PATCH | `/bookings/:id/reject` | Reject a booking |

### Reviews

| Method | Endpoint | Description |
|---|---|---|
| GET | `/listings/:listingId/reviews` | Get reviews |
| POST | `/listings/:listingId/reviews` | Submit a review |

---

## Booking Workflow

```text
Student selects a room
        |
        v
Backend checks availability
        |
        v
Booking created as PENDING
        |
        v
Owner reviews the request
        |
        +------ Approve
        |          |
        |          v
        |   availableBeds decreases
        |   booking becomes APPROVED
        |
        +------ Reject
                   |
                   v
            booking becomes REJECTED
```

A Supabase RPC or guarded update should be used while approving a booking to prevent two students from receiving the same last available bed.

---

## Example Requests

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Rahul Das",
  "email": "rahul@example.com",
  "password": "Password123",
  "role": "STUDENT"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "rahul@example.com",
  "password": "Password123"
}
```

### Create Listing

```http
POST /api/listings
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "name": "Green View Student PG",
  "description": "Affordable student accommodation near the college.",
  "propertyType": "PG",
  "genderPolicy": "BOYS",
  "address": "Sukna, Siliguri",
  "city": "Siliguri",
  "monthlyRent": 5500,
  "amenities": ["WiFi", "Food", "Laundry"]
}
```

### Create Room

```http
POST /api/listings/:listingId/rooms
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "roomNumber": "A-102",
  "roomType": "DOUBLE_SHARING",
  "capacity": 2,
  "availableBeds": 1,
  "rent": 5500
}
```

### Create Booking

```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "listingId": "listing-id",
  "roomId": "room-id",
  "startDate": "2026-08-01",
  "endDate": "2027-05-31"
}
```

### Submit Review

```http
POST /api/listings/:listingId/reviews
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "rating": 4,
  "comment": "Clean room and good location."
}
```

---

## Standard API Response

### Success

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

---

## Environment Variables

Create a `.env` file inside the backend directory.

```env
PORT=3000
NODE_ENV=development
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
JWT_SECRET="replace-with-a-strong-secret"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:5173"
```

Frontend `.env`:

```env
VITE_API_URL="http://localhost:3000/api"
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

Do not commit real secrets to GitHub.

---

## Local Setup

### Prerequisites

Install:

- Node.js 20 or later
- npm or pnpm
- Git
- Supabase project

### Clone the Repository

```bash
git clone <repository-url>
cd renteasy
```

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Create or verify the Supabase tables using `supabase/schema.sql` in the Supabase SQL Editor.

The backend should run at:

```text
http://localhost:3000
```

### Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend should run at:

```text
http://localhost:5173
```

---

## Available Scripts

### Backend

```bash
npm run dev
npm run build
npm start
npm run lint
npm test
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

---

## Security Requirements

- Hash passwords with bcrypt
- Generate JWTs only on the backend
- Validate requests with Zod
- Protect private routes with authentication middleware
- Restrict routes by user role
- Check listing ownership before updates or deletion
- Check booking ownership before cancellation
- Use the Supabase client instead of raw SQL in API handlers
- Configure CORS
- Use Helmet
- Add rate limiting to login and registration routes
- Store secrets in environment variables
- Validate image type and file size before upload

---

## Validation Rules

### Registration

- Name is required
- Email must be valid and unique
- Password must contain at least eight characters
- Role must be `STUDENT` or `OWNER`

### Listing

- Name, address, city, type, and rent are required
- Rent must be greater than zero
- Only the owner or an admin can update or delete the listing

### Room

- Capacity must be greater than zero
- Available beds cannot exceed capacity
- Rent must be greater than zero

### Booking

- Start date must be before end date
- Room must exist
- Room must have at least one available bed
- Student cannot approve their own booking
- Owner can only manage bookings for their own listings

### Review

- Rating must be between 1 and 5
- One student can review a listing only once
- Only students with an approved or completed booking should be allowed to review

---

## Testing

Recommended test cases:

- Student registration
- Owner registration
- Duplicate email registration
- Valid login
- Invalid login
- Access protected route without a token
- Owner creates a listing
- Student cannot create a listing
- Owner updates their own listing
- Owner cannot update another owner's listing
- Student creates a booking request
- Owner approves a booking
- Owner rejects a booking
- Student cancels a pending booking
- Duplicate booking is prevented
- Review submission
- Duplicate review is prevented
- Unauthorized admin access is rejected

---

## Development Plan

### Phase 1: Project Setup

- Initialize backend and frontend
- Configure Supabase
- Add validation and error handling
- Create the base folder structure

### Phase 2: Authentication

- Registration
- Login
- JWT authentication
- Profile management
- Role authorization

### Phase 3: Listings and Rooms

- Listing CRUD
- Room CRUD
- Search and filters
- Listing details page

### Phase 4: Booking System

- Booking requests
- Owner approval and rejection
- Student cancellation
- Room availability updates

### Phase 5: Reviews and Dashboards

- Ratings and reviews
- Student dashboard
- Owner dashboard
- Admin dashboard

### Phase 6: Testing and Deployment

- Unit tests
- API integration tests
- UI testing
- Deploy frontend and backend on simple hosting services

---

## Out of Scope

The following features are intentionally excluded from the basic version:

- Online payment gateway
- Kafka
- Elasticsearch
- Redis
- Microservices
- Kubernetes
- Terraform
- AWS infrastructure
- Prometheus monitoring
- Automated email notification service
- Complex CI/CD pipeline

These features can be added later after the core application is complete and stable.

---

## Future Improvements

- Add image uploads
- Add email notifications
- Add saved or favourite listings
- Add college-based search
- Add map and distance filters
- Add chat between students and owners
- Add owner verification
- Add report and moderation features
- Add pagination and sorting
- Add mobile application support

---

## License

This project is intended for academic and educational use.
