# INGRES AI ChatBot - Browser Extension

An AI-powered chatbot browser extension for the INGRES (India Ground Water Resource Estimation System) portal. This extension provides a virtual assistant that enables users to easily query groundwater data, access historical and current assessments, and obtain instant insights.

## Features

- 🤖 **AI-Powered Chat Interface** - Natural language queries for groundwater data
- 🌊 **Real-time Streaming Responses** - See AI responses as they're generated
- 🔍 **Smart Filtering** - Filter by State/UT and Assessment Year
- 📊 **Source Citations** - View data sources for each response
- 💡 **Follow-up Suggestions** - Get intelligent follow-up questions
- 🎨 **Beautiful UI** - Modern, responsive design with Tailwind CSS
- 🔒 **Privacy-First** - No data stored on external servers

## Tech Stack

- **React 18** - UI Components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **React Markdown** - Formatted responses

## Project Structure

```
extension/
├── public/
│   ├── manifest.json          # Extension manifest (MV3)
│   └── icons/                 # Extension icons
├── src/
│   ├── background/            # Service worker
│   ├── content/               # Content script (injected into INGRES)
│   ├── popup/                 # Extension popup UI
│   ├── components/            # React components
│   │   ├── ChatWidget/        # Main chat interface
│   │   ├── ChatMessage/       # Individual message display
│   │   ├── ChatInput/         # Message input field
│   │   ├── ChatToggleButton/  # Floating action button
│   │   ├── FilterBar/         # State/Year filters
│   │   ├── Suggestions/       # Follow-up suggestions
│   │   └── WelcomeScreen/     # Initial greeting screen
│   ├── services/              # API service layer
│   ├── types/                 # TypeScript types
│   ├── data/                  # Constants (states, years)
│   └── styles/                # Global styles
├── scripts/                   # Build scripts
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Backend API running on localhost:3001

### Installation

1. **Install dependencies:**
   ```bash
   cd extension
   pnpm install
   ```

2. **Generate icons (optional):**
   ```bash
   pnpm install sharp
   node scripts/generate-icons.js
   ```
   
   Or manually create PNG icons (16x16, 32x32, 48x48, 128x128) in `public/icons/`

3. **Build the extension:**
   ```bash
   pnpm build
   ```

4. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development

```bash
# Start development mode (watch for changes)
pnpm dev

# Build for production
pnpm build
```

## API Integration

The extension connects to the backend API at `http://localhost:3001`. It uses:

- `POST /api/chat/stream` - Streaming chat responses (SSE)
- `GET /api/health` - Health check

### Request Format

```typescript
{
  query: string;           // User's question
  chatHistory: Message[];  // Previous messages for context
  topK: number;           // Number of results (default: 5)
  filters: {
    state?: string;       // Filter by state/UT
    year?: string;        // Filter by assessment year
  }
}
```

### Response Format (SSE Events)

```typescript
// Sources event
{ type: "sources", sources: [...] }

// Token event (streaming)
{ type: "token", content: "..." }

// Suggestions event
{ type: "suggestions", suggestions: [...] }

// Complete event
{ type: "done" }
```

## Customization

### Changing API URL

Users can change the API URL in the extension popup settings. The default is `http://localhost:3001`.

### Tailwind Prefix

All Tailwind classes use the `ig-` prefix to avoid conflicts with the host website's styles.

### Theme Colors

Custom colors are defined in `tailwind.config.js`:
- `water` - Blue theme for water-related branding
- `primary` - Primary accent colors

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is developed for the Ministry of Jal Shakti (CGWB) - Smart India Hackathon 2025.

## Acknowledgments

- Central Ground Water Board (CGWB)
- IIT Hyderabad
- Ministry of Jal Shakti
