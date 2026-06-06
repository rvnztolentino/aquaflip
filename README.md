# AquaFlip

A flipping bottle endless runner game inspired by Chrome Dino. Built with Next.js, React, and powered by Google's Gemini AI for dynamic gameplay.

## Tech Stack

- **Framework**: Next.js 15.4.9
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS 4, lucide-react
- **Animation**: Motion
- **AI**: Google Gemini API
- **Styling**: PostCSS, Autoprefixer

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/rvnztolentino/aquaflip.git
   cd aquaflip
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

4. **Set up required API credentials**
   Edit `.env.local` and provide:
   - `GEMINI_API_KEY`: Your Google Gemini API key (obtain from [AI Studio](https://aistudio.google.com))
   - `APP_URL`: The URL where this applet will be hosted (used for callbacks and self-referential links)

## How to Run

**Development**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

**Production Build**
```bash
npm run build
npm start
```

**Lint Code**
```bash
npm run lint
```

**Clean Build Artifacts**
```bash
npm run clean
```

## Configuration

Environment variables (configured in `.env.local`):

- `GEMINI_API_KEY`: Required for AI-powered features via the Google Generative AI API
- `APP_URL`: The base URL of the deployed application

## Notes

- The app is built as a standalone Next.js application for containerized deployment
- HMR (Hot Module Reloading) can be disabled via the `DISABLE_HMR` environment variable for certain deployment environments
- Remote images from `picsum.photos` are allowed for use as image placeholders
- TypeScript strict mode is enabled; build errors will fail the build process
