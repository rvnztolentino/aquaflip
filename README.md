# Aquaflip

Aquaflip is a browser-based endless runner game featuring a flipping water bottle on a desk. The player jumps, slides, and avoids classroom-themed obstacles while the game speeds up over time.

Built with Google AI Studio.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Motion
- Lucide React
- Google GenAI SDK

## Setup Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/rvnztolentino/aquaflip.git
   cd aquaflip
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` if you need to run with Google AI Studio or hosted app settings.

## Configuration

The project includes these environment variables in `.env.example`:

- `GEMINI_API_KEY`: Gemini API key. Google AI Studio injects this from user secrets at runtime.
- `APP_URL`: Hosted app URL. Google AI Studio injects this with the Cloud Run service URL.

For local gameplay, no environment variables are required by the current client-side game code.

## How to Run

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

Build for production:

```bash
npm run build
```

Run the production server:

```bash
npm start
```

Run linting:

```bash
npm run lint
```

## Notes

- The game runs in the browser using a canvas-based game loop.
- High score is stored in browser `localStorage`.
- Controls support keyboard and touch input.
