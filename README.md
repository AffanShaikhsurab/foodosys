# Mysore Mess Menus

A simple website where students at Infosys Mysore can upload photos of daily menus for each dining location. Photos are stored in Supabase Storage, OCRed with OCR.Space, and the parsed menu text + photo is displayed for everyone to view before they walk.

## Features

- Upload menu photos for any food court on campus
- Automatic OCR processing to extract text from images
- View menus for all food courts in one place
- Mobile-first responsive design
- Real-time updates

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **OCR**: OCR.Space API
- **Styling**: Custom CSS with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- An OCR.Space API key

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/mysore-mess-menus.git
   cd mysore-mess-menus
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OCRSPACE_API_KEY=your_ocrspace_api_key
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

4. Set up Supabase database:
   - Run the SQL commands in `supabase/init.sql` in your Supabase SQL editor
   - Create a storage bucket named `menu-images`
   - Set up the storage policies as defined in the SQL file

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── upload/            # Upload page
│   ├── settings/          # Settings page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utility functions and types
├── styles/                # Global styles
├── supabase/              # Database initialization
└── docs/                  # Project documentation
```

## Design System

The application follows the "Organic Tech" design philosophy with:
- Earthy tones and rounded corners
- Calm, efficient interface
- Mobile-first responsive design
- Consistent component library

See `docs/design.md` for detailed design specifications.

## API Endpoints

- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/[slug]/menus` - Get menus for a specific restaurant
- `POST /api/upload` - Upload a menu image and process with OCR

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.