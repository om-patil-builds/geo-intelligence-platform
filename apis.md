# Geo Intelligence Platform API Documentation

This document describes all API endpoints available in the Geo Intelligence Platform.

## Authentication Endpoints

All authentication routes are mounted under `/api/auth`

### Register User
- **Method**: POST
- **Path**: `/api/auth/register`
- **Description**: Register a new user account
- **Request Body**:
  ```json
  {
    "name": "string (required)",
    "email": "string (required, valid email)",
    "password": "string (required, min 6 characters)"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "token": "JWT token",
    "user": {
      "id": "user ObjectId",
      "name": "user name",
      "email": "user email"
    }
  }
  ```

### Login User
- **Method**: POST
- **Path**: `/api/auth/login`
- **Description**: Authenticate user and obtain access token
- **Request Body**:
  ```json
  {
    "email": "string (required)",
    "password": "string (required)"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "JWT token",
    "user": {
      "id": "user ObjectId",
      "name": "user name",
      "email": "user email"
    }
  }
  ```

### Get Current User
- **Method**: GET
- **Path**: `/api/auth/me`
- **Description**: Get currently authenticated user's profile
- **Headers**: Requires Authorization: Bearer `<token>`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "user": {
      "id": "user ObjectId",
      "name": "user name",
      "email": "user email"
    }
  }
  ```

### Refresh Token
- **Method**: POST
- **Path**: `/api/auth/refresh`
- **Description**: Exchange an active refresh token for a new access token (15m) and rotated refresh token (7d)
- **Cookies**: Optional `refreshToken` cookie
- **Request Body** (optional if cookie sent):
  ```json
  {
    "refreshToken": "string (optional if cookie is present)"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Token refreshed successfully",
    "token": "new short-lived access token",
    "refreshToken": "new rotated refresh token",
    "user": {
      "id": "user ObjectId",
      "name": "user name",
      "email": "user email"
    }
  }
  ```

### Logout User
- **Method**: POST
- **Path**: `/api/auth/logout`
- **Description**: Invalidate active refresh token in database and clear auth cookie
- **Cookies**: Optional `refreshToken` cookie
- **Request Body** (optional if cookie sent):
  ```json
  {
    "refreshToken": "string (optional if cookie is present)"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```


## Place Endpoints

All place-related routes are mounted under `/api/places` and require authentication

### Search Places
- **Method**: POST
- **Path**: `/api/places/search`
- **Description**: Search for places using Google Places API and store results
- **Request Body**:
  ```json
  {
    "keyword": "string (required, search term)",
    "location": "string (required, location to search)",
    "radius": "number (optional, search radius in meters)",
    "maxResults": "number (optional, max results to return, default from env)"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "jobId": "search history ID",
    "count": "total number of places returned",
    "newCount": "number of newly added places",
    "duplicateCount": "number of duplicate places found",
    "apiCalls": "number of Google Places API calls made",
    "data": [
      {
        "_id": "place ObjectId",
        "name": "place name",
        "category": "place category",
        "address": "place address",
        "phone": "place phone number",
        "website": "place website URL",
        "rating": "place rating (0-5)",
        "reviewCount": "number of reviews",
        "leadScore": "calculated lead score",
        "leadTier": "lead tier (high/medium/low)",
        "placeId": "Google Place ID",
        "searchKeyword": "keyword used for search",
        "searchLocation": "location used for search",
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      }
    ]
  }
  ```

### Get Places (with filtering and pagination)
- **Method**: GET
- **Path**: `/api/places`
- **Description**: Get paginated list of places for the authenticated user with optional filtering
- **Query Parameters**:
  - `page`: "number (optional, page number, default 1)"
  - `limit`: "number (optional, items per page, default 20, max 100)"
  - `keyword`: "string (optional, filter by keyword)"
  - `location`: "string (optional, filter by location)"
  - `city`: "string (optional, alias for location)"
  - `tier`: "string (optional, filter by lead tier: high/medium/low)"
  - `hasWebsite`: "string (optional, 'true' to filter places with website)"
  - `hasPhone`: "string (optional, 'true' to filter places with phone)"
  - `minRating`: "number (optional, minimum rating filter)"
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "page": "current page number",
    "limit": "items per page",
    "total": "total number of matching places",
    "pages": "total number of pages",
    "count": "number of places in current page",
    "data": [
      {
        "_id": "place ObjectId",
        "name": "place name",
        "category": "place category",
        "address": "place address",
        "phone": "place phone number",
        "website": "place website URL",
        "rating": "place rating (0-5)",
        "reviewCount": "number of reviews",
        "leadScore": "calculated lead score",
        "leadTier": "lead tier (high/medium/low)",
        "placeId": "Google Place ID",
        "searchKeyword": "keyword used when place was found",
        "searchLocation": "location used when place was found",
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      }
    ]
  }
  ```

### Get Place by ID
- **Method**: GET
- **Path**: `/api/places/:id`
- **Description**: Get details of a specific place by its ID
- **URL Parameters**: `id`: "place ObjectId (required)"
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "_id": "place ObjectId",
      "name": "place name",
      "category": "place category",
      "address": "place address",
      "phone": "place phone number",
      "website": "place website URL",
      "rating": "place rating (0-5)",
      "reviewCount": "number of reviews",
      "leadScore": "calculated lead score",
      "leadTier": "lead tier (high/medium/low)",
      "placeId": "Google Place ID",
      "searchKeyword": "keyword used when place was found",
      "searchLocation": "location used when place was found",
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "aiSummary": "AI-generated summary (if available)"
    }
  }
  ```

### Delete Place
- **Method**: DELETE
- **Path**: `/api/places/:id`
- **Description**: Delete a specific place by its ID
- **URL Parameters**: `id`: "place ObjectId (required)"
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Place deleted"
  }
  ```

### Get Search Status
- **Method**: GET
- **Path**: `/api/places/status/:jobId`
- **Description**: Get the status of a place search job
- **URL Parameters**: `jobId`: "search history ObjectId (required)"
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "_id": "search history ObjectId",
      "user": "user ObjectId",
      "keyword": "search keyword",
      "location": "search location",
      "radius": "search radius in meters",
      "status": "processing/done/failed",
      "resultsCount": "total places found",
      "newCount": "newly added places count",
      "duplicateCount": "duplicate places count",
      "apiCalls": "number of Google Places API calls",
      "errorMessage": "error message if status is failed",
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "jobId": "string version of _id"
    }
  }
  ```

### Generate Place Summary
- **Method**: POST
- **Path**: `/api/places/:id/summary`
- **Description**: Generate AI summary for a specific place
- **URL Parameters**: `id`: "place ObjectId (required)"
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "summary": "AI-generated summary text"
  }
  ```

## History Endpoints

All history routes are mounted under `/api/history` and require authentication

### Get Search History
- **Method**: GET
- **Path**: `/api/history`
- **Description**: Get paginated list of user's search history
- **Query Parameters**:
  - `limit`: "number (optional, max items to return, default 25, max 100)"
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "count": "number of history items returned",
    "data": [
      {
        "_id": "search history ObjectId",
        "user": "user ObjectId",
        "keyword": "search keyword",
        "location": "search location",
        "radius": "search radius in meters",
        "status": "processing/done/failed",
        "resultsCount": "total places found",
        "newCount": "newly added places count",
        "duplicateCount": "duplicate places count",
        "apiCalls": "number of Google Places API calls",
        "errorMessage": "error message if status is failed",
        "createdAt": "timestamp",
        "updatedAt": "timestamp",
        "jobId": "string version of _id"
      }
    ]
  }
  ```

### Get History Results
- **Method**: GET
- **Path**: `/api/history/:id/results`
- **Description**: Get detailed results for a specific search history entry
- **URL Parameters**: `id`: "search history ObjectId (required)"
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "history": {
        "_id": "search history ObjectId",
        "user": "user ObjectId",
        "keyword": "search keyword",
        "location": "search location",
        "radius": "search radius in meters",
        "status": "processing/done/failed",
        "resultsCount": "total places found",
        "newCount": "newly added places count",
        "duplicateCount": "duplicate places count",
        "apiCalls": "number of Google Places API calls",
        "errorMessage": "error message if status is failed",
        "createdAt": "timestamp",
        "updatedAt": "timestamp",
        "jobId": "string version of _id"
      },
      "results": [
        {
          "_id": "search result ObjectId",
          "user": "user ObjectId",
          "searchHistory": "search history ObjectId",
          "place": {
            "_id": "place ObjectId",
            "name": "place name",
            "category": "place category",
            "address": "place address",
            "phone": "place phone number",
            "website": "place website URL",
            "rating": "place rating (0-5)",
            "reviewCount": "number of reviews",
            "leadScore": "calculated lead score",
            "leadTier": "lead tier (high/medium/low)",
            "placeId": "Google Place ID",
            "searchKeyword": "keyword used when place was found",
            "searchLocation": "location used when place was found",
            "createdAt": "timestamp",
            "updatedAt": "timestamp"
          },
          "googlePlaceId": "Google Place ID",
          "isNewlyAdded": "boolean",
          "duplicate": "boolean",
          "duplicateReason": "placeId/fuzzy/none",
          "createdAt": "timestamp",
          "updatedAt": "timestamp"
        }
      ]
    }
  }
  ```

### Clear History
- **Method**: DELETE
- **Path**: `/api/history`
- **Description**: Clear all search history and associated results for the authenticated user
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Search history cleared successfully."
  }
  ```

## Export Endpoints

All export routes are mounted under `/api/export` and require authentication

### Export to CSV
- **Method**: GET
- **Path**: `/api/export/csv`
- **Description**: Export places to CSV format with optional filtering
- **Query Parameters** (same as GET `/api/places` filtering):
  - `historyId`: "string (optional, export results from specific search history)"
  - `ids`: "string (optional, comma-separated list of place IDs to export)"
  - `keyword`: "string (optional, filter by keyword)"
  - `location`: "string (optional, filter by location)"
  - `city`: "string (optional, alias for location)"
  - `tier`: "string (optional, filter by lead tier: high/medium/low)"
- **Response** (200 OK):
  - **Headers**: 
    - Content-Type: "text/csv"
    - Content-Disposition: "attachment; filename=\"<generated filename>.csv\""
  - **Body**: CSV file with columns:
    - name, category, address, phone, website, rating, reviewCount, leadScore, leadTier

### Export to Excel
- **Method**: GET
- **Path**: `/api/export/excel`
- **Description**: Export places to Excel (.xlsx) format with optional filtering
- **Query Parameters** (same as CSV export):
  - `historyId`: "string (optional, export results from specific search history)"
  - `ids`: "string (optional, comma-separated list of place IDs to export)"
  - `keyword`: "string (optional, filter by keyword)"
  - `location`: "string (optional, filter by location)"
  - `city`: "string (optional, alias for location)"
  - `tier`: "string (optional, filter by lead tier: high/medium/low)"
- **Response** (200 OK):
  - **Headers**: 
    - Content-Type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    - Content-Disposition: "attachment; filename=\"<generated filename>.xlsx\""
  - **Body**: Excel file with sheet "Places" containing columns:
    - name, category, address, phone, website, rating, reviewCount, leadScore, leadTier

## Scraping Campaign Endpoints

All scraping routes are mounted under `/api/scraping` and require authentication.

### Create Campaign
- **Method**: POST
- **Path**: `/api/scraping/campaigns`
- **Request Body**:
  ```json
  {
    "name": "string (required, e.g. Pune Gyms Outreach)",
    "topic": "string (required, e.g. Gyms, Software, NGOs)",
    "concurrency": "number (optional, 1-6, default: 3)"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Scraping campaign created successfully",
    "campaign": { "id": "...", "name": "...", "topic": "...", "status": "draft", "stats": { ... } }
  }
  ```

### List Campaigns
- **Method**: GET
- **Path**: `/api/scraping/campaigns`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "campaigns": [ ... ]
  }
  ```

### Get Campaign Details
- **Method**: GET
- **Path**: `/api/scraping/campaigns/:id`
- **Query Parameters**: `status` (all/pending/scraped/failed), `page`, `limit`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "campaign": { ... },
    "isRunning": "boolean",
    "targets": [ ... ],
    "pagination": { "total": 100, "page": 1, "pages": 2, "limit": 50 }
  }
  ```

### Add Places to Campaign
- **Method**: POST
- **Path**: `/api/scraping/campaigns/:id/add-places`
- **Request Body**:
  ```json
  {
    "placeIds": ["placeId1", "placeId2"]
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Added 15 new website(s) to campaign",
    "addedCount": 15,
    "skippedCount": 2,
    "campaign": { ... }
  }
  ```

### Start Campaign
- **Method**: POST
- **Path**: `/api/scraping/campaigns/:id/start`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Campaign scraping started",
    "campaign": { ... }
  }
  ```

### Pause Campaign
- **Method**: POST
- **Path**: `/api/scraping/campaigns/:id/pause`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Campaign scraping paused",
    "campaign": { ... }
  }
  ```

### Resume Campaign
- **Method**: POST
- **Path**: `/api/scraping/campaigns/:id/resume`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Campaign scraping resumed",
    "campaign": { ... }
  }
  ```

### Get Campaign Progress
- **Method**: GET
- **Path**: `/api/scraping/campaigns/:id/progress`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "campaign": { ... },
    "isRunning": "boolean",
    "progressPercent": 65,
    "recentActivity": [ ... ]
  }
  ```

### Stream Live Progress (Server-Sent Events)
- **Method**: GET
- **Path**: `/api/scraping/campaigns/:id/stream`
- **Response** (text/event-stream):
  - Streams real-time progress events every 2 seconds with stats and latest scraped targets.

## Email Campaign Endpoints

All email outreach routes are mounted under `/api/email` and require authentication.

### Create Email Campaign
- **Method**: POST
- **Path**: `/api/email/campaigns`
- **Request Body**:
  ```json
  {
    "name": "string (required, e.g. Pune Gyms Cold Outreach)",
    "category": "string (required, e.g. Gyms, Software, NGOs)",
    "subject": "string (optional email subject line)",
    "templateBody": "string (optional body with {businessName}, {website} variables)",
    "sendDelaySeconds": "number (optional 1-60, default: 3)"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Email outreach campaign created successfully",
    "campaign": { "id": "...", "name": "...", "category": "...", "status": "draft", "stats": { ... } }
  }
  ```

### List Email Campaigns
- **Method**: GET
- **Path**: `/api/email/campaigns`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "campaigns": [ ... ]
  }
  ```

### Get Email Campaign Details
- **Method**: GET
- **Path**: `/api/email/campaigns/:id`
- **Query Parameters**: `status` (all/pending/sent/failed), `page`, `limit`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "campaign": { ... },
    "targets": [ ... ],
    "pagination": { "total": 45, "page": 1, "pages": 1, "limit": 50 }
  }
  ```

### Update Email Campaign Template
- **Method**: PUT
- **Path**: `/api/email/campaigns/:id`
- **Request Body**:
  ```json
  {
    "subject": "Exclusive partnership for {businessName}",
    "templateBody": "Hi {businessName} team,\n\nWe came across {website} and...",
    "sendDelaySeconds": 5
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Email campaign updated successfully",
    "campaign": { ... }
  }
  ```

### Import Scraped Leads
- **Method**: POST
- **Path**: `/api/email/campaigns/:id/import-leads`
- **Request Body**:
  ```json
  {
    "scrapingCampaignId": "string (optional, import all leads from this scraping campaign)",
    "targetIds": ["targetId1", "targetId2"]
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Imported 38 new email lead(s) into campaign",
    "addedCount": 38,
    "skippedCount": 2,
    "totalEmails": 38,
    "campaign": { ... }
  }
  ```

### Get Email Campaign Progress
- **Method**: GET
- **Path**: `/api/email/campaigns/:id/progress`
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "campaign": { ... },
    "progressPercent": 50,
    "recentActivity": [ ... ]
  }
  ```

## Authentication

All endpoints except authentication routes require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained from the `/api/auth/login` or `/api/auth/register` endpoints.

## Error Responses

All endpoints may return error responses with the following format:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing or invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 409: Conflict (resource already exists)
- 500: Internal Server Error