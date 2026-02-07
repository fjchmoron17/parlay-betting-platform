// backend/services/oddsApiClient.js
import axios from 'axios';

const BASE_URL = process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4';
let activeKeyIndex = 0;

const getOddsApiKeys = () => {
  const primary = process.env.ODDS_API_KEY;
  const backup = process.env.ODDS_APY_KEY_BK || process.env.ODDS_API_KEY_BK;

  return [primary, backup].filter(
    (key) => key && key !== 'YOUR_API_KEY_HERE'
  );
};

const getKeyOrder = (keys) => {
  if (keys.length === 0) return [];
  const start = Math.min(activeKeyIndex, keys.length - 1);
  return [...keys.slice(start), ...keys.slice(0, start)];
};

export const oddsApiGet = async (path, params = {}, config = {}) => {
  const keys = getOddsApiKeys();
  if (keys.length === 0) {
    throw new Error('❌ ODDS_API_KEY no está configurada en el backend');
  }

  const keyOrder = getKeyOrder(keys);
  let lastError;

  for (const key of keyOrder) {
    try {
      const response = await axios.get(`${BASE_URL}${path}`, {
        ...config,
        params: {
          ...params,
          apiKey: key
        }
      });

      const remaining = response?.headers?.['x-requests-remaining'];
      if (remaining === '0') {
        const usedIndex = keys.indexOf(key);
        if (usedIndex >= 0 && usedIndex < keys.length - 1) {
          activeKeyIndex = usedIndex + 1;
        }
      }

      return {
        response,
        keyUsed: key,
        quotaRemaining: remaining,
        quotaUsed: response?.headers?.['x-requests-used']
      };
    } catch (error) {
      const status = error.response?.status;
      if (status === 429) {
        const usedIndex = keys.indexOf(key);
        if (usedIndex >= 0 && usedIndex < keys.length - 1) {
          activeKeyIndex = usedIndex + 1;
          continue;
        }
      }
      lastError = error;
    }
  }

  throw lastError;
};

export const getOddsApiKeyStatus = () => {
  const keys = getOddsApiKeys();
  return {
    configuredKeys: keys.length,
    activeIndex: activeKeyIndex,
    activeKey: keys[activeKeyIndex] || null
  };
};
