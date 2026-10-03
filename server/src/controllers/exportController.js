import Place from "../models/Place.js";
import SearchResult from "../models/SearchResult.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Parser } from "json2csv";
import xlsx from "xlsx";

async function buildExportQuery(query, userId) {
  const filters = { user: userId };

  if (query.historyId) {
    const searchResults = await SearchResult.find({ user: userId, searchHistory: query.historyId });
    const placeIds = searchResults.map((r) => r.place);
    filters._id = { $in: placeIds };
  } else if (query.ids) {
    filters._id = { $in: String(query.ids).split(",").map((id) => id.trim()).filter(Boolean) };
  }

  if (query.keyword) {
    filters.searchKeyword = new RegExp(String(query.keyword), "i");
  }

  if (query.location || query.city) {
    filters.searchLocation = new RegExp(String(query.location || query.city), "i");
  }

  if (query.tier) {
    filters.leadTier = query.tier;
  }

  return filters;
}

function toRows(places) {
  return places.map((place) => ({
    name: place.name,
    category: place.category,
    address: place.address,
    phone: place.phone,
    website: place.website,
    rating: place.rating,
    reviewCount: place.reviewCount,
    leadScore: place.leadScore,
    leadTier: place.leadTier,
  }));
}

function getFilename(req, places, extension) {
  let keyword = req.query.keyword;
  let location = req.query.location || req.query.city;

  if ((!keyword || !location) && places.length > 0) {
    keyword = keyword || places[0].searchKeyword;
    location = location || places[0].searchLocation;
  }

  if (keyword && location) {
    return `${keyword}_${location}.${extension}`;
  } else if (keyword) {
    return `${keyword}.${extension}`;
  } else if (location) {
    return `${location}.${extension}`;
  } else {
    return `places-export.${extension}`;
  }
}

export const exportCsv = asyncHandler(async (req, res) => {
  const queryFilters = await buildExportQuery(req.query, req.user._id);
  const places = await Place.find(queryFilters).sort({ createdAt: -1 });
  const parser = new Parser();
  const csv = parser.parse(toRows(places));

  res.header("Content-Type", "text/csv");
  res.attachment(getFilename(req, places, 'csv'));
  res.send(csv);
});

export const exportExcel = asyncHandler(async (req, res) => {
  const queryFilters = await buildExportQuery(req.query, req.user._id);
  const places = await Place.find(queryFilters).sort({ createdAt: -1 });
  const worksheet = xlsx.utils.json_to_sheet(toRows(places));
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Places");
  const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

  res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.attachment(getFilename(req, places, 'xlsx'));
  res.send(buffer);
});
