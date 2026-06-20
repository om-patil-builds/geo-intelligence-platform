import mongoose from "mongoose";

import Place from "../models/Place.js";
import SearchHistory from "../models/SearchHistory.js";
import SearchResult from "../models/SearchResult.js";
import asyncHandler from "../utils/asyncHandler.js";
import { isFuzzyDuplicate } from "./services/deduplication.js";
import { searchGooglePlaces } from "./services/googlePlaces.js";
import { validateAndCleanPlace } from "./services/validation.js";

function parsePositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildPlaceQuery(query, userId) {
  const filters = { user: userId };

  if (query.keyword) {
    filters.searchKeyword = new RegExp(String(query.keyword), "i");
  }

  if (query.location || query.city) {
    filters.searchLocation = new RegExp(String(query.location || query.city), "i");
  }

  if (query.tier) {
    filters.leadTier = query.tier;
  }

  if (query.hasWebsite === "true") {
    filters.website = { $ne: null };
  }

  if (query.hasPhone === "true") {
    filters.phone = { $ne: null };
  }

  if (query.minRating) {
    filters.rating = { $gte: Number(query.minRating) };
  }

  return filters;
}

const searchPlaces = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const keyword = String(req.body.keyword || "").trim();
  const location = String(req.body.location || req.body.city || "").trim();
  const radius = parsePositiveNumber(req.body.radius, 10000);
  const maxResults = parsePositiveNumber(req.body.maxResults, Number(process.env.GOOGLE_MAX_RESULTS || 40));

  if (!keyword || !location) {
    const error = new Error("keyword and location are required");
    error.statusCode = 400;
    throw error;
  }

  const history = await SearchHistory.create({
    user: userId,
    keyword,
    location,
    radius,
    status: "processing",
  });
  history.jobId = history._id.toString();
  await history.save();

  try {
    const googleResult = await searchGooglePlaces({ keyword, location, radius, maxResults });
    const cleanedPlaces = googleResult.places
      .map((place) => validateAndCleanPlace(place, { keyword, location }))
      .filter(Boolean);

    const existingByPlaceId = await Place.find({
      user: userId,
      placeId: { $in: cleanedPlaces.map((place) => place.placeId) },
    });
    const existingByPlaceIdMap = new Map(existingByPlaceId.map((place) => [place.placeId, place]));
    const fuzzyComparisonPlaces = await Place.find({
      user: userId,
      searchLocation: new RegExp(location, "i"),
    }).limit(500);

    const searchResultWrites = [];
    const relatedPlaceIds = [];
    const insertedPlaces = [];
    let duplicateCount = 0;

    for (const cleanedPlace of cleanedPlaces) {
      const existingPlace = existingByPlaceIdMap.get(cleanedPlace.placeId);

      if (existingPlace) {
        duplicateCount += 1;
        relatedPlaceIds.push(existingPlace._id);
        searchResultWrites.push({
          updateOne: {
            filter: { user: userId, searchHistory: history._id, place: existingPlace._id },
            update: {
              $setOnInsert: {
                user: userId,
                searchHistory: history._id,
                place: existingPlace._id,
                googlePlaceId: cleanedPlace.placeId,
                isNew: false,
                duplicate: true,
                duplicateReason: "placeId",
              },
            },
            upsert: true,
          },
        });
        continue;
      }

      const fuzzyDuplicate = [...fuzzyComparisonPlaces, ...insertedPlaces].find((place) => (
        isFuzzyDuplicate(cleanedPlace, [place])
      ));

      if (fuzzyDuplicate) {
        duplicateCount += 1;
        relatedPlaceIds.push(fuzzyDuplicate._id);
        searchResultWrites.push({
          updateOne: {
            filter: { user: userId, searchHistory: history._id, place: fuzzyDuplicate._id },
            update: {
              $setOnInsert: {
                user: userId,
                searchHistory: history._id,
                place: fuzzyDuplicate._id,
                googlePlaceId: cleanedPlace.placeId,
                isNew: false,
                duplicate: true,
                duplicateReason: "fuzzy",
              },
            },
            upsert: true,
          },
        });
        continue;
      }

      const createdPlace = await Place.create({
        ...cleanedPlace,
        user: userId,
      });
      insertedPlaces.push(createdPlace);
      relatedPlaceIds.push(createdPlace._id);
      existingByPlaceIdMap.set(createdPlace.placeId, createdPlace);

      searchResultWrites.push({
        updateOne: {
          filter: { user: userId, searchHistory: history._id, place: createdPlace._id },
          update: {
            $setOnInsert: {
              user: userId,
              searchHistory: history._id,
              place: createdPlace._id,
              googlePlaceId: createdPlace.placeId,
              isNew: true,
              duplicate: false,
              duplicateReason: "none",
            },
          },
          upsert: true,
        },
      });
    }

    if (searchResultWrites.length > 0) {
      await SearchResult.bulkWrite(searchResultWrites, { ordered: false });
    }

    history.status = "done";
    history.resultsCount = cleanedPlaces.length;
    history.newCount = insertedPlaces.length;
    history.duplicateCount = duplicateCount;
    history.apiCalls = googleResult.apiCalls;
    await history.save();

    const data = await Place.find({
      user: userId,
      _id: { $in: relatedPlaceIds },
    }).sort({ leadScore: -1, rating: -1 });

    res.status(201).json({
      success: true,
      jobId: history.jobId,
      count: data.length,
      newCount: insertedPlaces.length,
      duplicateCount,
      apiCalls: googleResult.apiCalls,
      data,
    });
  } catch (error) {
    history.status = "failed";
    history.errorMessage = error.message;
    await history.save();
    throw error;
  }
});

const getPlaces = asyncHandler(async (req, res) => {
  const page = parsePositiveNumber(req.query.page, 1);
  const limit = Math.min(parsePositiveNumber(req.query.limit, 20), 100);
  const skip = (page - 1) * limit;
  const filters = buildPlaceQuery(req.query, req.user._id);

  const [data, total] = await Promise.all([
    Place.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Place.countDocuments(filters),
  ]);

  res.json({
    success: true,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    count: data.length,
    data,
  });
});

const getPlaceById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    const error = new Error("Invalid place id");
    error.statusCode = 400;
    throw error;
  }

  const place = await Place.findOne({ _id: req.params.id, user: req.user._id });

  if (!place) {
    const error = new Error("Place not found");
    error.statusCode = 404;
    throw error;
  }

  res.json({ success: true, data: place });
});

const deletePlace = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    const error = new Error("Invalid place id");
    error.statusCode = 400;
    throw error;
  }

  const deleted = await Place.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!deleted) {
    const error = new Error("Place not found");
    error.statusCode = 404;
    throw error;
  }

  await SearchResult.deleteMany({ user: req.user._id, place: deleted._id });

  res.json({ success: true, message: "Place deleted" });
});

const getSearchStatus = asyncHandler(async (req, res) => {
  const history = await SearchHistory.findOne({
    user: req.user._id,
    jobId: req.params.jobId,
  });

  if (!history) {
    const error = new Error("Search job not found");
    error.statusCode = 404;
    throw error;
  }

  res.json({ success: true, data: history });
});

export {
  deletePlace,
  getPlaceById,
  getPlaces,
  getSearchStatus,
  searchPlaces,
};
