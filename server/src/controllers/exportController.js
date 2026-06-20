import Place from "../models/Place.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Parser } from "json2csv";
import xlsx from "xlsx";

function buildExportQuery(query, userId) {
  const filters = { user: userId };

  if (query.ids) {
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
    latitude: place.lat,
    longitude: place.lng,
    phone: place.phone,
    website: place.website,
    rating: place.rating,
    reviewCount: place.reviewCount,
    leadScore: place.leadScore,
    leadTier: place.leadTier,
    searchKeyword: place.searchKeyword,
    searchLocation: place.searchLocation,
    googlePlaceId: place.placeId,
  }));
}

export const exportCsv = asyncHandler(async (req, res) => {
  const places = await Place.find(buildExportQuery(req.query, req.user._id)).sort({ createdAt: -1 });
  const parser = new Parser();
  const csv = parser.parse(toRows(places));

  res.header("Content-Type", "text/csv");
  res.attachment(`places-${Date.now()}.csv`);
  res.send(csv);
});

export const exportExcel = asyncHandler(async (req, res) => {
  const places = await Place.find(buildExportQuery(req.query, req.user._id)).sort({ createdAt: -1 });
  const worksheet = xlsx.utils.json_to_sheet(toRows(places));
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Places");
  const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

  res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.attachment(`places-${Date.now()}.xlsx`);
  res.send(buffer);
});
