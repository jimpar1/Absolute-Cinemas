# Absolute Cinema

A modern, responsive cinema booking application built with React, Vite, and shadcn/ui.

## Features

### 🎬 Core Features
- **Browse Movies**: Grid view of all available movies with poster images, ratings, and genres
- **Movie Details**: Detailed movie pages with backdrop images, metadata, cast info, and booking options
- **Screenings**: View all available screenings with dates, times, and halls
- **Booking System**: Complete booking flow with customer information and seat selection

### 🔍 Discovery & Navigation
- **Discover**: Advanced search with debounced input, genre filters, and sort options
- **Now Playing**: Currently showing movies in theaters
- **Upcoming**: Release calendar with movies grouped by month
- **Genres**: Browse movies by category with visual genre cards
- **Watchlist & Favorites**: Save movies for later (client-side)
- **Profile**: User account management with statistics and preferences

### 🎨 Design & UX
- **Modern UI**: Built with shadcn/ui components for consistent, beautiful design
- **Dark Theme**: Eye-friendly dark color scheme optimized for cinema content
- **Responsive**: Mobile-first design that works on all screen sizes
- **Loading States**: Skeleton loaders for better perceived performance
- **Toast Notifications**: User feedback for actions like bookings and favorites
- **Empty States**: Helpful messages when no content is available
- **Hover Effects**: Interactive card animations and transitions

### 📱 Responsive Navigation
- **Desktop**: Top navigation bar with all main sections
- **Mobile**: Drawer/sheet navigation with hamburger menu
- **Active States**: Visual indication of current page
- **Accessibility**: labels and keyboard navigation support

## Tech Stack

- **React 19.2** - UI library
- **Vite 7.2** - Build tool and dev server
- **React Router 7** - Client-side routing
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library built on Radix UI
- **Lucide React** - Beautiful icon set
- **Radix UI** - Accessible component primitives

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/jimpar1/absolute-cinema.git
cd absolute-cinema

# Checkout the redesigned branch
git checkout main

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Backend Setup

This frontend expects a Django backend API running at `http://127.0.0.1:8000/api/`. The following endpoints should be available:

- `GET /api/movies/` - List all movies
- `GET /api/movies/:id/` - Get movie details
- `GET /api/movies/:id/screenings/` - Get movie screenings
- `GET /api/movies/search_tmdb/` - Search TMDB
- `GET /api/movies/popular_tmdb/` - Get popular movies from TMDB
- `GET /api/screenings/` - List all screenings
- `GET /api/screenings/:id/` - Get screening details
- `POST /api/bookings/` - Create booking

## Project Structure

```
src/
├── api/              # API client functions
├── components/       
│   ├── ui/          # shadcn/ui components
│   ├── MovieCard.jsx
│   ├── Navigation.jsx
│   └── Footer.jsx
├── hooks/           # Custom React hooks
│   └── use-toast.js
├── lib/             # Utility functions
│   └── utils.js
├── pages/           # Page components
│   ├── Home.jsx
│   ├── Movies.jsx
│   ├── MovieDetails.jsx
│   ├── Discover.jsx
│   ├── NowPlaying.jsx
│   ├── Upcoming.jsx
│   ├── Genres.jsx
│   ├── Screenings.jsx
│   ├── Booking.jsx
│   └── Watchlist.jsx
├── App.jsx          # Main app component with routing
├── main.jsx         # App entry point
└── index.css        # Global styles and Tailwind config
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Design System

### Colors
The application uses a dark theme with the following color palette:
- **Background**: `#0a0a0a` - Deep black for main background
- **Card**: `#1c1c1c` - Slightly lighter for cards
- **Primary**: `#fafafa` - White for text and primary actions
- **Muted**: `#2e2e2e` - For borders and subtle backgrounds
- **Accent**: Inherits from secondary for hover states

### Typography
- **Headings**: Bold, large font sizes with proper hierarchy
- **Body**: Base font with good readability
- **Muted Text**: Secondary information with reduced opacity

### Spacing
- Consistent padding and margins using Tailwind's spacing scale
- Container max-width for proper content alignment
- Generous whitespace for better readability

### Components
All UI components follow shadcn/ui's design patterns:
- Consistent border radius (0.5rem)
- Smooth transitions and animations
- Focus states for accessibility
- Hover effects for interactive elements

## API Integration

All existing API contracts have been preserved. The frontend makes the same API calls as before:

```javascript
// Example: Fetching movies
import { getMovies } from '@/api/movies'

const movies = await getMovies()
// Returns: { count, next, previous, results }
```

No backend changes are required - the redesign is purely frontend.

## Features In Detail

### Search & Filters
- **Debounced Search**: 500ms delay to reduce API calls
- **Genre Filters**: Click badges to filter by genre
- **Sort Options**: Sort by popularity, rating, title, or release date
- **Clear Filters**: Easy reset button

### Calendar View
The Upcoming page features a release calendar:
- Movies grouped by month
- Visual calendar grid showing release counts
- Easy navigation between months
- Release date display for each movie

### Booking Flow
1. View screening details with movie, date, time, and price
2. Enter customer information (name, email, phone)
3. Select number of seats
4. See live total price calculation
5. Confirm booking with toast notification
6. Redirect to screenings list

### Responsive Breakpoints
- **Mobile**: < 640px (2 columns)
- **Tablet**: 640px - 1024px (3-4 columns)
- **Desktop**: > 1024px (5-6 columns)
- **Large**: > 1400px (6 columns)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Code Splitting**: React Router handles route-based code splitting
- **Lazy Loading**: Images load as they enter viewport
- **Optimized Builds**: Vite's production builds are optimized
- **Minimal Bundle**: Tree-shaking removes unused code

## Accessibility

- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus states on all interactive elements
- Screen reader friendly
- Color contrast ratios meet WCAG standards

## Future Enhancements

- [ ] Video trailer integration
- [ ] User authentication
- [ ] Persistent watchlist/favorites with backend
- [ ] Movie recommendations
- [ ] Social sharing
- [ ] Advanced seat selection with hall layout
- [ ] Payment integration
- [ ] Email confirmations
- [ ] PWA support

## Contributing

This is a demonstration project showing modern React and shadcn/ui integration. Feel free to use it as a reference for your own projects.

## License

MIT

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [Radix UI](https://www.radix-ui.com/) - Accessible primitives
- [Lucide](https://lucide.dev/) - Icon set
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
