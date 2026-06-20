# Frontend Integration Guide for Google Places Lead Search

## 1. Purpose

This document explains how to connect the Google Places backend feature with the frontend.

The backend already provides APIs to:

```text
search places
store leads in MongoDB
list saved leads
filter leads
view search history
export CSV/Excel
```

The frontend should use these APIs to build a lead discovery dashboard where users can search for businesses, view results, filter leads, inspect lead quality, and export data.

Main frontend goal:

```text
User enters keyword + location -> Backend fetches Google Places data -> Frontend displays clean lead results in dashboard
```

---

## 2. Recommended Frontend Pages

The frontend should have these main pages:

```text
1. Dashboard Page
2. Search Leads Page
3. Leads List Page
4. Lead Details Page
5. Search History Page
6. Export Page or Export Controls
```

If you want to keep the first version simple, combine Search Leads and Leads List on one page.

---

## 3. Page 1: Dashboard Page

Route suggestion:

```text
/dashboard
```

Purpose:

The dashboard gives a quick overview of all collected leads.

### What to Show

Show summary cards:

```text
Total Leads
Hot Leads
Warm Leads
Cold Leads
Average Rating
Leads With Website
Leads With Phone
Recent Searches
```

Example layout:

```text
--------------------------------------------------
| Total Leads | Hot Leads | Warm Leads | Cold Leads |
--------------------------------------------------
| Leads With Phone | Leads With Website | Avg Rating |
--------------------------------------------------
| Recent Searches Table                          |
--------------------------------------------------
| Lead Tier Chart | Category Chart                 |
--------------------------------------------------
```

### Dashboard Cards

Cards can be calculated from `/api/places` response.

Example calculations:

```javascript
const totalLeads = places.length;
const hotLeads = places.filter((p) => p.leadTier === 'hot').length;
const warmLeads = places.filter((p) => p.leadTier === 'warm').length;
const coldLeads = places.filter((p) => p.leadTier === 'cold').length;
const withWebsite = places.filter((p) => p.website).length;
const withPhone = places.filter((p) => p.phone).length;
```

### Recommended Charts

Use simple charts first:

```text
Lead Tier Distribution: Hot / Warm / Cold
Category Distribution: hospital / restaurant / company / school
Rating Distribution: 5 star / 4 star / 3 star
```

Suggested library:

```text
Recharts
```

or keep it simple with cards and tables if you do not want charts immediately.

### Backend APIs Used

```http
GET /api/places?limit=100
GET /api/history
```

---

## 4. Page 2: Search Leads Page

Route suggestion:

```text
/search
```

Purpose:

This page allows users to search Google Places data using keyword and location.

### Form Fields

Required fields:

```text
Keyword
Location
```

Optional fields:

```text
Radius
Max Results
```

Recommended form:

```text
Keyword:     [ Manufacturing companies      ]
Location:    [ Ambad MIDC Nashik            ]
Radius:      [ 10000                         ]
Max Results: [ 10                            ]
[ Search Leads ]
```

### Important Validation

Frontend should not submit if keyword or location is empty.

If user enters only:

```text
food company
```

show:

```text
Please enter a location, for example Nashik or Ambad MIDC.
```

The backend also validates this, but frontend validation improves user experience.

### API Call

```http
POST /api/places/search
```

Request body:

```json
{
  "keyword": "Manufacturing companies",
  "location": "Ambad MIDC Nashik",
  "radius": 10000,
  "maxResults": 10
}
```

### Response Handling

The response includes:

```json
{
  "success": true,
  "jobId": "...",
  "count": 10,
  "newCount": 8,
  "duplicateCount": 2,
  "apiCalls": 11,
  "data": []
}
```

Display a summary after search:

```text
10 results found
8 new leads saved
2 duplicates skipped
11 Google API calls used
```

### Loading State

Searching may take time because the backend calls Google Details API for each place.

Show a loading state:

```text
Searching Google Places and collecting business details...
```

Disable the submit button while loading.

---

## 5. Page 3: Leads List Page

Route suggestion:

```text
/leads
```

Purpose:

This page displays all saved leads from MongoDB.

### Backend API Used

```http
GET /api/places
```

With filters:

```http
GET /api/places?keyword=Hospitals&location=Nashik
GET /api/places?tier=hot
GET /api/places?hasWebsite=true
GET /api/places?hasPhone=true
GET /api/places?minRating=4
```

### Table Columns

Recommended columns:

```text
Company / Place Name
Category
Address
Phone
Website
Rating
Reviews
Lead Score
Lead Tier
Actions
```

Example table:

```text
| Name          | Phone | Website | Rating | Reviews | Score | Tier | View |
| ABC Hospital  | Yes   | Yes     | 4.5    | 420     | 100   | Hot  | Open |
| XYZ Clinic    | Yes   | No      | 4.1    | 50      | 60    | Warm | Open |
```

### Lead Tier Styling

Use badges:

```text
Hot  -> red or strong accent
Warm -> yellow/orange
Cold -> gray/blue
```

### Filters

Add filters above the table:

```text
Search keyword
Location
Lead tier
Website available
Phone available
Minimum rating
```

### Pagination

The backend supports:

```http
GET /api/places?page=1&limit=20
```

Use pagination controls:

```text
Previous | Page 1 of 5 | Next
```

---

## 6. Page 4: Lead Details Page

Route suggestion:

```text
/leads/:id
```

Purpose:

This page shows full details for one lead.

### Backend API Used

```http
GET /api/places/:id
```

### What to Show

```text
Business name
Category
Address
Phone
Website
Rating
Review count
Opening hours
Latitude
Longitude
Lead score
Lead tier
Search keyword
Search location
Google place ID
Created date
```

### Layout Suggestion

```text
----------------------------------
Business Name               Hot Lead
Category
Address
----------------------------------
Contact
Phone
Website
----------------------------------
Lead Quality
Score
Rating
Reviews
Website Available
Phone Available
----------------------------------
Map Preview / Coordinates
----------------------------------
```

### Future AI Section

Reserve a section for future AI summary:

```text
AI Business Summary
[Generate Summary]
```

This will connect later to a Gemini API backend feature.

---

## 7. Page 5: Search History Page

Route suggestion:

```text
/history
```

Purpose:

Shows all previous search requests.

### Backend API Used

```http
GET /api/history
```

### Table Columns

```text
Keyword
Location
Radius
Status
Results Count
New Count
Duplicate Count
API Calls
Searched At
```

Example:

```text
| Keyword | Location | Status | Results | New | Duplicates | API Calls |
| Hospital | Nashik  | Done   | 10      | 8   | 2          | 11        |
```

This is useful in presentation because it shows the system tracks search activity and API usage.

---

## 8. Export Controls

Export can be placed on the Leads List page.

Buttons:

```text
Export CSV
Export Excel
```

### Backend APIs Used

```http
GET /api/export/csv
GET /api/export/excel
```

### Filtered Export

You can pass filters:

```http
GET /api/export/csv?keyword=Hospitals&location=Nashik
GET /api/export/excel?keyword=Hospitals&location=Nashik
```

### Frontend Handling

The frontend should download the file as a blob.

Example with `fetch`:

```javascript
async function downloadCsv() {
  const response = await fetch('http://localhost:5000/api/export/csv');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'places.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}
```

---

## 9. Recommended Frontend Folder Structure

Inside `client/src`:

```text
src/
  components/
    AppLayout.jsx
    DashboardCards.jsx
    LeadFilters.jsx
    LeadsTable.jsx
    SearchForm.jsx
    ExportButtons.jsx
    LoadingState.jsx
    ErrorMessage.jsx
  pages/
    DashboardPage.jsx
    SearchPage.jsx
    LeadsPage.jsx
    LeadDetailsPage.jsx
    HistoryPage.jsx
  services/
    api.js
  hooks/
    usePlaces.js
    useSearchHistory.js
  utils/
    formatters.js
  App.jsx
```

Keep API logic inside `services/api.js`, not inside every component.

---

## 10. API Service Layer

Create:

```text
client/src/services/api.js
```

Example:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

export function searchPlaces(payload) {
  return request('/places/search', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getPlaces(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/places${query ? `?${query}` : ''}`);
}

export function getPlace(id) {
  return request(`/places/${id}`);
}

export function getHistory() {
  return request('/history');
}
```

For export endpoints, use blob handling instead of this JSON helper.

---

## 11. Search Page State Flow

Search page should manage these states:

```text
form data
loading
error
search result summary
latest result data
```

Flow:

```text
User fills form
Frontend validates fields
Frontend sends POST /api/places/search
Show loading
Backend returns data
Show summary and results
Refresh leads list/dashboard
```

Example state variables:

```javascript
const [form, setForm] = useState({
  keyword: '',
  location: '',
  radius: 10000,
  maxResults: 10,
});
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [result, setResult] = useState(null);
```

---

## 12. Dashboard Design Recommendation

The dashboard should feel like a business intelligence tool, not a landing page.

Recommended layout:

```text
Top Navigation
--------------------------------------------------
Dashboard | Search Leads | Leads | History

Main Dashboard
--------------------------------------------------
Summary Cards Row
Total Leads | Hot Leads | Warm Leads | Cold Leads

Second Cards Row
With Phone | With Website | Average Rating | API Searches

Content Row
Lead Tier Distribution Chart | Recent Searches Table

Bottom Row
Recent Leads Table
```

### Dashboard Visual Style

Use a clean SaaS/dashboard style:

```text
white or very light background
compact cards
clear table borders
small status badges
simple charts
professional spacing
```

Avoid making the dashboard like a marketing homepage. Users should immediately see useful data.

---

## 13. User Journey

The ideal user journey is:

```text
1. User opens Dashboard
2. User clicks Search Leads
3. User enters keyword and location
4. Backend fetches Google Places data
5. User sees result summary
6. User opens Leads page
7. User filters hot leads
8. User opens one lead details page
9. User exports CSV/Excel
```

Presentation version:

> The frontend connects to our backend APIs and provides a complete lead discovery workflow. Users search for businesses by keyword and location, the backend collects Google Places data, and the frontend displays the cleaned leads in a dashboard. The dashboard shows lead counts, hot/warm/cold distribution, contact availability, recent searches, and a detailed table. Users can filter leads, open details, and export the data for sales or research use.

---

## 14. Error Handling on Frontend

Handle these common errors:

### Missing Location

```text
Please enter a location, for example Nashik or Ambad MIDC.
```

### Google API Key Problem

```text
Google Places API is not configured correctly. Please check the backend API key.
```

### MongoDB Problem

```text
Could not connect to database. Please check backend server logs.
```

### No Results

```text
No places found. Try a different keyword or location.
```

### Slow Search

```text
Search is taking longer because detailed business data is being collected.
```

---

## 15. First Version Build Order

Build the frontend in this order:

```text
1. API service file
2. Search page with form and result summary
3. Leads page with table
4. Filters on leads page
5. Dashboard summary cards
6. Search history page
7. Export buttons
8. Lead details page
9. Charts and map preview
```

This order gives you a working demo quickly.

---

## 16. Backend API Mapping Summary

| Frontend Feature | Backend API |
|---|---|
| Health check | `GET /api/health` |
| Search leads | `POST /api/places/search` |
| Show leads table | `GET /api/places` |
| Filter leads | `GET /api/places?keyword=&location=&tier=` |
| View lead details | `GET /api/places/:id` |
| Delete lead | `DELETE /api/places/:id` |
| Search history | `GET /api/history` |
| Export CSV | `GET /api/export/csv` |
| Export Excel | `GET /api/export/excel` |

---

## 17. Final Presentation Explanation

You can explain the frontend connection like this:

> The frontend is designed as a lead intelligence dashboard. It connects to the backend through REST APIs. The Search page sends keyword and location data to the backend, which fetches Google Places results and stores clean leads in MongoDB. The Leads page reads saved leads from the database and displays them in a table with filters for lead tier, phone availability, website availability, and rating. The Dashboard page summarizes the data using cards and charts, such as total leads, hot leads, warm leads, cold leads, and recent searches. Users can also open a detailed lead profile and export the collected data as CSV or Excel.

Short version:

```text
Frontend Form -> Backend Search API -> MongoDB Leads -> Dashboard/Table/Export
```
