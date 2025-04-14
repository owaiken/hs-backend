// product-metadata.js
const axios = require('axios');

async function getMetadata(productName) {
  try {
    console.log(`[📦] Fetching metadata for: ${productName}`);

    // 1. Try StockX API (unofficial, search endpoint)
    const stockxUrl = `https://stockx.com/api/browse?_search=${encodeURIComponent(productName)}`;
    const res = await axios.get(stockxUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    const product = res?.data?.Products?.[0];
    if (product) {
      return {
        image_url: product?.media?.imageUrl || null,
        lowest_price: product?.market?.lowestAsk || null,
        highest_bid: product?.market?.highestBid || null,
        url: `https://stockx.com/${product.urlKey}`
      };
    }
  } catch (err) {
    console.warn('[⚠️] StockX lookup failed:', err.message);
  }

  // 2. TODO: Add GOAT support here if needed later

  // 3. Claude fallback (optional future addition)

  return {
    image_url: null,
    lowest_price: null,
    highest_bid: null,
    url: null
  };
}

module.exports = { getMetadata };
