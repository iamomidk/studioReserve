# StudioReserve

A complete studio reservation, equipment rental, and barcode tracking platform for photographers and videographers in Iran.

## Features

### For Photographers
- Browse and search studios by city and features
- View detailed studio information with rooms and equipment
- Book rooms with flexible time slots
- Rent equipment along with room bookings
- View and manage booking history
- Real-time notifications

### For Studio Owners
- Create and manage studio profiles
- Add and manage rooms with pricing
- Track equipment inventory with barcode system
- Generate barcodes for equipment
- Scan equipment check-out and check-in
- Accept or reject booking requests
- View dashboard with statistics
- Manage bookings and revenue

### For Admins
- Approve or reject studio applications
- Monitor all bookings and equipment logs
- View platform statistics and revenue
- Manage users and resolve disputes

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. Supabase account and project

### Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your Supabase credentials to `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
npm install
```

### Database Setup

The database schema has already been applied through migrations. It includes:

- **users**: User profiles with roles (photographer, studio_owner, admin)
- **studios**: Studio listings with verification status
- **rooms**: Individual rooms within studios
- **room_availability**: Time slot availability tracking
- **equipment**: Equipment inventory with barcode codes
- **equipment_logs**: Check-out/check-in tracking
- **bookings**: Room reservations with equipment rentals
- **payments**: Payment transaction records
- **notifications**: User notifications

All tables have Row Level Security (RLS) policies enforcing role-based access.

### Running the Application

```bash
npm run dev
```

Visit `http://localhost:5173` to view the application.

### Building for Production

```bash
npm run build
```

## User Roles

### Photographer
Default role for photographers and videographers who want to book studios and rent equipment.

**Capabilities:**
- Browse approved studios
- Book rooms and rent equipment
- View booking history
- Manage profile

### Studio Owner
For studio owners who want to list their spaces and equipment.

**Capabilities:**
- Create and manage studios (requires admin approval)
- Add rooms with pricing
- Add equipment to inventory
- Generate and manage barcodes
- Scan equipment in/out
- Accept/reject bookings
- View financial dashboard

### Admin
Platform administrators with full access.

**Capabilities:**
- Approve/reject studio applications
- Monitor all platform activity
- View system statistics
- Manage disputes
- Access all data

## Key Workflows

### Booking Workflow
1. Photographer searches for studios
2. Selects studio and views details
3. Chooses room and time slot
4. Optionally adds equipment
5. Submits booking (pending approval)
6. Studio owner accepts/rejects
7. After session, equipment is scanned back in
8. Booking marked as completed

### Equipment Tracking Workflow
1. Studio owner adds equipment to inventory
2. System generates unique barcode
3. Owner prints/downloads barcode label
4. During booking, equipment marked for rental
5. Check-out: Scan barcode → logged as "scan_out"
6. Check-in: Scan barcode → logged as "scan_in"
7. System tracks all movements and status

### Studio Approval Workflow
1. Studio owner creates studio profile
2. Status set to "pending"
3. Admin reviews application
4. Admin approves or rejects
5. Owner receives notification
6. Approved studios appear in search

## Database Security

All tables use Row Level Security (RLS) with the following principles:

- Users can only view and edit their own data
- Studio owners can only manage their own studios/equipment
- Photographers can only view approved studios
- Admins have full access across all tables
- All policies check authentication and ownership

## Features Not Yet Implemented

The following features are marked as "under development":
- Payment gateway integration (Zarinpal, IDPay, NextPay)
- Financial reports and analytics
- SMS notifications via Kavenegar/Ghasedak
- Map integration with Neshan API
- Advanced equipment logs and reports
- Dispute management system

## RTL Support

The application is fully RTL (Right-to-Left) compatible for Persian language support. All UI components and layouts are designed for optimal Persian text display.

## Contributing

This is a production-ready application template. Customize as needed for your specific use case.

## License

MIT
