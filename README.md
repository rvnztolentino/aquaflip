# Aquaflip

A flipping bottle endless runner game inspired by Chrome Dino. Test your reflexes as you guide a flipping bottle through obstacles in an ever-accelerating challenge.

## Tech Stack

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animation:** Motion
- **UI Components:** Lucide React

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rvnztolentino/aquaflip.git
   cd aquaflip
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` in the root directory (optional for local development):
   ```bash
   cp .env.example .env.local
   ```

## Configuration

Environment variables (optional for local development):

- `GEMINI_API_KEY` - API key for Gemini AI integration (if using AI features)
- `APP_URL` - The URL where the app is hosted (used for self-referential links and API endpoints)

Set these in your `.env.local` file if needed.

## How to Run

**Development mode:**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

**Production build:**
```bash
npm run build
npm start
```

**Linting:**
```bash
npm run lint
```

**Clean build artifacts:**
```bash
npm run clean
```

## Notes

- This is a client-side game built with Next.js. The game logic runs entirely in the browser.
- The project includes optional Gemini AI integration for enhanced features.
- Dark/light mode toggle is available in-game for customizable gameplay experience.
