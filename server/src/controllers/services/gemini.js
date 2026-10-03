import axios from 'axios';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function generateSummary(place) {
  const apiKey = process.env.GEMINI_API_KEY;


  const prompt = `You are an intelligent Place Insight Analyst.

Analyze the provided place information and generate a concise, useful insight based on the type of place.

Instructions:

* First identify the type of place from its category, name, and available information.
* Adapt the response accordingly:

  * Company / Industry → Business Insight
  * Restaurant / Cafe → Dining Insight
  * Hotel / Resort → Hospitality Insight
  * School / College / University → Educational Insight
  * Hospital / Clinic → Healthcare Insight
  * Temple / Church / Mosque / Religious Place → Cultural & Religious Insight
  * Tourist Attraction → Visitor Insight
  * Shopping Center / Store → Commercial Insight
  * Any other place → General Place Insight

Generate the response in the following format:

Overview:
Provide a brief 2-3 sentence description of the place.

Key Highlights:
Mention the most important characteristics, services, attractions, or strengths.

Visitor / Customer Profile:
Describe who typically visits or uses this place.

Significance:
Explain why this place may be important, useful, popular, or noteworthy.

If the place is a business, additionally include:
Lead Potential:
Classify as High, Medium, or Low and explain briefly.

Rules:

* Maximum 120 words.
* Use professional and natural language.
* Do not invent facts that are not supported by the provided information.
* Use website information only if it is available in the input.
* Do not use markdown, bullet points, JSON, or special formatting.
* Return only the final insight text.

Place Information:

Name: ${place.name}
Category: ${place.category || 'N/A'}
Address: ${place.address || 'N/A'}
Phone: ${place.phone || 'N/A'}
Website: ${place.website || 'N/A'}
Rating: ${place.rating || 'N/A'}
Review Count: ${place.reviewCount || 'N/A'}
Opening Hours: ${place.openingHours?.join(', ') || 'N/A'}`;

  try {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in the server environment.');
    }

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
