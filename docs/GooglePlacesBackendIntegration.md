# Google Places Backend Integration Documentation

## 1. Feature Summary

The Google Places backend integration is the core data collection feature of the Geo Intelligence Platform.

It allows a user to search for businesses or places by keyword and location, such as:

```text
Hospitals in Nashik
Manufacturing Companies in Ambad MIDC
Cafes in Pune
Schools in Mumbai
```

The backend sends this search request to Google Places API, collects matching businesses, fetches detailed information for each place, validates and cleans the data, removes duplicates, calculates a lead score, stores the records in MongoDB, and returns structured JSON data to the frontend.

In simple terms:

```text
User Search -> Google Places API -> Clean Data -> Remove Duplicates -> Score Leads -> Store in MongoDB -> Return Results
```

This feature converts unstructured Google Maps business listings into structured lead data that can be used for lead generation, market research, business intelligence, and location analytics.

---

Each part has a clear responsibility:

| File / Folder | Purpose |
|---|---|
| `app.js` | Creates the Express app and registers routes/middleware |
| `server.js` | Starts the server and connects MongoDB |
| `config/db.js` | MongoDB connection logic |
| `models/Place.js` | MongoDB schema for business/place records |
| `models/SearchHistory.js` | Stores search request history and status |
| `services/googlePlaces.js` | Handles Google Places API calls |
| `services/validation.js` | Cleans and validates raw Google data |
| `services/deduplication.js` | Detects duplicate businesses |
| `services/leadScoring.js` | Calculates lead score and lead tier |
| `controllers/placeController.js` | Handles place search/list/delete/status API logic |
| `controllers/exportController.js` | Exports stored places as CSV or Excel |
| `routes/` | Defines backend API endpoints |

---

## 3. APIs Used

### 3.1 Internal Backend APIs

These are the APIs exposed by our own Express backend.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Checks if backend is running |
| `POST` | `/api/places/search` | Searches Google Places and stores results |
| `GET` | `/api/places` | Gets saved places from MongoDB |
| `GET` | `/api/places/:id` | Gets one saved place by MongoDB ID |
| `GET` | `/api/places/status/:jobId` | Gets status of a search request |
| `DELETE` | `/api/places/:id` | Deletes a saved place |
| `GET` | `/api/history` | Gets previous search history |
| `GET` | `/api/export/csv` | Downloads saved places as CSV |
| `GET` | `/api/export/excel` | Downloads saved places as Excel file |

### 3.2 Google APIs Used

The backend uses the standard Google Places Web Service APIs.

#### API 1: Google Places Text Search API

Endpoint:

```text
https://maps.googleapis.com/maps/api/place/textsearch/json
```

Purpose:

This API searches for places matching a keyword and location.

Example query:

```text
Hospitals in Nashik
```

It returns basic information such as:

```text
place_id
name
formatted_address
rating
geometry/location
business types
```

This API is used first because it gives us a list of matching places.

#### API 2: Google Place Details API

Endpoint:

```text
https://maps.googleapis.com/maps/api/place/details/json
```

Purpose:

Text Search does not return all useful business data. For example, phone number, website, and opening hours usually require a separate details request.

For every `place_id` returned by Text Search, the backend calls Place Details API.

Fields requested:

```text
place_id
name
types
formatted_address
geometry
formatted_phone_number
international_phone_number
website
rating
user_ratings_total
opening_hours
```

This gives richer business data for each lead.

---

## 4. Required Environment Variables

The backend reads configuration from `server/.env`.

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/weservehealthy
GOOGLE_PLACES_API_KEY=your_google_cloud_api_key
GOOGLE_MAX_RESULTS=40
GOOGLE_TEXT_SEARCH_MAX_PAGES=3
API_RATE_LIMIT=100
```

Important variables:

| Variable | Purpose |
|---|---|
| `PORT` | Backend server port |
| `MONGO_URI` | MongoDB connection string |
| `GOOGLE_PLACES_API_KEY` | Google Cloud API key with Places API enabled |
| `GOOGLE_MAX_RESULTS` | Maximum results to fetch per search |
| `GOOGLE_TEXT_SEARCH_MAX_PAGES` | Maximum Google result pages to request |
| `API_RATE_LIMIT` | Limits backend requests to protect the server |

For the current backend, enable **Places API** in Google Cloud and add that key as:

```env
GOOGLE_PLACES_API_KEY=your_key_here
```

---

## 5. Complete Search Flow

When the frontend or Postman sends this request:

```http
POST /api/places/search
Content-Type: application/json
```

Request body:

```json
{
  "keyword": "Hospitals",
  "location": "Nashik",
  "radius": 10000,
  "maxResults": 10
}
```

The backend performs these steps:

### Step 1: Validate User Input

The backend checks that both `keyword` and `location` are provided.

If missing, it returns an error:

```json
{
  "success": false,
  "message": "keyword and location are required"
}
```

### Step 2: Create Search History Record

A new record is created in MongoDB in the `SearchHistory` collection.

Initial status:

```text
processing
```

This lets us track what search was performed and whether it succeeded or failed.

### Step 3: Call Google Text Search API

The backend creates a query like:

```text
Hospitals in Nashik
```

Then it calls Google Text Search API.

Text Search returns a list of places with Google `place_id` values.

### Step 4: Handle Pagination

Google Text Search returns limited results per request.

If Google returns a `next_page_token`, the backend waits around 2 seconds before requesting the next page. This delay is required because Google page tokens are not immediately active.

The backend limits pagination using:

```env
GOOGLE_TEXT_SEARCH_MAX_PAGES=3
```

This protects API quota and cost.

### Step 5: Call Place Details API

For each result from Text Search, the backend calls Place Details API using the place's `place_id`.

This fetches:

```text
phone number
website
opening hours
review count
complete address
coordinates
rating
```

### Step 6: Validate and Clean Data

Raw Google data is passed through validation logic before saving.

Invalid or missing fields are converted to safe values like `null` or empty arrays.

### Step 7: Remove Duplicates

The backend checks whether the place already exists in MongoDB.

Primary duplicate check:

```text
Google place_id
```

If a place with the same `placeId` already exists, it is skipped.

Secondary duplicate check:

```text
similar name + nearby coordinates
```

This catches cases where similar records may not have the same ID.

### Step 8: Calculate Lead Score

Each clean place is scored based on available business signals.

The score helps classify leads into:

```text
hot
warm
cold
```

### Step 9: Save New Places in MongoDB

Only new, clean, non-duplicate records are inserted into the `Place` collection.

### Step 10: Update Search History

The search history is updated with:

```text
status
results count
new records count
duplicate count
Google API call count
error message if failed
```

### Step 11: Return Response

The API returns structured data to the frontend/Postman.

Example response:

```json
{
  "success": true,
  "jobId": "665...",
  "count": 10,
  "newCount": 8,
  "duplicateCount": 2,
  "apiCalls": 11,
  "data": []
}
```

---

## 6. Database Design

### 6.1 Place Collection

The `Place` model stores each business/place record.

Schema fields:

```javascript
{
  placeId: String,
  name: String,
  category: String,
  address: String,
  lat: Number,
  lng: Number,
  phone: String,
  website: String,
  rating: Number,
  reviewCount: Number,
  openingHours: [String],
  searchKeyword: String,
  searchLocation: String,
  leadScore: Number,
  leadTier: String,
  rawTypes: [String],
  source: String
}
```

Example stored record:

```json
{
  "placeId": "ChIJxxxxxxx",
  "name": "ABC Hospital",
  "category": "hospital",
  "address": "Nashik, Maharashtra",
  "lat": 19.9975,
  "lng": 73.7898,
  "phone": "+91 98765 43210",
  "website": "https://abchospital.com/",
  "rating": 4.5,
  "reviewCount": 420,
  "openingHours": ["Monday: Open 24 hours"],
  "searchKeyword": "Hospitals",
  "searchLocation": "Nashik",
  "leadScore": 100,
  "leadTier": "hot",
  "source": "google_places"
}
```

Important database indexes:

```javascript
placeId unique index
lat/lng index
searchKeyword/searchLocation index
```

Why `placeId` is important:

Google gives each place a unique `place_id`. This is the strongest deduplication key because the same business should have the same Google place ID across searches.

### 6.2 SearchHistory Collection

The `SearchHistory` model stores metadata about each search.

Schema fields:

```javascript
{
  keyword: String,
  location: String,
  radius: Number,
  status: String,
  jobId: String,
  resultsCount: Number,
  newCount: Number,
  duplicateCount: Number,
  apiCalls: Number,
  errorMessage: String
}
```

Example:

```json
{
  "keyword": "Hospitals",
  "location": "Nashik",
  "radius": 10000,
  "status": "done",
  "jobId": "665...",
  "resultsCount": 10,
  "newCount": 8,
  "duplicateCount": 2,
  "apiCalls": 11
}
```

This helps in presentation because it proves the system tracks API usage, search status, and duplicate handling.

---

## 7. Data Validation Logic

Validation happens in:

```text
server/services/validation.js
```

The purpose is to make sure only clean, safe, consistent data is saved.

### 7.1 Name Validation

A place must have:

```text
place_id
name
```

If either is missing, the record is ignored.

Reason:

Without a name or place ID, the record cannot be reliably displayed or deduplicated.

### 7.2 Coordinate Validation

Latitude must be between:

```text
-90 and 90
```

Longitude must be between:

```text
-180 and 180
```

Invalid coordinates are saved as:

```javascript
null
```

This prevents broken map markers.

### 7.3 Phone Validation

Phone numbers are normalized by trimming spaces and cleaning repeated whitespace.

If phone number is missing:

```javascript
phone: null
```

### 7.4 Website Validation

Website URLs are checked using JavaScript's `URL` parser.

If the website is valid, it is stored in normalized URL form.

If invalid or missing:

```javascript
website: null
```

### 7.5 Rating and Review Validation

Rating is stored only if it is a number.

If missing:

```javascript
rating: null
```

Review count defaults to:

```javascript
reviewCount: 0
```

### 7.6 Opening Hours Validation

Opening hours are stored as an array.

If Google does not return opening hours:

```javascript
openingHours: []
```

---

## 8. Data Deduplication Logic

Deduplication happens in:

```text
server/services/deduplication.js
server/controllers/placeController.js
```

The goal is to avoid saving the same business multiple times.

### 8.1 Primary Deduplication: Google Place ID

Each Google business has a `place_id`.

Before inserting new places, the backend checks MongoDB:

```javascript
Place.find({ placeId: { $in: incomingPlaceIds } })
```

If a place with the same `placeId` already exists, it is counted as duplicate and skipped.

This is the strongest dedupe method.

Example:

```text
Search 1: Hospitals in Nashik -> ABC Hospital saved
Search 2: Clinics in Nashik -> ABC Hospital appears again
Same placeId found -> skip duplicate
```

### 8.2 Secondary Deduplication: Fuzzy Name + Distance

Sometimes duplicate-like businesses may appear with slightly different names.

Example:

```text
ABC Industries
ABC Industries Pvt Ltd
```

The backend compares:

```text
business name similarity
geographic distance
```

A record is considered duplicate if:

```text
name similarity >= 0.86
AND distance <= 0.1 km
```

That means if two businesses have very similar names and are within 100 meters, the new one is skipped.

### 8.3 Why Two-Level Deduplication Is Used

| Layer | What it catches |
|---|---|
| Place ID check | Exact Google duplicates |
| Fuzzy check | Similar duplicate records with small naming differences |

This improves data quality and keeps the database clean.

---

## 9. Lead Scoring Logic

Lead scoring happens in:

```text
server/services/leadScoring.js
```

The goal is to rank businesses based on how useful they are as leads.

The current score is rule-based, not AI-based.

### 9.1 Score Formula

```javascript
let score = 0;

if (website) score += 30;
if (phone) score += 20;
if (address) score += 15;
if (lat and lng exist) score += 10;
if (rating >= 4) score += 15;
if (reviewCount >= 25) score += 10;
```

Maximum score:

```text
100
```

### 9.2 Lead Tier Classification

After score is calculated, the backend assigns a tier.

| Score | Tier |
|---|---|
| 80 - 100 | Hot Lead |
| 60 - 79 | Warm Lead |
| 0 - 59 | Cold Lead |

### 9.3 Why These Rules Make Sense

| Signal | Meaning |
|---|---|
| Website available | Business has online presence |
| Phone available | Business is contactable |
| Address available | Business location is clear |
| Coordinates available | Can be shown on map |
| Rating above 4 | Good public reputation |
| Many reviews | More reliable Google profile |

Example:

```text
Business A has website, phone, address, coordinates, 4.5 rating, 100 reviews
Score = 100 -> Hot Lead
```

```text
Business B has address only and low reviews
Score = 15 -> Cold Lead
```

This helps sales teams quickly prioritize which leads to contact first.

---

## 10. Export Feature

The backend supports exporting saved leads.

### CSV Export

Endpoint:

```http
GET /api/export/csv
```

Returns a `.csv` file.

### Excel Export

Endpoint:

```http
GET /api/export/excel
```

Returns a `.xlsx` file.

Exported fields include:

```text
name
category
address
latitude
longitude
phone
website
rating
reviewCount
leadScore
leadTier
searchKeyword
searchLocation
googlePlaceId
```

This is useful for sales teams because they can download leads and use them in Excel or CRM tools.

---

## 11. Error Handling

The backend has centralized error handling in:

```text
server/middleware/errorHandler.js
```

If something fails, the API returns a structured JSON response.

Example:

```json
{
  "success": false,
  "message": "Google Places Text Search failed with status REQUEST_DENIED",
  "details": "The provided API key is invalid."
}
```

Common error cases:

| Error | Cause |
|---|---|
| `GOOGLE_PLACES_API_KEY is required` | API key missing from `.env` |
| `REQUEST_DENIED` | Wrong key, API not enabled, billing disabled, or key restricted incorrectly |
| Mongo connection error | MongoDB not running or wrong `MONGO_URI` |
| `keyword and location are required` | Invalid request body |

---

## 12. How to Test in Postman

### 12.1 Health Check

```http
GET http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "service": "geo-intelligence-api"
}
```

### 12.2 Search Places

```http
POST http://localhost:5000/api/places/search
```

Headers:

```text
Content-Type: application/json
```

Body:

```json
{
  "keyword": "Hospitals",
  "location": "Nashik",
  "radius": 10000,
  "maxResults": 5
}
```

Use a small `maxResults` during testing to reduce Google API usage.

### 12.3 Get Saved Places

```http
GET http://localhost:5000/api/places
```

### 12.4 Filter Saved Places

```http
GET http://localhost:5000/api/places?keyword=Hospitals&location=Nashik
```

### 12.5 Get Search History

```http
GET http://localhost:5000/api/history
```

### 12.6 Export CSV

```http
GET http://localhost:5000/api/export/csv
```

### 12.7 Export Excel

```http
GET http://localhost:5000/api/export/excel
```

---

## 13. Presentation Explanation

You can explain this feature like this:

> This feature is the main data pipeline of our Geo Intelligence Platform. The user enters a keyword and location, for example Hospitals in Nashik. Our backend calls Google Places Text Search API to find matching businesses. Then, for each Google place ID, it calls Place Details API to collect richer information such as phone number, website, rating, reviews, address, and opening hours.
>
> The raw data is not stored directly. It first passes through validation and cleaning, where invalid coordinates, missing websites, missing phone numbers, and inconsistent fields are handled safely. Then we apply deduplication using Google place ID as the primary key. We also use fuzzy duplicate detection based on similar names and nearby coordinates.
>
> After that, the backend calculates a lead score. Businesses with website, phone number, good rating, review count, address, and coordinates get a higher score. Based on this score, each lead is marked as hot, warm, or cold. Finally, the clean and scored records are stored in MongoDB and returned to the frontend for dashboard display, filtering, and export.

Short version:

```text
Search -> Google APIs -> Details Fetch -> Validation -> Deduplication -> Lead Scoring -> MongoDB -> Dashboard/Export
```

---

## 14. Why This Feature Is Useful

This feature is useful because it automates manual business research.

Instead of manually searching Google Maps and copying data one by one, the system automatically collects structured business information.

Benefits:

```text
Faster lead generation
Cleaner business database
Reduced duplicate records
Lead prioritization using score
CSV/Excel export for sales teams
Reusable search history
Map-ready coordinates
```

For example, a sales team can search:

```text
Manufacturing companies in Ambad MIDC
```

and quickly get a prioritized list of companies with phone numbers, websites, ratings, addresses, and lead scores.

---

## 15. Current Limitations and Future Improvements

Current implementation is synchronous, meaning the request waits until Google API calls complete.

Future improvements:

```text
Add BullMQ and Redis for background jobs
Add AI summary generation using Gemini or another LLM
Add user authentication around saved searches
Add map visualization on frontend
Add advanced filters and analytics dashboard
Add quota tracking per user
Add retry mechanism for temporary Google API failures
```

These improvements are already aligned with the project architecture documents.
