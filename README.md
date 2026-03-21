# NEU Laboratory Log System

A web and mobile app that logs professors' laboratory room usage at New Era University via QR code scanning.

---

## Live Demo
https://neu-lab-log-system.vercel.app/

## User Roles

### Professor
- Signs in using a `@neu.edu.ph` Google account
- Scans the QR code posted inside the laboratory room to log entry
- Alternatively, manually selects the room, subject, and class section to log entry
- Receives a confirmation message: *"Thank you for using [Room Number]"*
- Clicks **End Session** when done — session is recorded and they are automatically signed out
- Views personal usage statistics: total sessions, hours used, and most-used room
- Views the last 5 recent sessions in a table

### Admin
- Signs in using a designated `@neu.edu.ph` Google account listed as an administrator
- Monitors all laboratory rooms in real time (occupied or vacant)
- Views which professor is currently using a specific room
- Accesses each room's QR code (view full size or download as PNG)
- Views and searches activity logs by professor name, subject, class section, room, date, or time period (daily, weekly, monthly, or custom range)
- Manages professor accounts — can block or unblock access
- Views analytics: number of active logs, unique faculty count, blocked accounts, and a distribution chart showing usage frequency per room

---

## Features

### Professor Portal
- Google Sign-In restricted to `@neu.edu.ph` accounts
- QR code scanning for room check-in
- Manual log entry with room, subject, and class section fields
- End Session button with automatic sign-out
- Dashboard showing:
  - Usage statistics (sessions, hours, top room)
  - Profile card (name, email, sign-out)
  - Log entry card (scan or manual)
  - Recent sessions table (last 5 entries)

### Admin Portal
- Real-time dashboard with:
  - Active Logs count
  - Unique Faculty count
  - Blocked Accounts count
  - Computer Laboratory Distribution chart (usage per room, M101–M111)
  - Activity Logs table with search and date filter
- Room Management page:
  - Grid of all 11 lab rooms with pulsing status dot (green = vacant, red = occupied)
  - Click a room to open a detail panel with two tabs:
    - **Room tab** — shows vacant/occupied status and the current professor using the room
    - **Room QR code tab** — shows the room's QR code with View Full and Download PNG buttons
- Professor Directory:
  - Lists all professors with name, email, role, and account status
  - Admin can block or unblock professor accounts
- Light and dark mode across all pages
- Responsive layout for desktop and mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend & Auth | Firebase (Firestore, Authentication) |
| QR Code | qrcode.react |
| Hosting | Vercel |

---

## License

Personal academic project — New Era University. All rights reserved.
