# **App Name**: NEU LabTrack

## Core Features:

- Secure Institutional Authentication: User authentication via institutional Google-based emails (domain-restricted) using Firebase Authentication.
- Firestore User & Role Management: Management of user profiles in a Firestore 'Users' collection, including UID, Name, Email, Role ('Professor', 'Admin'), 'QR_String' (for professor ID), and 'Blocked' status.
- Role-Based Access & Redirection: After login, users are automatically redirected to their appropriate dashboard based on their assigned 'Role' and 'Blocked' status stored in Firestore. This ensures admins can access their dedicated dashboard.
- Room QR Code Scanning & Session Logging: Allows authenticated professors to scan room-specific QR codes to initiate a lab usage session. Upon scanning, a log entry is created in a 'Room_Logs' collection with Professor ID, Room ID, Timestamp (start), and Status (Active). This feature also manages session termination upon professor sign-out and includes logic to prevent immediate duplicate scans.
- Manual Lab Usage Entry: Professors have the option to manually select a laboratory/room from a dropdown to log their usage.
- Admin User & Room/QR Management: An admin panel to manage users (including adding new professors, editing details, blocking/unblocking access, and generating unique QR_Strings for professor IDs). Also includes functionality to manage laboratory rooms (M101-M111) and generate unique QR codes for each room. Admins can view a list of professors and toggle their 'Blocked' status.
- Admin Dashboard & Analytics: A dedicated admin dashboard displaying key card statistics: Total Room Uses today, Total Unique Professors, and Number of Blocked Users. Includes a searchable and filterable table for the 'Room_Logs' collection, allowing admins to filter by Professor Name and custom Date Ranges (Daily, Weekly, Monthly).
- AI-Powered Usage Reports: A generative AI tool for administrators to summarize laboratory usage patterns and generate insights or simple reports based on collected Firestore data.

## Style Guidelines:

- Primary color: A deep, professional blue (#1242A1), evoking trust and efficiency, for core interactive elements and branding.
- Background color: A very subtle, cool off-white (#F9FAFB) to provide a clean, modern canvas and excellent readability.
- Accent color: A vibrant yet refined purple (#6952E6) for key calls-to-action, alerts, and to draw attention to important information.
- Headline and body font: 'Inter', a grotesque sans-serif, chosen for its neutral, objective, and highly legible characteristics, suitable for data-driven applications.
- Modern, crisp, and functional iconography with a minimalist design to enhance clarity and user experience, consistent with the tech-focused theme.
- Clean, structured layouts featuring card-based modules for clear data presentation and intuitive navigation, especially within admin dashboards and usage logs.
- Subtle and purposeful animations for state changes (e.g., successful login, QR scan verification) and UI feedback, contributing to a polished and responsive feel.