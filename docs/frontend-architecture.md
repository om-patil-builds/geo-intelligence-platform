# Frontend Architecture & Design Doc
## Place Data Extraction & Location Intelligence System

**Stack:** React 18 + Vite + Tailwind CSS + Axios + react-leaflet + Recharts
**Auth:** None (single shared internal tool)
**Confirmed scope:** 4 routes. No Landing, no Login, no Settings, no Export Center as a page.

---

## 1. Route Map

```
/                  → Search (home — search form, results, map)
/history           → Search History
/places/:id        → Place Detail
/dashboard          → Analytics Dashboard
*                  → 404 Not Found
```

Five routes total, one of them a fallback. If you find yourself wanting a 6th, the question to ask first is "is this a page, or is it a modal/drawer on an existing page?" Most things will be the latter.

`react-router-dom` config:

```jsx
// App.jsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Search from './pages/Search';
import History from './pages/History';
import PlaceDetail from './pages/PlaceDetail';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Search />} />
        <Route path="/history" element={<History />} />
        <Route path="/places/:id" element={<PlaceDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
```

---

## 2. Folder Structure

```
client/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   ├── search/
│   │   │   ├── SearchForm.jsx
│   │   │   ├── KeywordInput.jsx
│   │   │   ├── CityInput.jsx
│   │   │   ├── RadiusSlider.jsx
│   │   │   └── JobProgressBar.jsx
│   │   ├── results/
│   │   │   ├── ViewToggle.jsx        # table / map switch
│   │   │   ├── ResultsTable.jsx
│   │   │   ├── TableRow.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── SortableHeader.jsx
│   │   │   └── ExportButton.jsx
│   │   ├── map/
│   │   │   ├── MapView.jsx
│   │   │   ├── PlaceMarker.jsx
│   │   │   └── MarkerCluster.jsx
│   │   ├── history/
│   │   │   ├── HistoryFilters.jsx
│   │   │   ├── HistoryList.jsx
│   │   │   └── HistoryItem.jsx
│   │   ├── dashboard/
│   │   │   ├── StatCard.jsx
│   │   │   ├── CategoryPieChart.jsx
│   │   │   └── RatingsBarChart.jsx
│   │   └── ui/                       # shared primitives
│   │       ├── Button.jsx
│   │       ├── Spinner.jsx
│   │       ├── EmptyState.jsx
│   │       ├── ErrorBanner.jsx
│   │       └── Modal.jsx
│   │
│   ├── pages/
│   │   ├── Search.jsx
│   │   ├── History.jsx
│   │   ├── PlaceDetail.jsx
│   │   ├── Dashboard.jsx
│   │   └── NotFound.jsx
│   │
│   ├── hooks/
│   │   ├── usePlaceSearch.js         # triggers search, polls job
│   │   ├── usePlaces.js              # fetch saved places, filters
│   │   ├── useSearchHistory.js
│   │   └── useDebounce.js
│   │
│   ├── services/
│   │   ├── api.js                    # axios instance, base config
│   │   ├── placeService.js
│   │   ├── exportService.js
│   │   └── historyService.js
│   │
│   ├── context/
│   │   └── SearchContext.jsx         # current search results, shared between Search page & ExportButton
│   │
│   ├── utils/
│   │   ├── formatters.js             # phone, rating, address formatting
│   │   └── constants.js
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                     # Tailwind directives
│
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 3. Page-by-Page Breakdown

### 3.1 `/` — Search (the actual product, ~70% of usage time)

This page does NOT navigate away when a search runs. State updates in place.

```
Search.jsx
 ├── SearchForm
 │     ├── KeywordInput        (text, required)
 │     ├── CityInput           (text, required, debounced autocomplete optional)
 │     └── RadiusSlider        (1–50 km, default 10)
 ├── JobProgressBar            (visible only while job status = pending/processing)
 ├── ErrorBanner                (visible on failure — API quota, network, invalid input)
 ├── ViewToggle                (Table | Map)
 ├── ExportButton              (disabled until results exist, sits above the table)
 ├── ResultsTable               (visible when ViewToggle = Table)
 │     ├── SortableHeader (x N columns)
 │     ├── TableRow (x 20, paginated)
 │     └── Pagination
 └── MapView                    (visible when ViewToggle = Map)
       ├── MarkerCluster
       └── PlaceMarker → click → InfoPopup (mini preview, links to /places/:id)
```

**State owned by this page:**
- `searchParams` (keyword, city, radius)
- `jobId`, `jobStatus` (pending/processing/done/failed)
- `results` (array, populated once job completes)
- `view` ('table' | 'map')
- `selectedRowIds` (for export)

**Empty state:** Before any search, show an `EmptyState` component — short instruction text, not a blank screen. Avoid the trap of designing only the "happy path with data" view; first-time load looks broken otherwise.

**Loading state:** `JobProgressBar` polls `/api/places/status/:jobId` every 2s. Don't block the whole UI — let the user adjust the form again if they want to queue another search.

---

### 3.2 `/history` — Search History

```
History.jsx
 ├── HistoryFilters            (date range, keyword text filter)
 └── HistoryList
       └── HistoryItem (x N)
             - keyword, city, radius, result count, timestamp, status badge
             - click → navigates to "/" with that search's results pre-loaded
                 (pass via SearchContext or query param ?historyId=X)
```

**Design decision worth stating explicitly:** clicking a history item does not open a separate results page — it re-populates the Search page. This keeps "view results" logic in exactly one place instead of duplicating ResultsTable on two pages.

---

### 3.3 `/places/:id` — Place Detail

Single business, full record. This earns its own route (rather than just a modal) because it's a shareable, bookmarkable URL — useful if someone wants to send a teammate a direct link to one business.

```
PlaceDetail.jsx
 ├── PlaceHeader        (name, category, rating stars, review count)
 ├── PlaceInfo          (address, phone, website — formatted, clickable)
 ├── PlaceMap           (single marker, no cluster)
 └── BackLink           (→ history.back(), not a hardcoded route)
```

If your team decides full pages are overkill, this is the one component you could legitimately downgrade to a Modal opened from ResultsTable instead. Either is defensible — don't build both.

---

### 3.4 `/dashboard` — Analytics

Deliberately scoped down from the original spec (no heat maps — see prior reasoning: sparse scraped data makes heat maps look broken, not impressive).

```
Dashboard.jsx
 ├── StatCard (x3)
 │     - Total Places Collected
 │     - Total Searches Run
 │     - Average Rating Across DB
 ├── CategoryPieChart      (Recharts — distribution of categories searched)
 └── RatingsBarChart       (Recharts — count of places per rating bucket: 1★–5★)
```

Two charts, three stat cards. That's the entire page. If evaluators want more "innovation" points, add ONE more chart (e.g., searches-over-time line chart) — don't add five mediocre ones.

---

### 3.5 `*` — Not Found

Standard 404. One illustration or icon, one line of text, one button back to `/`. Five minutes of work, not worth over-designing.

---

## 4. Shared Layout

```jsx
// components/layout/Layout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
```

**Navbar** — just 3 links: Search | History | Dashboard. No user menu, no avatar, no logout (no auth). Resist the urge to add a profile icon just because most templates have one — it implies functionality you don't have.

---

## 5. State Management Decision

You do not need Redux or Zustand for this app. Justification, not just a preference:

- Search results only need to be shared between `Search.jsx` and `ExportButton.jsx` (same page) and optionally `History.jsx` (one-directional, on click).
- Use **React Context** (`SearchContext`) for that one cross-cutting concern, and local `useState` everywhere else.
- Server data (places, history) goes through **React Query** (or plain `useEffect` + custom hooks if you want to keep dependencies minimal) — it already handles caching, refetch, and loading/error states, which is most of what Redux would otherwise be doing manually.

```jsx
// context/SearchContext.jsx
const SearchContext = createContext();

export function SearchProvider({ children }) {
  const [results, setResults] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  return (
    <SearchContext.Provider value={{ results, setResults, selectedIds, setSelectedIds }}>
      {children}
    </SearchContext.Provider>
  );
}
```

---

## 6. API Service Layer

Never call `axios` directly from components. One service file per resource.

```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

export default api;
```

```javascript
// services/placeService.js
import api from './api';

export const searchPlaces = (params) => api.post('/places/search', params);
export const getJobStatus = (jobId) => api.get(`/places/status/${jobId}`);
export const getPlaces = (filters) => api.get('/places', { params: filters });
export const getPlaceById = (id) => api.get(`/places/${id}`);
```

```javascript
// hooks/usePlaceSearch.js
import { useState, useCallback } from 'react';
import { searchPlaces, getJobStatus } from '../services/placeService';

export function usePlaceSearch() {
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const runSearch = useCallback(async (params) => {
    setStatus('processing');
    setError(null);
    try {
      const { data } = await searchPlaces(params);
      poll(data.jobId);
    } catch (err) {
      setStatus('failed');
      setError(err.response?.data?.message || 'Search failed');
    }
  }, []);

  const poll = (jobId) => {
    const interval = setInterval(async () => {
      const { data } = await getJobStatus(jobId);
      if (data.status === 'done') {
        clearInterval(interval);
        setResults(data.results);
        setStatus('done');
      } else if (data.status === 'failed') {
        clearInterval(interval);
        setStatus('failed');
        setError('Job failed on server');
      }
    }, 2000);
  };

  return { status, results, error, runSearch };
}
```

This hook is the one piece of real complexity on the frontend. Everything else is fairly mechanical CRUD + display.

---

## 7. Map Implementation (react-leaflet)

```jsx
// components/map/MapView.jsx
import { MapContainer, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import PlaceMarker from './PlaceMarker';

export default function MapView({ places }) {
  const center = places.length
    ? [places[0].lat, places[0].lng]
    : [19.9975, 73.7898]; // fallback: Nashik

  return (
    <MapContainer center={center} zoom={12} className="h-[500px] w-full rounded-lg">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MarkerClusterGroup>
        {places.map((p) => (
          <PlaceMarker key={p.placeId} place={p} />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
```

`react-leaflet` + OpenStreetMap tiles cost nothing and need no API key — correct call given you're already burning quota on Places API itself.

---

## 8. Design Tokens (Tailwind)

Keep it boring and consistent — this is a data tool, not a marketing site. Don't theme it like a startup landing page.

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      brand: {
        50: '#eff6ff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
      },
      success: '#16a34a',
      warning: '#d97706',
      danger: '#dc2626',
    },
  },
}
```

- Font: system default (`font-sans`), no custom webfont — not worth the load time for an internal tool.
- One accent color (brand blue), neutral grays for everything else, semantic colors only for status (success/warning/danger badges on history items and job status).

---

## 9. Component Responsibility Table

| Component | Owns State? | Notes |
|-----------|-------------|-------|
| `Search.jsx` | Yes (search params, job status, results, view toggle) | Page-level orchestrator |
| `SearchForm.jsx` | No (controlled by parent) | Pure form, emits `onSubmit` |
| `ResultsTable.jsx` | Local (sort, page) | Receives `results` as prop |
| `MapView.jsx` | No | Receives `places` as prop |
| `ExportButton.jsx` | No | Reads `selectedIds` from context |
| `History.jsx` | Yes (filters, fetched list) | |
| `Dashboard.jsx` | Yes (fetched stats) | |
| `PlaceDetail.jsx` | Yes (fetched single place via `useParams`) | |

Rule of thumb: if two sibling pages need the same piece of state, it goes in Context. If only one component needs it, it stays local. Don't default to global state for everything — that's how teams end up with a Redux store that's just a mirror of their component tree.

---

## 10. What's Deliberately Excluded (and why)

| Excluded | Reason |
|----------|--------|
| Landing Page | No anonymous users — everyone who opens this app is already a known team member with a job to do |
| Login/Register | Confirmed: single shared tool, no auth |
| Settings Page | No actual user-configurable state identified (no theme switch, no API key rotation UI, no export-format default needing persistence) |
| Export Center (page) | Export is an action tied to a results set, not a destination — it's a button, not a route |
| Heat Map | Sparse scraped data (hundreds, not millions of points) renders as a weak, patchy heat map — not worth the geospatial library overhead for this data scale |

If a real requirement shows up later that needs one of these (e.g., your team wants per-user export quotas → now you need accounts → now Settings has actual content), add it then. Building the empty page now just to "match" a generic template is wasted effort that has to be re-justified later anyway.
