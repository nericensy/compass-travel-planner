# Compass — AI-Powered Travel Planner

Compass is a travel planner I built using React, TypeScript and Vite. Users can add and manage trips, track their budgets and generate travel itineraries using the Gemini API.
The application features a modern dashboard, interactive trip management, persistent theme preferences, and downloadable PDF itineraries.

## Live Demo

**Website:** https://compass-travel-planner.onrender.com

**GitHub:** https://github.com/nericensy/compass-travel-planner

The application is deployed on Render using a free Node.js web service. As free instances may sleep during inactivity, the first page load may take approximately 50 seconds or longer.

## Features

### Trip Management
- View travel plans in a structured table.
- Add new trips with input validation.
- Edit and delete existing trips.
- Search trips by destination or country.
- Automatically calculate trip status based on travel dates and confirmation status.

### Travel Budget Management
- Set an overall planning budget.
- View trip budget allocations.
- Prevent planned trips from exceeding the available planning budget.

### AI-Powered Itinerary Generation
- Generate personalised daily itineraries using Google Gemini.
- Receive suggested morning, afternoon, and evening activities.
- View estimated costs, transport suggestions, and travel tips.
- Save generated itineraries in browser localStorage to avoid unnecessary repeated API requests.
- Download generated itineraries as PDF files.

### User Interface
- Responsive design using Tailwind CSS.
- Light and dark mode with persistent preferences.
- Country information and flags using an external API.

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Node.js, Express.js |
| AI Integration | Google Gemini API |
| External Data | REST Countries API |
| Data Storage | JSON file, browser localStorage |
| Deployment | Render |
| Version Control | Git, GitHub |

## Getting Started

### Prerequisites

- Node.js and npm
- A Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/nericensy/compass-travel-planner.git
cd compass-travel-planner
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root and add:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

The `.env` file is excluded from Git version control to protect sensitive credentials.

### 4. Start the Backend

Open a terminal and run:

```bash
node server/index.js
```

The backend runs on `http://localhost:3001` by default.

### 5. Start the Frontend

Open another terminal and run:

```bash
npm run dev
```

Open the local URL displayed by Vite, typically `http://localhost:5173`.

## Production Build

To create a production build:

```bash
npm run build
```

To serve the production application locally:

```bash
node server/index.js
```

Open `http://localhost:3001`.

## Project Structure

```text
compass-travel-planner/
├── public/
│   └── data/
│       └── trips.json
├── server/
│   └── index.js
├── src/
│   ├── components/
│   │   ├── AddTripModal.tsx
│   │   ├── ItineraryViewer.tsx
│   │   └── TravelOverview.tsx
│   ├── hooks/
│   │   └── useCountries.ts
│   ├── services/
│   │   ├── itineraryAPI.ts
│   │   └── itineraryPdf.ts
│   └── App.tsx
└── README.md
```

## Data Management

Initial trip records are loaded from `public/data/trips.json` and displayed in the application table.

Newly added and edited trips update the React application state immediately without requiring a page refresh.

Generated itineraries and theme preferences are stored in browser localStorage. No database or user authentication is required.

**Note:** Trip additions and edits are not permanently saved across page refreshes. Generated itineraries are stored locally in the user's browser and are not synchronised across devices.

## Cloud Deployment

Compass is hosted on Render as a Node.js web service.

**Build command:**

```bash
npm ci && npm run build
```

**Start command:**

```bash
node server/index.js
```

The `GEMINI_API_KEY` environment variable is configured securely in Render's environment settings.

Changes pushed to the GitHub `main` branch can automatically trigger a new deployment when Render Auto-Deploy is enabled.

## Limitations

- AI-generated itineraries are suggestions and may contain inaccurate pricing, routes, or opening hours.
- Generated itineraries are saved per browser rather than per authenticated user.
- Trip additions and edits are session-only and reset when the application reloads.
- The free hosting service may take longer to respond after inactivity.

## Author

Developed as a frontend development technical assignment.