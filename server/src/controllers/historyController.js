import SearchHistory from "../models/SearchHistory.js";
import SearchResult from "../models/SearchResult.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getHistory = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 25), 100);
  const data = await SearchHistory.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({
    success: true,
    count: data.length,
    data,
  });
});

export const getHistoryResults = asyncHandler(async (req, res) => {
  const history = await SearchHistory.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!history) {
    const error = new Error("Search history not found");
    error.statusCode = 404;
    throw error;
  }

  const results = await SearchResult.find({
    user: req.user._id,
    searchHistory: history._id,
  })
    .populate("place")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      history,
      results,
    },
  });
});
