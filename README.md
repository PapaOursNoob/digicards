# DigiCollection

A Progressive Web App for managing your Digimon Card Game collection.

## Features

- 📱 Progressive Web App (PWA) with offline support
- 🃏 Complete card database from Digimon Card Game
- 💎 Collection tracking with quantity and condition
- ❤️ Wishlist management with price tracking
- 🃏 Deck building with drag & drop interface
- 📊 Collection statistics and set completion tracking
- 📈 Price estimation using CardMarket data
- 🔍 Advanced search and filtering
- 📱 Mobile-first responsive design

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **PWA**: vite-plugin-pwa

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/digicollection.git
cd digicollection
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```

4. Set up Supabase:
- Create a new project on [Supabase](https://supabase.io/)
- Run the SQL migrations from `supabase/migrations/`
- Enable authentication (email/password and optionally Google OAuth)
- Get your project URL and anon key from Settings > API

5. Run the development server:
```bash
npm run dev
```

6. Build for production:
```bash
npm run build
```

## Project Structure

```
digicollection/
├── src/
│   ├── components/     # React components
│   ├── lib/            # Utility functions and Supabase client
│   ├── pages/          # Page components
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── supabase/
│   └── migrations/     # Database schema migrations
├── public/             # Static assets
├── index.html          # Main HTML file
├── vite.config.js      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
└── package.json        # Project dependencies
```

## Database Schema

The database schema is defined in `supabase/migrations/20260601000000_create_tables.sql` and includes:

- `cards`: Card database cache
- `collection`: User's card collection
- `wishlist`: User's wishlist
- `decks`: User's decks
- `deck_cards`: Cards in decks
- `prices_cache`: CardMarket price cache

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy!

### Self-hosted

1. Build the project: `npm run build`
2. Serve the `dist/` folder with your preferred web server

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Card data provided by [digimoncard.dev](https://digimoncard.dev/)
- Card images and information are property of Bandai