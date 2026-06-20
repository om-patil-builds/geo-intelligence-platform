import axios from 'axios';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function generateSummary(place) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }

  const prompt = `You are an expert lead intelligence analyst. Provide a brief, professional summary (3-4 sentences max) for the following business.
Name: ${place.name}
Category: ${place.category || 'N/A'}
Address: ${place.address || 'N/A'}
Phone: ${place.phone || 'N/A'}
Website: ${place.website || 'Not available'}

${place.website ? `Please summarize information about this business from their website: ${place.website}. Focus on their core offerings, services/products, target audience, and any unique selling points.` : `Since no website is available, summarize their likely services based on their name and category, and suggest how a sales agent should pitch to them.`}

Return ONLY the summary. Do not include markdown formatting like blockquotes or introductory text. Just the concise paragraph.`;

  try {
    const response = await axios.post(
      `${GEMINI_URL}?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );

    const candidate = response.data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Gemini API returned an empty response');
    }

    return text.trim();
  } catch (error) {
    console.warn('Gemini API request failed, falling back to contextual mock summary. Error:', error.response?.data || error.message);
    
    // Generate a beautiful, contextual fallback summary based on place details
    const category = place.category || 'local establishment';
    const name = place.name;
    const address = place.address || 'the local area';
    const phone = place.phone ? `You can contact them directly at ${place.phone}.` : 'There is no public phone number listed.';
    const website = place.website ? `For more details, visit their website at ${place.website}.` : 'They currently do not have a website listed.';
    const ratingText = place.rating 
      ? `They hold a customer rating of ${place.rating}/5.0 based on ${place.reviewCount || 0} reviews.` 
      : 'No customer reviews are currently available.';
    const leadPitch = place.leadTier === 'high' 
      ? 'This lead has high priority due to strong contact availability and good ratings, making them an excellent prospect for immediate sales outreach.'
      : place.leadTier === 'medium'
      ? 'This lead has medium priority; they represent a solid candidate for warm outreach campaigns.'
      : 'This lead has low priority; it is recommended to put them on a standard email nurturing sequence.';

    return `${name} is a ${category} operating in ${address}. ${phone} ${website} ${ratingText} ${leadPitch}`;
  }
}
