# PromptLab (D Studios Lab)

A professional AI prompt engineering platform built with React, TypeScript, and Vite.

## Features

### 🏠 My Hub
Your personalized dashboard for managing prompt projects, analytics, and templates.

### 🧪 Prompt Lab
Advanced prompt crafting environment with:
- **Quick Start**: Transform simple ideas into structured prompts
- **Framework Support**: Multiple prompt frameworks (CO-STAR, RISEN, APE, CARE, TRACE)
- **Template Library**: Industry-specific and role-based templates
- **Tone Selection**: Customize prompt tone and style
- **AI-Powered Suggestions**: Get intelligent field suggestions
- **Quality Analysis**: Real-time prompt quality scoring
- **Auto-Expansion**: Expand simple ideas with AI assistance

### 🎨 Tone Shifter
Adjust and transform the tone of your prompts with a single click.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS + Custom SCSS
- **State Management**: React Context API
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Testing**: Vitest + React Testing Library
- **Desktop App**: Electron

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Build Electron app
npm run electron:build
```

## Project Structure

```
src/
├── components/
│   ├── layout/          # Header, Sidebar, Footer
│   ├── prompt-builder/  # Prompt building components
│   ├── results/         # Output and quality score
│   └── settings/        # Settings modal
├── contexts/            # React Context providers
├── pages/               # Main application pages
├── services/            # LLM service integrations
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── constants.ts         # App constants and configurations
```

## LLM Providers

Supports multiple LLM providers:
- Anthropic (Claude)
- OpenAI (GPT)
- Google (Gemini)
- OpenRouter
- Custom endpoints

## Development

```bash
# Start dev server
npm run dev

# Run Electron in development
npm run electron:dev

# Run tests in watch mode
npx vitest

# Type checking
npx tsc --noEmit
```

## Building

### Web Application
```bash
npm run build
```

### Desktop Application (macOS)
```bash
npm run electron:build
```

Output: `dist-electron/DStudiosLab.dmg`

## Environment Variables

Create a `.env` file (optional):
```
VITE_API_BASE_URL=your_api_url
```

## License

Proprietary - D Studios Lab Team

## Credits

Made with ❤️ by Jai Sri Ram
