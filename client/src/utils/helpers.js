/**
 * Format a phone number to be more readable
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return 'N/A';
  return phone;
};

/**
 * Format rating to always display one decimal place
 */
export const formatRating = (rating) => {
  if (rating === null || rating === undefined) return 'N/A';
  return Number(rating).toFixed(1);
};

/**
 * Clean up and format address string (e.g. remove country if redundant)
 */
export const formatAddress = (address) => {
  if (!address) return 'No address provided';
  return address;
};

/**
 * Format date string into a readable format
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

/**
 * Calculate analytics from a list of places
 */
export const calculateAnalytics = (places = [], duplicateCount = 0) => {
  const totalPlaces = places.length;
  
  const ratedPlaces = places.filter(p => typeof p.rating === 'number' && p.rating > 0);
  const avgRating = ratedPlaces.length > 0 
    ? ratedPlaces.reduce((sum, p) => sum + p.rating, 0) / ratedPlaces.length 
    : 0;

  return {
    totalPlaces,
    avgRating: parseFloat(avgRating.toFixed(2)),
    duplicateCount: duplicateCount || 0
  };
};
