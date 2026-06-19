# Place Data Extraction & Location Intelligence System
## Architecture & Developer Guide

---

## 1. What This Project Actually Is

At its core, this is a **Google Places API wrapper with a dashboard**.

You give it a keyword + city → it hits Google Places API → stores results in MongoDB → shows them on a React dashboard with filters, map view, and CSV export.

That's the 80% of it. The remaining 20% is:
- Deduplication logic (fuzzy matching)
- Job queue for large batch searches (BullMQ)
- Rate limit handling (so you don't blow your Google API quota)

Don't overcomplicate this in your head. It's a data pipeline with a UI.

---

## 2. Folder Structure

```
location-intelligence/
│
├── client/                        # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchForm.jsx
│   │   │   ├── ResultsTable.jsx
│   │   │   ├── MapView.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── ExportButton.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Results.jsx
│   │   │   └── History.jsx
│   │   ├── hooks/
│   │   │   └── usePlaces.js
│   │   ├── services/
│   │   │   └── api.js             # Axios calls to backend
│   │   └── App.jsx
│   └── package.json
│
├── server/                        # Node.js + Express backend
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── placeController.js     # Search, fetch, save logic
│   │   └── exportController.js    # CSV/Excel generation
│   ├── models/
│   │   ├── Place.js               # MongoDB schema for a business
│   │   └── SearchHistory.js       # Store past searches
│   ├── routes/
│   │   ├── placeRoutes.js
│   │   └── exportRoutes.js
│   ├── services/
│   │   ├── googlePlaces.js        # Google Places API calls
│   │   ├── deduplication.js       # Fuzzy match logic
│   │   └── validation.js          # Data cleaning
│   ├── jobs/
│   │   ├── searchWorker.js        # BullMQ worker
│   │   └── searchQueue.js         # BullMQ queue definition
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── utils/
│   │   └── logger.js              # Winston logger
│   └── index.js                   # Entry point
│
├── .env
├── docker-compose.yml             # Optional
└── README.md
```

---

## 3. Data Flow (Step-by-Step)

```
User fills search form (keyword + city + radius)
        |
        v
React sends POST /api/places/search
        |
        v
Express controller receives request
        |
        v
Job pushed to BullMQ queue (Redis)
        |
        v
Worker picks up job
        |
        v
Worker calls Google Places API
   [Text Search → Place Details for each result]
        |
        v
Raw data → Validation & Cleaning
        |
        v
Deduplication check against MongoDB
        |
        v
Clean, unique records saved to MongoDB
        |
        v
Response sent back to frontend
        |
        v
React renders table + map markers
```

---

## 4. Google Places API — The Tricky Part

This is where most teams get confused. There are **two APIs** you'll chain together:

### Step 1: Text Search API
Finds a list of places for a keyword in a city.

```
GET https://maps.googleapis.com/maps/api/place/textsearch/json
  ?query=hospitals in Nashik
  &radius=10000
  &key=YOUR_API_KEY
```

Returns: a list of places, each with `place_id`, name, address, rating, lat/lng.

**Problem:** It does NOT return phone number or website. For that you need Step 2.

### Step 2: Place Details API
For each `place_id`, fetch full details.

```
GET https://maps.googleapis.com/maps/api/place/details/json
  ?place_id=ChIJ...
  &fields=name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total
  &key=YOUR_API_KEY
```

### Important: Pagination
Text Search returns max 20 results per call. For more, use `next_page_token`:

```javascript
// First call returns up to 20 results + next_page_token
// Wait 2 seconds (Google requirement), then call again with pagetoken param
// Max 3 pages = 60 results per search
```

### API Costs (Know This Before You Build)
- Text Search: $32 per 1000 calls
- Place Details: $17 per 1000 calls
- Each search = 1 Text Search + N Place Details calls (N = number of results)
- A search returning 20 hospitals = 1 + 20 = 21 API calls

**Build a usage cap in your system. Do not skip this.**

---

## 5. MongoDB Schemas

### Place Schema (`models/Place.js`)

```javascript
const placeSchema = new mongoose.Schema({
  placeId: { type: String, unique: true, required: true }, // Google's ID
  name: { type: String, required: true },
  category: String,
  address: String,
  lat: Number,
  lng: Number,
  phone: String,
  website: String,
  rating: Number,
  reviewCount: Number,
  openingHours: [String],
  searchKeyword: String,       // What search found this
  searchLocation: String,      // Which city
  createdAt: { type: Date, default: Date.now }
});

// Geospatial index for map queries
placeSchema.index({ lat: 1, lng: 1 });
```

**Key insight:** Use `placeId` (Google's ID) as your primary dedup key. If `placeId` already exists in DB, skip the record. This alone handles 70% of your deduplication.

### SearchHistory Schema (`models/SearchHistory.js`)

```javascript
const searchHistorySchema = new mongoose.Schema({
  keyword: String,
  location: String,
  radius: Number,
  resultsCount: Number,
  status: { type: String, enum: ['pending', 'processing', 'done', 'failed'] },
  jobId: String,  // BullMQ job ID
  createdAt: { type: Date, default: Date.now }
});
```

---

## 6. Backend API Endpoints

| Method | Endpoint | What It Does |
|--------|----------|-------------|
| POST | `/api/places/search` | Trigger a new search, returns jobId |
| GET | `/api/places/status/:jobId` | Poll job progress |
| GET | `/api/places` | Get all saved places (paginated) |
| GET | `/api/places?keyword=X&city=Y` | Filter saved places |
| DELETE | `/api/places/:id` | Delete a record |
| GET | `/api/export/csv` | Download CSV |
| GET | `/api/export/excel` | Download Excel |
| GET | `/api/history` | Past search history |

---

## 7. BullMQ Job Queue — Why You Need It

Without a queue: User triggers search → backend makes 20+ API calls synchronously → request times out → user sees error.

With a queue: User triggers search → job added to queue → worker processes in background → frontend polls for status.

### Setup

```javascript
// server/jobs/searchQueue.js
import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const searchQueue = new Queue('place-search', {
  connection: redisConnection
});
```

```javascript
// server/jobs/searchWorker.js
import { Worker } from 'bullmq';

const worker = new Worker('place-search', async (job) => {
  const { keyword, location, radius } = job.data;
  
  // 1. Call Google Text Search
  // 2. For each result, call Place Details
  // 3. Validate + clean
  // 4. Dedup check
  // 5. Save to MongoDB
  // 6. Update job progress
  
  await job.updateProgress(50); // midway
  
}, { connection: redisConnection });
```

Frontend polls `GET /api/places/status/:jobId` every 2 seconds until status = `done`.

---

## 8. Deduplication Logic

**Layer 1 (Always do this):** Check if `placeId` already exists in MongoDB. If yes, skip. This is O(1) with an index.

**Layer 2 (Fuzzy match for edge cases):** Sometimes the same business appears with slightly different names across searches. Use string similarity:

```javascript
// npm install string-similarity
import stringSimilarity from 'string-similarity';

function isDuplicate(newPlace, existingPlaces) {
  for (const existing of existingPlaces) {
    const nameSim = stringSimilarity.compareTwoStrings(
      newPlace.name.toLowerCase(),
      existing.name.toLowerCase()
    );
    const distanceKm = haversineDistance(newPlace.lat, newPlace.lng, existing.lat, existing.lng);
    
    // Same-ish name AND within 100 meters = duplicate
    if (nameSim > 0.85 && distanceKm < 0.1) return true;
  }
  return false;
}
```

Don't over-engineer this. Layer 1 (placeId) handles almost everything. Layer 2 is a fallback.

---

## 9. Data Validation & Cleaning

```javascript
// server/services/validation.js

function validateAndClean(rawPlace) {
  return {
    placeId: rawPlace.place_id,
    name: rawPlace.name?.trim() || null,
    address: rawPlace.formatted_address?.trim() || null,
    lat: isValidLat(rawPlace.geometry?.location?.lat) 
         ? rawPlace.geometry.location.lat : null,
    lng: isValidLng(rawPlace.geometry?.location?.lng) 
         ? rawPlace.geometry.location.lng : null,
    phone: formatPhone(rawPlace.formatted_phone_number) || null,
    website: validateUrl(rawPlace.website) || null,
    rating: rawPlace.rating || null,
    reviewCount: rawPlace.user_ratings_total || 0,
  };
}

const isValidLat = (lat) => typeof lat === 'number' && lat >= -90 && lat <= 90;
const isValidLng = (lng) => typeof lng === 'number' && lng >= -180 && lng <= 180;
```

---

## 10. Frontend Key Components

### SearchForm
- Inputs: keyword (text), city (text), radius (slider: 1–50 km)
- On submit: POST to `/api/places/search`, get `jobId`
- Start polling `/api/places/status/:jobId`
- Show progress bar while polling

### ResultsTable
- Paginated table (20 per page)
- Columns: Name, Category, Address, Phone, Website, Rating, Reviews
- Sortable columns
- Row selection for bulk export

### MapView
- Use `react-leaflet` (free, no key needed) or Google Maps React
- Drop markers for each result
- Cluster nearby markers (use `react-leaflet-cluster`)
- Click marker → show business info popup

### ExportButton
- "Export CSV" → GET `/api/export/csv?ids=...` → download file
- Use `file-saver` npm package on frontend

---

## 11. Environment Variables

```env
# .env (server)
PORT=5000
MONGO_URI=mongodb+srv://...
GOOGLE_PLACES_API_KEY=AIza...
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

---

## 12. Tech Stack — Final Decisions

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | React + Vite + Tailwind | You know it |
| HTTP client | Axios | You know it |
| Charts | Chart.js or Recharts | Simple bar/pie charts |
| Map | react-leaflet | Free, no API key |
| Backend | Node.js + Express | You know it |
| Database | MongoDB Atlas | You know it |
| Job Queue | BullMQ + Redis | Industry standard |
| Logger | Winston | Clean logs |
| Export | exceljs / json2csv | CSV + Excel |
| Dedup | string-similarity | Fuzzy name match |
| Deploy | Render / Railway | Free tier works |

---

## 13. What to Build First (Suggested Order)

### Phase 1 — Core Pipeline (Week 1)
1. Backend: Google Places API service (Text Search + Place Details)
2. Backend: MongoDB Place model + save logic
3. Backend: Single POST `/api/places/search` endpoint (no queue yet, just sync)
4. Test with Postman — make sure data flows correctly

### Phase 2 — Frontend Basic (Week 1-2)
5. React SearchForm → call backend → display raw JSON
6. ResultsTable component
7. Basic pagination

### Phase 3 — Make It Production-Ready (Week 2)
8. Add BullMQ queue + Redis
9. Add polling on frontend
10. Deduplication logic
11. Data validation/cleaning

### Phase 4 — Polish (Week 3)
12. MapView with react-leaflet
13. CSV/Excel export
14. Dashboard analytics (charts)
15. Search history page

---

## 14. Common Mistakes to Avoid

**1. Calling Place Details API for all fields in one go without checking what you actually need**
Only request the fields you'll display. Each extra field category costs more money.

**2. Not handling Google's `next_page_token` delay**
You must wait ~2 seconds before using the token. Add `await sleep(2000)` explicitly.

**3. Storing raw Google API response in MongoDB**
Clean and transform first. Your schema should not mirror Google's response shape.

**4. No API usage tracking**
You will blow your free quota and get charged. Track how many API calls you make per search and cap it.

**5. Treating BullMQ as optional and adding it later**
Add it in Phase 1. Retrofitting async job handling into a sync architecture is painful.

**6. Using Google Maps JS for the map on frontend**
react-leaflet is free and just as good for this use case. Save the quota.

---