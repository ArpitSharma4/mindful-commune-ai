# Echo Well - Reddit-style Community Platform
 
## Project Overview

**Echo Well** is a Reddit-style community platform designed for mental wellness and support. Users can share their thoughts anonymously or with their username, join topic-based communities, and engage with others through voting and commenting.

## Key Features

- **Anonymous Posting**: Share thoughts safely with optional anonymous posting
- **Community System**: Join topic-based communities (r/Mindfulness, r/Therapy, etc.)
- **Reddit-style Interface**: Familiar voting system, tabs, and community sidebar
- **Responsive Design**: Mobile-first approach with modern UI components
- **Safe Space**: Built with mental health and privacy in mind

## Technology Stack

This project is built with:

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS with custom therapeutic design tokens
- **State Management**: TanStack React Query
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd echo-well

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui component library
│   ├── Header.tsx      # Navigation header
│   ├── HeroSection.tsx # Landing page hero
│   ├── JournalFeed.tsx # Main posts feed (renamed from JournalFeed)
│   ├── JournalPost.tsx # Individual post component
│   └── CommunitySidebar.tsx # Reddit-style sidebar
├── pages/              # Route components
├── hooks/              # Custom React hooks
└── lib/                # Utility functions
```

## Features

### Community System
- Trending communities with member counts
- Community guidelines and rules
- Join/leave community functionality

### Post Management
- Create posts with titles and content
- Anonymous or named posting options
- Upvote/downvote system
- Community tagging
- Search and filtering

### User Experience
- Responsive design for all devices
- Smooth animations and transitions
- Toast notifications for user feedback
- Loading states and skeleton screens

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Design System

The app uses a therapeutic color palette designed for mental wellness:
- **Primary**: Calming teal tones
- **Secondary**: Soft blues and grays
- **Accent**: Gentle mint colors
- **Dark Mode**: Comprehensive dark theme support

## Contributing

This project is built with modern React patterns and follows best practices for accessibility and performance. All components are built on Radix UI primitives for screen reader support.

## License

Private project - All rights reserved
