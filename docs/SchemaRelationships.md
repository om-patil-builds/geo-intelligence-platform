# Backend Schema Relationship Notes

## Current Schemas

The backend currently has two MongoDB schemas:

```text
Place
SearchHistory
```

They are not connected using a strict MongoDB reference like `ObjectId`, but they are related logically through search metadata.

---

## 1. Place Schema

The `Place` collection stores the actual business/lead data collected from Google Places API.

Example fields:

```javascript
{
  placeId,
  name,
  category,
  address,
  lat,
  lng,
  phone,
  website,
  rating,
  reviewCount,
  searchKeyword,
  searchLocation,
  leadScore,
  leadTier
}
```

Main purpose:

```text
Store cleaned business leads.
```

Important field:

```text
placeId
```

`placeId` is Google's unique place ID and is used to avoid duplicate business records.

---

## 2. SearchHistory Schema

The `SearchHistory` collection stores information about each search performed by the user.

Example fields:

```javascript
{
  keyword,
  location,
  radius,
  status,
  jobId,
  resultsCount,
  newCount,
  duplicateCount,
  apiCalls
}
```

Main purpose:

```text
Track what searches were performed and how many results were found.
```

---

## 3. How They Are Related

Currently, the relationship is logical, not strict.

When a user searches:

```text
keyword = Hospitals
location = Nashik
```

A `SearchHistory` record is created:

```javascript
{
  keyword: "Hospitals",
  location: "Nashik",
  resultsCount: 10
}
```

Each saved `Place` also stores:

```javascript
{
  searchKeyword: "Hospitals",
  searchLocation: "Nashik"
}
```

So both collections are connected through:

```text
SearchHistory.keyword      <-> Place.searchKeyword
SearchHistory.location     <-> Place.searchLocation
```

This allows us to know which search discovered a place.

---

## 4. Is There a Direct Foreign Key?

No.

Currently, `Place` does not store:

```javascript
searchHistoryId: ObjectId
```

So there is no direct database-level relationship like:

```text
One SearchHistory -> Many Places
```

Instead, the relationship is based on matching keyword and location.

---

## 5. Current Relationship Type

Conceptually, the relationship is:

```text
One SearchHistory can produce many Places
```

Example:

```text
SearchHistory: Hospitals in Nashik
  -> Place: ABC Hospital
  -> Place: XYZ Hospital
  -> Place: City Care Hospital
```

But because duplicate places can appear in multiple searches, one `Place` may also be related to many searches logically.

Example:

```text
ABC Hospital may appear in:
Hospitals in Nashik
Clinics in Nashik
Emergency care in Nashik
```

So the real-world relationship is closer to:

```text
Many Searches can discover Many Places
```

---

## 6. Why We Did Not Add Strict Relationship Yet

The first backend version focuses on:

```text
Google API integration
cleaning
validation
deduplication
lead scoring
storage
```

A strict relationship was not required for the first working version because:

```text
Places can be fetched using searchKeyword/searchLocation
Search history can track summary counts
Deduplication depends mainly on Google placeId
```

This keeps the backend simple and easier to test.

---

## 7. Recommended Future Improvement

For a stronger database design, add a third collection:

```text
SearchResult
```

### SearchHistory

Stores the search request.

```javascript
{
  keyword,
  location,
  radius,
  status
}
```

### Place

Stores unique business records.

```javascript
{
  placeId,
  name,
  address,
  phone,
  website
}
```

### SearchResult

Connects searches and places.

```javascript
{
  searchHistoryId: ObjectId,
  placeId: ObjectId,
  isNew: Boolean,
  duplicate: Boolean
}
```

This creates a clean many-to-many relationship:

```text
SearchHistory -> SearchResult -> Place
```

---

## 8. Presentation Explanation

You can explain it like this:

> Currently, our backend has two main schemas: Place and SearchHistory. Place stores the actual business lead data collected from Google Places API, while SearchHistory stores metadata about each user search, such as keyword, location, result count, duplicate count, and API calls. These schemas are logically connected using the search keyword and location fields. A search can produce many places, and the saved places keep the keyword and location that discovered them. In the future, we can add a SearchResult collection to create a formal many-to-many relationship between searches and places.

Short version:

```text
SearchHistory tracks the search.
Place stores the business leads.
They are logically related by keyword and location.
Future improvement: add SearchResult for direct relationships.
```
