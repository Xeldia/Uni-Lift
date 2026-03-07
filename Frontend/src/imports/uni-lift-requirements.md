EXECUTIVE SUMMARY
1.1 Project Overview 
Uni-Lift is a campus-locked, peer-to-peer ridesharing ecosystem designed exclusively for university students. The system integrates a Spring Boot backend API, a React web application for administrative oversight, and a native Android mobile application to provide a secure, verified, and cost-effective transportation network.
1.2 Objectives
Develop a fully functional e-commerce MVP with authentication, product catalog, shopping cart, and checkout
Implement a three-tier architecture using Spring Boot (backend), React (web), and Android (mobile)
Create RESTful APIs for communication between all system components
Design a responsive user interface that works consistently across web and mobile platforms
Deploy all system components to production-ready environments
1.3 Scope
Included Features:
User registration and authentication (email/password)
Product listing with search functionality
Shopping cart management (add, remove, update quantities)
Checkout process with shipping information collection
Order placement with confirmation
Admin panel for product management
Responsive web interface
Native Android mobile application
PostgreSQL database with relational schema
Excluded Features:
Real payment gateway integration
Product reviews and ratings system
Inventory management automation
Email notification system
Social media login integration
Push notifications
Advanced analytics dashboard

1.0 INTRODUCTION
1.1 Purpose
The purpose of Uni-Lift is to establish a peer to peer university ecosystem, that’s secure, cost effective, and a socially active transportation network catered to Universities. Unlike other rideshare server providers, Uni-Lift is a campus locked service. Catered only to student who are officially enrolled and verified within their respective institution. Access is strictly limited to verified students through the mandatory use of institutional .edu email addresses, ensuring that service stays within campus.

2.0 FUNCTIONAL REQUIREMENTS SPECIFICATION
2.1 Project Overview
Project Name: Uni-Lift (Campus-Locked Ride Share)
Domain: Transportation / Peer-to-Peer Economy
Primary Users: Students (Dual Role: Rider/Driver) and Campus Administrators
Problem Statement: Students lack a secure, affordable, and flexible transportation option that guarantees the safety of riding only with verified peers.
Solution: A closed-loop ride-sharing ecosystem where verified students can negotiate rides, share costs, and commute safely using cars or motorcycles.
2.2 Core User Journeys
Journey 1: Student Onboarding (Verification)
User downloads app and selects "Sign Up."
Enters University Email (.edu) and Student ID Number.
Submits profile for verification.
Admin/Campus Manager verifies credentials against school database.
User receives approval notification and gains access to the main interface.
Journey 2: Coordinating a Ride (The "Chat-First" Model)
Driver sets their status to "Active" and lists their vehicle (Car/Motor/Sidecar) and optional schedule/route.
Rider browses active drivers or searches for a route.
Rider initiates a Chat Request to the Driver.
Both parties negotiate details (Pickup point, Time, Cost: Free/Gas/Fee) within the chat.
Driver confirms the agreement and marks the ride as "Scheduled/Active."
Ride begins; "Ride Status" changes to "In-Transit" (Triggering safety protocols).
Journey 3: Emergency Situation (SOS)
During an active ride ("In-Transit" status), User feels unsafe or an accident occurs.
User taps the global SOS Button.
System automatically retrieves the user's Emergency Contact from the School Database.
Alert is sent to: Campus Security, Emergency Contact, and Local Emergency Services (Ambulance/Police).
Ride details (Driver ID, Vehicle, Location) are logged and sent to authorities.
2.3 Feature List (MoSCoW)
MUST HAVE (MVP)
Unified Authentication: .edu email + Student ID verification logic.
Dual-Role Switch: Toggle profile between "Rider" and "Driver" modes.
Vehicle Profile: Ability to register Cars, Single Motorcycles, and Tricycles (Sidecar).
Live Chat Interface: Real-time messaging for negotiation (Meetup, Cost, Route).
Ride State Management: Pending -> In-Transit -> Completed.
Safety/SOS Module: One-tap alert system integrated with Campus Data & Local Emergency.
SHOULD HAVE
Profile Schedules: Users can pin their recurring class/commute schedules to their profile.
Cost Calculator: Simple tool to suggest "Gas Money" splits based on distance.
Rating System: Peer reviews for Drivers and Riders (punctuality, safety).
COULD HAVE
Ride History: Log of past trips.
Saved Routes: Quick-select for "Home to Campus" or "Campus to Gym."
Filter by Gender: Option for users to prefer drivers/riders of the same gender.
WON'T HAVE
In-App Payment Gateway: Payments are handled via negotiation (Cash/External E-wallet) to simplify MVP.
Public Access: No guest accounts allowed.
2.4 Detailed Feature Specifications
Feature: Verification & Access Control
Screens: Sign Up, Pending Approval Screen, Admin Dashboard.
Fields: Full Name, Edu Email, Student ID, Vehicle Info (Optional).
Process: User submits -> Admin reviews ID/Email match -> Approve/Reject.
API Endpoints: POST /auth/register, POST /admin/verify-user.
Feature: Ride Negotiation (Chat)
Screens: Driver List, Chat Window.
Functions: Send message, Share location, "Confirm Deal" button (locks the ride details).
Data: Chat logs are retained for safety disputes.
API Endpoints: GET /drivers, POST /chat/message, POST /ride/create-agreement.
Feature: SOS & Safety
Screens: Active Ride Overlay (Always visible during trip).
Functions:
Silent Alert: Notify Admin/Contact only.
Active Alarm: Notify Police/Ambulance + Loud Alarm.
Data Integration: Pulls "Emergency Contact" field from the School Database API.
API Endpoints: POST /safety/sos-trigger, GET /user/emergency-contact.
2.5 Acceptance Criteria
AC-1: Verification Lockout
Given a user signs up with a non-.edu email
Then the system should immediately reject the registration
And display an error: "Institutional Email Required."
AC-2: Ride Agreement
Given a Rider and Driver are in a chat
When they agree on a pickup point and cost
And the Driver clicks "Start Ride"
Then the ride status updates to "In-Transit"
And the SOS button becomes active for both parties.
AC-3: Emergency Trigger
Given a ride is "In-Transit"
When the user holds the SOS button for 3 seconds
Then an SMS/Notification is sent to the School Security Dashboard
And an alert is sent to the user's stored Emergency Contact.

3.0 NON-FUNCTIONAL REQUIREMENTS
3.1 Performance Requirements
Real-Time Chat Latency: Messages between Driver and Rider must be delivered in ≤ 200ms (under normal 4G/LTE conditions) to ensure smooth negotiation.
GPS Location Updates:
Driver (In-Transit): Location update frequency of 3–5 seconds for accurate tracking.
Passenger (Browsing): Location update frequency of 30 seconds to conserve battery.
App Launch Time (Cold Start): ≤ 2 seconds on mid-range Android devices.
API Response Time: ≤ 500ms for 95% of general requests (login, profile view, search).
Concurrency: System must support at least 500 concurrent active users (based on peak dismissal times at CIT-U/University campuses).
3.2 Security & Privacy Requirements (Campus & Legal Compliance)
Data Privacy: Compliance with the Data Privacy Act of 2012 (Republic Act 10173) regarding the storage of student names, IDs, and movement history.
Authentication:
Session management via secure JWT (JSON Web Tokens).
Passwords hashed using Bcrypt (minimum salt rounds = 12).
Campus Verification:
Email verification restricted to specific domains (e.g., @cit.edu, @usc.edu.ph).
Manual admin approval capability for Student ID photo uploads.
Data Retention: Chat logs and Ride History are retained for 30 days for safety audits, then automatically archived or anonymized.
SOS Integrity: The "Emergency Trigger" must function even if the app is minimized (background process priority).
3.3 Compatibility Requirements
Mobile OS Support:
Android: Android 10.0 (API Level 29) and above (to support older student budget phones).
(Optional for MVP) iOS: iOS 15.0+.
Hardware Efficiency:
Must run smoothly on devices with 3GB RAM or higher.
Battery Optimization: Adaptive GPS usage (pauses high-frequency tracking when the vehicle is detected as "Stopped" for > 5 minutes).
Network: Functional on 3G/4G/LTE and Campus Wi-Fi; graceful degradation (offline mode) for viewing cached schedules if the signal is lost.
3.4 Usability & Accessibility
"One-Handed" Operation: Primary buttons (Accept Ride, SOS, Chat) placed within the bottom 40% of the screen for easy thumb access.
Clear Visibility: High-contrast map markers for distinct "Pickup Points" versus "Driver Location."
Feedback: Visual confirmation (e.g., a "Green Check") within 0.5 seconds of any booking action.
Language: Interface available in English (Standard) with potential for local dialect support (Cebuano) in chat/status presets.

4.0 SYSTEM ARCHITECTURE
┌─────────────────┐     ┌─────────────────┐
│   WEB CLIENT    │     │  MOBILE CLIENT  │
│(Admin Dashboard)│     │ (Rider/Driver)  │
│  • React (TS)   │     │  • Android      │
│  • Tailwind CSS │     │  • Kotlin       │
└───────┬─────────┘     └───────┬────┬────┘
        │                       │    │
        │           REST (HTTP) │    │ WebSocket (Real-time)
        │         ┌─────────────┘    │
        │         │                  │
┌───────▼─────────▼──────────────────▼──────┐
│             BACKEND SERVER                │
│             (Spring Boot)                 │
│  • REST Controller (Auth, Profiles)       │
│  • WebSocket Handler (Chat, GPS Tracking) │
│  • Verification Service (.edu logic)      │
└───────┬─────────┬──────────────────┬──────┘
        │         │                  │
┌───────▼──────┐  │          ┌───────▼──────┐
│   DATABASE   │  │          │ EXTERNAL APIs│
│ (PostgreSQL) │  │          │              │
│ • Users      │◄─┘          │ • Google Maps│
│ • Rides      │             │   (Routing)  │
│ • Chat Logs  │             │ • SMTP Server│
│ • PostGIS    │             │   (Email OTP)│
└──────────────┘             └──────────────┘




5.0 API CONTRACT & COMMUNICATION
5.1 API Standards
Base URL: https://api.uni-lift.edu/api/v1
Format: JSON for all requests/responses
Authentication: Bearer token (JWT) in Authorization header
Date Format: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
Response Structure:
{
  "success": boolean,
  "data": object|null,
  "error": {
    "code": string,
    "message": string,
    "details": object|null
  },
  "timestamp": string
}


5.0 API CONTRACT & COMMUNICATION
5.1 API Standards
Base URL: https://api.uni-lift.edu/api/v1
Format: JSON for all requests/responses
Authentication: Bearer token (JWT) in Authorization header
Date Format: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
Response Structure:
JSON
{
  "success": boolean,
  "data": object|null,
  "error": {
    "code": string,
    "message": string,
    "details": object|null
  },
  "timestamp": string
}

5.2 Endpoint Specifications
Authentication & Verification Endpoints
POST /auth/register Description: Initial sign-up. Must enforce .edu email validation logic.
Body: { "email": "student@cit.edu", "password": "...", "fullName": "..." }
Response: { "user": { "id", "email", "status": "PENDING_VERIFICATION" }, "token" }
POST /auth/login
Body: { "email", "password" }
Response: { "user": { "id", "name", "role", "isVerified" }, "token", "refreshToken" }
POST /auth/upload-id Description: Uploads student ID photo for Admin verification.
Headers: Content-Type: multipart/form-data
Body: { "file": (binary), "studentIdNumber": "string" }
Response: { "message": "ID submitted for review", "verificationId": "..." }
User Profile (Dual Role)
GET /users/profile
Response: { "user": { "id", "name", "email", "studentId", "currentRole": "RIDER|DRIVER", "emergencyContact": {...} } }
PUT /users/profile/role Description: Toggles the user between Rider and Driver modes.
Body: { "role": "DRIVER" }
Response: { "message": "Switched to Driver mode", "currentRole": "DRIVER" }
PUT /users/vehicle Description: Register or update vehicle details (Required for Drivers).
Body: { "type": "MOTORCYCLE|CAR|SIDECAR", "plateNumber": "...", "model": "..." }
Response: { "vehicle": { "id", "type", "isVerified" } }
Ride Negotiation (Chat-First Model)
GET /drivers/active Description: Riders search for active drivers currently accepting rides.
Query: ?lat=...&lng=...&radius=1000&vehicleType=MOTORCYCLE
Response: { "drivers": [ { "id", "name", "location": { "lat", "lng" }, "vehicle": {...} } ] }
POST /rides/negotiate Description: Initiates a chat session between Rider and Driver.
Body: { "driverId": "uuid", "initialMessage": "Heading to Main Campus?" }
Response: { "chatSession": { "id", "driverId", "riderId", "status": "OPEN" } }
POST /rides/confirm Description: Finalizes the agreement. Usually triggered by the Driver after negotiation.
Body: { "chatSessionId": "uuid", "riderId": "uuid", "pickupLocation": {...}, "dropoffLocation": {...}, "agreedPrice": 50.00 }
Response: { "ride": { "id", "status": "SCHEDULED", "trackingCode": "..." } }
Active Ride & Safety (SOS)
PUT /rides/{id}/status Description: Updates ride state (SCHEDULED -> IN_TRANSIT -> COMPLETED).
Body: { "status": "IN_TRANSIT" }
Response: { "ride": { "id", "status": "IN_TRANSIT", "startTime": "..." } }
POST /rides/{id}/location Description: Driver app pushes GPS updates (3-5s interval).
Body: { "lat": 10.3157, "lng": 123.8854, "speed": 40.5 }
Response: { "success": true }
POST /safety/sos-trigger Description: High-priority endpoint. Triggers alerts to Admin and Emergency Contacts.
Body: { "rideId": "uuid", "location": { "lat", "lng" }, "type": "SILENT|ALARM" }
Response: { "message": "Emergency protocols activated", "alertId": "..." }
Admin Endpoints
GET /admin/verifications Description: List users waiting for ID approval.
Query: ?status=PENDING
Response: { "requests": [ { "userId", "imageUrl", "studentIdNumber" } ] }
POST /admin/verifications/{userId}/approve
Body: { "approved": true, "adminNotes": "Verified against school DB" }
Response: { "message": "User approved" }
5.3 Error Handling
HTTP Status Codes
200 OK: Successful request.
201 Created: Resource created (Ride confirmed, User registered).
400 Bad Request: Validation failed (Invalid coordinates, Missing fields).
401 Unauthorized: Invalid JWT or expired session.
403 Forbidden: User is not verified or accessing Admin routes.
406 Not Acceptable: Ride negotiation rejected.
429 Too Many Requests: Spamming the SOS or Chat endpoints.
500 Internal Server Error: Server error.
{
  "success": false,
  "data": null,
  "error": {
    "code": "AUTH-004",
    "message": "Registration Restricted",
    "details": "Email domain must be a valid .edu address"
  },
  "timestamp": "2024-02-07T10:30:00Z"
}
{
  "success": false,
  "data": null,
  "error": {
    "code": "RIDE-002",
    "message": "Ride Creation Failed",
    "details": "Driver is already in an active 'IN_TRANSIT' status"
  },
  "timestamp": "2024-02-07T10:35:00Z"
}
Common Error Codes
AUTH-001: Invalid credentials
AUTH-004: Invalid Email Domain (Non-.edu)
VERIFY-001: Account not yet approved by Admin
RIDE-001: Driver unavailable
RIDE-002: Concurrent ride conflict
SAFE-001: GPS signal lost during SOS
DB-001: Resource not found

6.0 DATABASE DESIGN
6.1 Entity Relationship Diagram
Note: This ERD represents the core flows of Verification, Vehicle Management, and the "Chat-First" Ride Negotiation.
VERIFICATIONS (1) ──── (1) USERS (1) ──── (*) VEHICLES
                            │
                            │
                  (*) ──────┴────── (*)
                   │                 │
                   │                 │
             CHAT_SESSIONS (1) ── (*) MESSAGES
                   │
                   │ (1)
                   │
                 RIDES (1) ──── (0..1) SOS_LOGS
Detailed Relationships
One-to-One: User $\leftrightarrow$ Verification (Each user has one verification record for their .edu/Student ID).
One-to-Many: User $\rightarrow$ Vehicles (A driver can register multiple vehicles, e.g., a motorcycle and a car).
One-to-Many: User $\rightarrow$ ChatSessions (A user can have multiple active negotiations).
One-to-Many: ChatSession $\rightarrow$ Messages (A chat log contains many individual messages).
One-to-One: ChatSession $\leftrightarrow$ Ride (A successful negotiation in a chat session creates exactly one scheduled ride).
One-to-One: Ride $\rightarrow$ SOS_Log (An emergency trigger creates a specific safety log for that ride instance).
Key Tables
users: Central identity for both Riders and Drivers (stores authentication and roles).
verifications: Holds sensitive student ID data and approval status from Admins.
vehicles: Stores details of cars/motorcycles registered by Drivers.
chat_sessions: The temporary "room" where Riders and Drivers negotiate.
rides: The finalized transaction containing agreed price, route, and status.
sos_logs: Immutable audit trail for safety incidents.
Table Structure Summary
users: id, edu_email, password_hash, full_name, role (RIDER/DRIVER), is_verified, emergency_contact_id
verifications: id, user_id, student_id_number, id_photo_url, admin_status, reviewed_by
vehicles: id, owner_id, type (CAR/MOTO), plate_number, model, color, is_active
chat_sessions: id, rider_id, driver_id, created_at, status (OPEN/AGREED/ARCHIVED)
messages: id, session_id, sender_id, content, timestamp
rides: id, chat_session_id, driver_id, rider_id, status (SCHEDULED/IN_TRANSIT/DONE), pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, agreed_price
sos_logs: id, ride_id, triggered_at, location_lat, location_lng, resolved_status



7.0 UI/UX DESIGN
7.1 Web Application Wireframes

UI design:
https://app.visily.ai/projects/4ea5ca1e-285d-4285-9703-3bb53db9c1f0/boards/2482663
Login/Register Page
Header: Centered "Uni-Lift" Logo with "Hat" icon.
Subtitle: "Campus rides, simplified. Secure & verified."
Auth Card:
Toggle Tabs: [Login] / [Register]
Input Fields: Full Name, Student ID (Numeric), University Email (.edu placeholder), Password.
Security Notice: "Verification required. Your student status will be verified before you can use the service."
Action Button: "Create Account" (Black, full width).
Footer: "Protected by University Authentication Protocol" badge.
Website

Mobile



Home Page (Rider View)
Top Navigation:
Brand Logo (Top Left)
Role Switcher: "Mode: Rider" indicator with [Switch to Driver] button.
Logout Icon.
Hero Section: Large banner with greeting "Where to today?" and subtext "Safe, verified rides across campus and beyond."
Ride Request Card (Left Panel):
Pickup Location: Input field with current location icon (Default: "Current Location").
Dropoff Location: Searchable input field (e.g., "Science Block").
Action Button: [Find a Driver] (Primary Black Button).
Activity Panel (Right Panel):
Status Card: Displays "No active rides" or current trip status.






















Website

Mobile



Driver Dashboard (Active Mode)
Status Toggle: [Go Online/Offline]
Vehicle Display: Shows currently registered vehicle (e.g., "Toyota Wigo - ABC 1234").
Request Feed: List of nearby ride requests (Rider Name, Distance, Destination).
Earnings Summary: Daily total (e.g., "₱150.00 earned today").
Chat & Negotiation Interface
Split View: Map (Left) / Chat Window (Right).
Chat Header: Driver/Rider Name + Reputation Score.
Message Area: Bubble-style chat for negotiating price.
Action Bar:
Input field for custom offer.
[Accept Offer] / [Decline] buttons.
[Confirm Ride] (Locks the agreement





7.2 Mobile Application Wireframes
Bottom Navigation [🏠 Home] [💬 Chats] [🛡️ Safety] [👤 Profile]
Mobile Home Screen (Rider)
Map View: Full-screen map showing current location.
Floating Card (Bottom): "Where to?" search bar.
Quick Filters: Pills for [Motorcycle], [Car], [Carpool].
Swipe Gestures: Swipe up to see saved places (e.g., "Main Campus", "Dorm").
Active Ride Screen (In-Transit)
Header: Driver Name, Vehicle Plate #, Estimated Time of Arrival.
Live Map: Real-time route tracking.
Safety Overlay (Always Visible):
SOS Button: Red floating action button (Hold 3s to trigger).
[Share Trip] icon.
Bottom Sheet: Trip details and [Cancel Ride] option.
Mobile Checkout/Summary (Post-Ride)
Trip Summary: Route map snapshot, Total Distance, Final Agreed Price.
Rating System: 5-Star input for Peer Review.
Feedback: "How was your ride?" text area.
Button: [Complete & Close].
Design System
Colors:
Primary: Midnight Black (#000000) - Used for primary buttons and headers.
Background: Off-White (#F9FAFB) - Main app background.
Accent/Status:
Green (#10B981) - "Go Online" / Verified.
Red (#EF4444) - SOS / Error.
Blue (#2563EB) - Links / Info.
Typography:
Headings: Serif (e.g., "Uni-Lift", "Where to today?") - Conveying academic/institutional trust.
Body/UI: Monospace or Sans-Serif (e.g., Input fields, Buttons) - For readability and technical feel.
Components:
Cards: White background, subtle shadow, rounded corners (12px).
Inputs: Outlined text fields with inner icons.
Buttons: Rectangular with slightly rounded corners (4px), high contrast.
Responsive Strategy:
Desktop: Split-screen layout (Map + Dashboard).
Mobile: Map-first interface with bottom sheets for interaction.

8.0 PLAN
8.1 Project Timeline
Phase 1: Planning & Design (Week 1-2)
Week 1: Requirements & Architecture
Day 1-2: Project setup, repository initialization, and documentation standards.
Day 3-4: Finalize Functional (FRS) and Non-Functional (NFR) requirements, specifically safety protocols.
Day 5-7: System architecture design (WebSocket strategy, PostGIS integration).
Week 2: Detailed Design
Day 1-2: API specification (Auth, Chat, Ride Status endpoints).
Day 3-4: Database schema design (Users, Vehicles, Chat Logs, Geolocation).
Day 5-6: UI/UX wireframes (Mobile App flows & Admin Dashboard).
Day 7: Implementation plan finalization and technology stack lock.
Phase 2: Backend Development (Week 3-4)
Week 3: Foundation & Identity
Day 1: Spring Boot setup with Security and JWT dependencies.
Day 2: Database configuration (PostgreSQL) and Entity creation.
Day 3: Authentication logic (Edu email validation & Password hashing).
Day 4: User Profile endpoints (Role switching: Rider/Driver).
Day 5: Vehicle management CRUD (Register/Update vehicle details).
Week 4: Core Real-Time Features
Day 1: WebSocket configuration for real-time Chat.
Day 2: Ride State Machine logic (Request -> Negotiate -> In-Transit).
Day 3: GPS Location handling and basic geospatial queries.
Day 4: SOS/Emergency trigger endpoints and notification logic.
Day 5: API documentation (Swagger/OpenAPI) and Unit Testing.
Phase 3: Web Application (Admin Dashboard) (Week 5-6)
Week 5: Frontend Foundation
Day 1: React setup with TypeScript and Tailwind CSS.
Day 2: Admin Authentication pages.
Day 3: Verification Queue interface (View pending Student IDs).
Day 4: User management (Approve/Reject logic).
Day 5: Dashboard overview (Active users, Total rides stats).
Week 6: Advanced Admin Features
Day 1: Dispute Management interface (View reported rides).
Day 2: Chat Log viewer for safety audits.
Day 3: SOS Alert Monitor (Real-time dashboard notifications).
Day 4: Responsive design polish.
Day 5: Integration testing with Backend API.
Phase 4: Mobile Application (Rider/Driver) (Week 7-8)
Week 7: Android Foundation
Day 1: Android Studio setup, Kotlin project structure, and Navigation Graph.
Day 2: Authentication screens and ID upload implementation.
Day 3: Map Integration (Google Maps SDK) and Location Permissions.
Day 4: Home Screen (Rider view) and Driver "Go Online" toggle.
Day 5: API Service layer integration (Retrofit/OkHttp).
Week 8: Complete Mobile App
Day 1: Chat Interface implementation (WebSocket client).
Day 2: Ride Negotiation flow (Accept/Decline offers).
Day 3: "In-Transit" mode and SOS Button overlay.
Day 4: UI polish, animations, and Dark Mode support.
Day 5: APK generation and device testing.
Phase 5: Integration & Deployment (Week 9-10)
Week 9: Integration Testing
Day 1: End-to-end testing (Simulating full Ride lifecycle).
Day 2: Real-time latency checks (Chat & GPS updates).
Day 3: Security review (Data privacy, JWT expiration).
Day 4: Performance testing (Concurrent user simulation).
Day 5: User Guide and Admin Manual creation.
Week 10: Deployment
Day 1: Backend deployment (Cloud provider/School Server).
Day 2: Web Admin deployment.
Day 3: Mobile APK distribution (Internal testing channel).
Day 4: Final "Smoke Test" in production environment.
Day 5: Project submission and presentation prep.
Milestones
M1 (End Week 2): All design documents and API contracts complete.
M2 (End Week 4): Backend API fully functional with WebSocket support.
M3 (End Week 6): Admin Web Dashboard ready for user verification.
M4 (End Week 8): Mobile Application feature-complete (Ride & Chat).
M5 (End Week 10): Full system deployed, integrated, and stress-tested.
Critical Path
Authentication & Verification System (Week 3): Users cannot enter without this.
WebSocket Chat Infrastructure (Week 4): The core negotiation mechanism.
Admin Verification Portal (Week 5): Required to approve the first batch of users.
Mobile Map Integration (Week 7): Essential for location-based context.
Cross-Platform Integration (Week 9): Ensuring Mobile and Backend sync perfectly.
Risk Mitigation
GPS Inaccuracy: Implement "approximate location" fallback and manual text entry for pickup points.
Connectivity Issues: Cache ride details locally so users can view active trip info even if offline.
Verification Bottleneck: Allow "Pre-verified" status for testers to proceed with development without waiting for Admin UI.
Chat Latency: Use standard HTTP polling as a backup if WebSockets fail on campus Wi-Fi.



