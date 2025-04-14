// claude-scorer.js
require('dotenv').config();
const axios = require('axios');

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

async function scoreHype(productName, retailPrice = null, resaleListings = []) {
  const resaleLine = resaleListings.length
    ? `Resale listings: ${resaleListings.map(x => `$${x}`).join(', ')}`
    : 'No resale listings available.';

  const prompt = `
You are a product hype analyst. Given the following info:

Product: ${productName}
Retail Price: $${retailPrice || 'unknown'}
${resaleLine}

Return ONLY a valid JSON object strictly in the following format:
{
  "score": (0-100 integer),
  "verdict": "cop" | "skip" | "watch",
  "reason": (1 sentence explaining the score)
}`.trim();

  try {
    const response = await axios.post(
      CLAUDE_API_URL,
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    );

    const msg = response.data?.content?.[0]?.text;
    const parsed = JSON.parse(msg);

    if (!parsed.score || !parsed.verdict) throw new Error('Invalid Claude response.');
    return parsed;
  } catch (err) {
    console.error('[💥 Claude Error]', err.message);
    return { score: 0, verdict: 'skip', reason: 'Failed to parse AI result' };
  }
}

module.exports = { scoreHype };
