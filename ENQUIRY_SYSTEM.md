# Enquiry System Setup Complete ✅

## What's Been Created

### Database Schema
- **Table**: `enquiries` (PostgreSQL via Neon)
- **Fields**:
  - `id` - Primary key (serial)
  - `type` - Enquiry type (private_chef, cooking_class, blog)
  - `name` - Customer name (required)
  - `email` - Customer email (required)
  - `phone` - Customer phone (optional)
  - `message` - Additional message (optional)
  - `createdAt` - Timestamp of submission

### New Components

1. **EnquiryDialog** (`components/enquiry-dialog.tsx`)
   - Reusable dialog component for enquiry submissions
   - Handles form validation and submission
   - Shows success/error states
   - Integrated with Tailwind styling matching your site

2. **Dialog UI Component** (`components/ui/dialog.tsx`)
   - Base dialog component using Radix UI
   - Pre-configured styling

3. **API Route** (`app/api/enquiries/route.ts`)
   - POST endpoint to handle enquiry submissions
   - Validates required fields
   - Saves to database
   - Returns submission confirmation

4. **Database Connection** (`lib/db/index.ts`)
   - Drizzle ORM setup
   - PostgreSQL connection via Neon

5. **Database Schema** (`lib/db/schema.ts`)
   - Drizzle table definitions
   - TypeScript types for Enquiry objects

### Integration with Links Page

The links page now uses the enquiry system for:
- **Book Private Chef** - Opens enquiry dialog
- **Cooking Classes** - Opens enquiry dialog
- **Conference Blog Signup** - Opens enquiry dialog
- **Catering Inquiry** - Still uses email (can be updated to use dialog if needed)

## How to Use

### For Customers
1. Click on any enquiry button (Book Private Chef, Cooking Classes, Join Blog)
2. Fill in the form with name, email, and optional phone/message
3. Submit - data saves to database and confirmation appears

### For Developers

#### View submissions in database
```bash
npm run db:studio
```
This opens Drizzle Studio to browse all enquiries.

#### Generate new migrations (if you modify schema)
```bash
npm run db:generate
```

#### Apply pending migrations
```bash
npm run db:migrate
```

## Database Schema

The migration has been generated and applied. The `enquiries` table is ready to receive submissions.

### Recent Changes in Links Page
- `Book Private Chef`: Now opens dialog instead of static link
- `Cooking Classes`: Now opens dialog instead of static link
- Conference section: Now clickable - opens blog signup dialog
- Hidden sections (Membership/VIP List, Recipes & Blog) - remain in code but not visible

## Next Steps

1. Test the enquiry forms on your links page
2. View submissions using `npm run db:studio`
3. (Optional) Add email notifications when enquiries are submitted
4. (Optional) Create an admin dashboard to manage enquiries

## Files Modified/Created

### New Files
- `lib/db/schema.ts` - Drizzle schema
- `lib/db/index.ts` - Database connection
- `components/enquiry-dialog.tsx` - Enquiry form dialog
- `components/ui/dialog.tsx` - Dialog UI component
- `app/api/enquiries/route.ts` - API endpoint
- `drizzle.config.ts` - Drizzle configuration
- `drizzle/0000_long_johnny_storm.sql` - Initial migration

### Modified Files
- `components/links/links-page-client.tsx` - Integrated enquiry dialogs
- `components/links/links-page.tsx` - Updated links to use dialogs
- `package.json` - Added Drizzle scripts

## Environment
- Database: PostgreSQL (Neon)
- ORM: Drizzle
- Framework: Next.js 16
