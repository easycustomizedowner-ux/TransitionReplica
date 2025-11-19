# EasyCustomized

A premium marketplace connecting customers with vendors for custom-made products (fashion, jewelry, décor, and more).

## 🌟 Features

- **Multi-Role System**: Customer, Vendor, and Admin dashboards
- **Real-time Chat**: Powered by Supabase Realtime
- **Quote System**: Customers post requirements, vendors submit quotes
- **Vendor Inventory**: Showcase custom products and portfolios
- **Image Upload**: Supabase Storage integration with compression
- **Edge Functions**: Server-side logic for quote acceptance and moderation
- **Premium UI**: Dark mode with glassmorphism and smooth animations

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/easycustomizedowner-ux/TransitionReplica.git
cd TransitionReplica
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run development server
```bash
npm run dev
```

## 📦 Tech Stack

- **Frontend**: React + Vite
- **Styling**: Tailwind CSS + Shadcn/UI
- **Animations**: Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **State Management**: TanStack Query (React Query)
- **Form Validation**: React Hook Form + Zod

## 🔧 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to Vercel and setting up Supabase.

## 📝 Project Structure

```
TransitionReplica/
├── src/
│   ├── api/              # Legacy API wrappers (being phased out)
│   ├── components/       # React components
│   │   ├── ui/          # Shadcn/UI components
│   │   ├── ChatContext.jsx
│   │   ├── ChatWindow.jsx
│   │   └── ...
│   ├── pages/           # Main page components
│   │   ├── Auth.jsx
│   │   ├── CustomerDashboard.jsx
│   │   ├── VendorDashboard.jsx
│   │   └── ...
│   ├── lib/             # Utilities
│   │   └── supabase.js  # Supabase client
│   └── index.css        # Global styles
├── supabase/
│   ├── functions/       # Edge Functions
│   │   ├── accept_quote/
│   │   └── moderate_ad/
│   └── schema.sql       # Database schema
└── ...
```

## 🗄️ Database Schema

- `profiles` - User profiles (Customer/Vendor/Admin)
- `ads` - Customer requirements/posts
- `quotes` - Vendor quotes for ads
- `chat_threads` - Chat conversations
- `chat_messages` - Individual messages
- `vendor_inventory` - Vendor product showcase

## 🔐 Authentication

- Email/Password authentication via Supabase Auth
- Role-based access control (Customer, Vendor, Admin)
- Row Level Security (RLS) policies for data protection

## 📸 Storage Buckets

- `ad-images` - Customer requirement images (public)
- `inventory-images` - Vendor product images (public)
- `avatars` - User profile pictures (public)
- `chat-attachments` - Chat media files (private)

## 🎨 Design Philosophy

- **Premium Dark Mode** with neon accents (#CEFF00)
- **Glassmorphism** for modern, translucent UI elements
- **Micro-interactions** for enhanced user engagement
- **Mobile-first** responsive design

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.