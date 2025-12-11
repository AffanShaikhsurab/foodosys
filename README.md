# 🍽️ Mysore Mess Menus

A community-driven platform where students at Infosys Mysore can share daily menu photos from campus dining locations. Menus are automatically processed with OCR, making it easy to check what's being served before you walk!

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

## ✨ Features

- 📸 **Photo Upload** - Capture or upload menu photos from any campus dining location
- 🔍 **OCR Processing** - Automatic text extraction from menu images using AI
- 🏆 **Karma System** - Earn points for contributing menus
- 📊 **Leaderboard** - Community contributors ranked by karma
- 🔐 **Clerk Authentication** - Secure sign-in with multiple providers
- 📱 **Mobile-First** - Responsive design optimized for mobile devices
- ⚡ **Real-Time Updates** - See new menus as they're posted

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, Material UI |
| **Backend** | Next.js API Routes |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage |
| **Authentication** | Clerk |
| **OCR** | OCR.Space, Google Gemini |
| **Rate Limiting** | Upstash Redis |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A [Supabase](https://supabase.com) account
- A [Clerk](https://clerk.com) account
- An [OCR.Space](https://ocr.space/ocrapi) API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mysore-mess-menus.git
   cd mysore-mess-menus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your credentials (see [Environment Setup](#environment-setup) below).

4. **Set up the database**
   
   Run the SQL migrations in your Supabase SQL editor:
   ```bash
   # Execute files in order from supabase/migrations/
   # Or use the setup script:
   npm run setup-db
   ```

5. **Seed initial data (optional)**
   ```bash
   npm run seed-restaurants
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚙️ Environment Setup

### Supabase Configuration

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** to get your keys
3. Create a storage bucket named `menu-images`
4. Run the migrations from `supabase/migrations/`

### Clerk Configuration

1. Create an application at [clerk.com](https://clerk.com)
2. Go to **API Keys** to get your publishable and secret keys
3. Set up a webhook endpoint at `/api/webhooks/clerk` for user sync
4. Configure JWT templates for Supabase integration

### OCR Services

- **OCR.Space**: Get a free API key at [ocr.space/ocrapi](https://ocr.space/ocrapi)
- **Google Gemini** (optional): Get an API key at [makersuite.google.com](https://makersuite.google.com/app/apikey)

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API route handlers
│   │   ├── (auth)/         # Authentication pages
│   │   └── ...
│   ├── components/          # React components
│   ├── context/            # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and helpers
│   └── styles/             # Global styles
├── public/                  # Static assets
├── supabase/               # Database migrations
│   └── migrations/         # SQL migration files
├── scripts/                # Setup and utility scripts
└── ...
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run setup-db` | Run database migrations |
| `npm run verify-db` | Verify database schema |
| `npm run seed-restaurants` | Seed restaurant data |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Infosys Mysore](https://www.infosys.com) campus community
- All contributors who help keep menus updated!

---

**Made with ❤️ for the Infosys Mysore community**
