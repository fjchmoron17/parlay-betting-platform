// services/sportsApiService.js
import axios from 'axios';
import { SPORTS_API, MOCK_GAMES } from '../config/constants.js';

// Advanced in-memory cache with request deduplication and statistics
const CACHE_TTL_MS = parseInt(process.env.GAMES_CACHE_TTL_MS || '300000', 10); // default 5 minutes
const CACHE_REFRESH_THRESHOLD = 0.8; // Refresh cache at 80% TTL to avoid stale data
const cache = {
  all: new Map(), // key: `${region}|${markets}` -> { data, timestamp }
  perLeague: new Map(), // key: `${league}|${region}|${market}` -> { data, timestamp }
  stats: { hits: 0, misses: 0, apiCalls: 0, lastRefresh: 0 }
};

// Track API quota headers
let lastQuotaRemaining = null;
let lastQuotaUsed = null;

// Request deduplication: prevent multiple simultaneous requests for the same data
const pendingRequests = new Map(); // key: requestKey -> Promise

const now = () => Date.now();
const isFresh = (ts) => (now() - ts) < CACHE_TTL_MS;
const shouldRefresh = (ts) => (now() - ts) > (CACHE_TTL_MS * CACHE_REFRESH_THRESHOLD);

// Log cache statistics
export const getCacheStats = () => {
  const hits = cache.stats.hits;
  const misses = cache.stats.misses;
  const total = hits + misses;
  const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : 0;
  return {
    cacheHitRate: `${hitRate}%`,
    totalRequests: total,
    cacheHits: hits,
    cacheMisses: misses,
    apiCalls: cache.stats.apiCalls,
    lastRefresh: new Date(cache.stats.lastRefresh).toISOString(),
    activeCacheSize: {
      all: cache.all.size,
      perLeague: cache.perLeague.size
    }
  };
};

// Obtener lista de todos los deportes disponibles
export const getSportsAvailable = async () => {
  try {
    const apiKey = process.env.ODDS_API_KEY;
    const baseUrl = process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4';

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      console.warn('⚠️ The Odds API key no está configurada.');
      return {
        success: true,
        data: getDefaultSports(),
        source: 'Default Sports List'
      };
    }

    const response = await axios.get(`${baseUrl}/sports`, {
      params: { apiKey },
      timeout: 10000
    });

    console.log(`✅ Got ${response.data.length} sports from The Odds API`);

    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
      source: 'The Odds API'
    };
  } catch (error) {
    console.error('Error fetching sports:', error.message);
    return {
      success: true,
      data: getDefaultSports(),
      source: 'Default Sports (Fallback)'
    };
  }
};

// Obtener juegos de The Odds API con soporte para múltiples mercados
export const getGamesFromAPI = async (league = null, market = null, region = 'us') => {
  try {
    const apiKey = process.env.ODDS_API_KEY;
    const baseUrl = process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4';

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      throw new Error('❌ ODDS_API_KEY no está configurada en el backend');
    }

    const marketsToFetch = market ? [market] : ['h2h','spreads','totals'];
    const cacheKey = `${league || 'all'}|${region}|${marketsToFetch.join(',')}`;

    // Serve from cache if fresh
    if (!league) {
      const allCacheKey = `${region}|${marketsToFetch.join(',')}`;
      if (cache.all.has(allCacheKey)) {
        const cached = cache.all.get(allCacheKey);
        if (isFresh(cached.timestamp)) {
          cache.stats.hits++;
          console.log(`✅ Cache HIT for region ${region} - Served ${cached.data.length} games from memory (${((cache.stats.hits / (cache.stats.hits + cache.stats.misses)) * 100).toFixed(1)}% hit rate)`);
          return {
            success: true,
            data: cached.data,
            timestamp: new Date().toISOString(),
            source: 'Cache',
            gameCount: cached.data.length,
            region,
            quotaRemaining: lastQuotaRemaining,
            quotaUsed: lastQuotaUsed
          };
        }
      }
    }

    // Request deduplication: if same request is already in progress, wait for it
    if (pendingRequests.has(cacheKey)) {
      console.log(`⏳ Request already in progress for ${cacheKey}, waiting...`);
      return pendingRequests.get(cacheKey);
    }

    let allGames = [];
    
    // Si se especifica una liga, usarla directamente
    // Si no, usar solo las ligas principales para evitar rate limits
    const leaguesToFetch = league 
      ? [league]
      : ['americanfootball_nfl', 'basketball_nba', 'icehockey_nhl', 'basketball_ncaab'];

    // Create a promise for this request so deduplication can work
    const requestPromise = (async () => {
      cache.stats.misses++;
      console.log(`📊 Cache MISS - Fetching fresh data (${((cache.stats.hits / (cache.stats.hits + cache.stats.misses)) * 100).toFixed(1)}% hit rate)`);

      for (const sport of leaguesToFetch) {
        if (!sport) continue;

        for (const currentMarket of marketsToFetch) {
          try {
            console.log(`📡 Fetching ${sport} from The Odds API (market: ${currentMarket})...`);
            cache.stats.apiCalls++;
            
            const response = await axios.get(
              `${baseUrl}/sports/${sport}/odds`,
              {
                params: {
                  apiKey: apiKey,
                  regions: region,
                  markets: currentMarket,
                  oddsFormat: 'decimal',
                  dateFormat: 'iso',
                  limit: 50
                },
                timeout: 10000
              }
            );

            // Capture quota headers if present
            if (response?.headers) {
              lastQuotaRemaining = response.headers['x-requests-remaining'] ?? lastQuotaRemaining;
              lastQuotaUsed = response.headers['x-requests-used'] ?? lastQuotaUsed;
            }

            console.log(`✅ Got ${response.data.length} games from ${sport} (${currentMarket})`);
            
            // Log detallado para debugging
            if (response.data.length > 0) {
              const sample = response.data[0];
              console.log(`   📊 Sample game: ${sample.home_team} vs ${sample.away_team}`);
              console.log(`   📊 Bookmakers count: ${sample.bookmakers?.length || 0}`);
              if (sample.bookmakers && sample.bookmakers.length > 0) {
                console.log(`   📊 Sample bookmaker: ${sample.bookmakers[0].key}`);
              }
            }

            const mappedGames = response.data
              .filter(game => game.bookmakers && game.bookmakers.length > 0) // Solo juegos con bookmakers disponibles
              .map(game => {
                const homeOdds = getOdds(game, 'home', currentMarket);
                const awayOdds = getOdds(game, 'away', currentMarket);
                const drawOdds = getOdds(game, 'draw', currentMarket);
                
                return {
                  id: game.id,
                  league: mapSportToLeague(game.sport_title),
                  sportKey: game.sport_key,
                  sportTitle: game.sport_title,
                  home_team: game.home_team,
                  away_team: game.away_team,
                  game_time: game.commence_time,
                  odds_home: homeOdds.price,
                  odds_away: awayOdds.price,
                  odds_draw: drawOdds.price,
                  point_home: homeOdds.point, // Punto spread o total
                  point_away: awayOdds.point,
                  point_draw: drawOdds.point,
                  status: new Date(game.commence_time) > new Date() ? 'upcoming' : 'live',
                  market: currentMarket,
                  bookmakers: game.bookmakers?.slice(0, 3), // Limitar a 3 bookmakers
                  bookmakerCount: game.bookmakers?.length || 0,
                  region: region // Indicar la región de los bookmakers
                };
              });

            console.log(`✅ Filtered to ${mappedGames.length} games with available bookmakers for region ${region}`);
            
            // Si no hay juegos después del filtro, investigar por qué
            if (response.data.length > 0 && mappedGames.length === 0) {
              console.warn(`⚠️ WARNING: ${response.data.length} games fetched but 0 games after filtering`);
              console.warn(`⚠️ This might be due to bookmakers not matching region ${region}`);
            }
            
            allGames = [...allGames, ...mappedGames];
          } catch (error) {
            console.error(`❌ Error fetching ${sport} (${currentMarket}):`, error.message);
          }
        }
      }

      if (allGames.length === 0) {
        // Fallback to last cached dataset if available
        if (!league) {
          const allCacheKey = `${region}|${marketsToFetch.join(',')}`;
          if (cache.all.has(allCacheKey)) {
            const cached = cache.all.get(allCacheKey);
            console.warn(`⚠️ No games from API, serving last cached dataset for region ${region}`);
            pendingRequests.delete(cacheKey);
            return {
              success: true,
              data: cached.data,
              timestamp: new Date().toISOString(),
              source: 'Cache (Stale)',
              gameCount: cached.data.length,
              region
            };
          }
        }
        const leagueCacheKey = `${league || 'all'}|${region}|${market || 'all'}`;
        if (cache.perLeague.has(leagueCacheKey)) {
          const cached = cache.perLeague.get(leagueCacheKey);
          console.warn(`⚠️ No games from API, serving last cached dataset for ${leagueCacheKey}`);
          pendingRequests.delete(cacheKey);
          return {
            success: true,
            data: cached.data,
            timestamp: new Date().toISOString(),
            source: 'Cache (Stale)',
            gameCount: cached.data.length,
            region
          };
        }
        console.warn('⚠️ No games available from The Odds API right now');
        pendingRequests.delete(cacheKey);
        return {
          success: true,
          data: [],
          timestamp: new Date().toISOString(),
          source: 'The Odds API',
          gameCount: 0,
          region,
          message: 'No hay juegos disponibles en este momento'
        };
      }

          const result = {
            success: true,
            data: allGames,
            timestamp: new Date().toISOString(),
            source: 'The Odds API',
            gameCount: allGames.length,
            region: region,
            quotaRemaining: lastQuotaRemaining,
            quotaUsed: lastQuotaUsed
          };

      // Update cache
      if (!league) {
        const allCacheKey = `${region}|${marketsToFetch.join(',')}`;
        cache.all.set(allCacheKey, { data: allGames, timestamp: now() });
        cache.stats.lastRefresh = now();
      } else {
        const leagueCacheKey = `${league}|${region}|${market || 'all'}`;
        cache.perLeague.set(leagueCacheKey, { data: allGames, timestamp: now() });
      }

      pendingRequests.delete(cacheKey);
      return result;
    })();

    pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  } catch (error) {
    console.error('Error fetching games from The Odds API:', error.message);
    // On error, serve cached data if available
    if (!league) {
      const allCacheKey = `${region}|${marketsToFetch.join(',')}`;
      if (cache.all.has(allCacheKey)) {
        const cached = cache.all.get(allCacheKey);
        return {
          success: true,
          data: cached.data,
          timestamp: new Date().toISOString(),
          source: 'Cache (Error Fallback)',
          gameCount: cached.data.length,
          region
        };
      }
    }
    const cacheKey = `${league || 'all'}|${region}|${market || 'all'}`;
    if (cache.perLeague.has(cacheKey)) {
      const cached = cache.perLeague.get(cacheKey);
      return {
        success: true,
        data: cached.data,
        timestamp: new Date().toISOString(),
        source: 'Cache (Error Fallback)',
        gameCount: cached.data.length,
        region
      };
    }
    return {
      success: false,
      error: error.message
    };
  }
};

// Obtener juegos por región y filtros
export const getGamesByRegion = async (region = 'us', market = 'h2h') => {
  try {
    const apiKey = process.env.ODDS_API_KEY;
    const baseUrl = process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4';

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      return getGamesMock();
    }

    console.log(`📡 Fetching upcoming games from region: ${region}, market: ${market}...`);

    const response = await axios.get(
      `${baseUrl}/sports/upcoming/odds`,
      {
        params: {
          apiKey: apiKey,
          regions: region,
          markets: market,
          oddsFormat: 'decimal',
          dateFormat: 'iso',
          limit: 100
        },
        timeout: 10000
      }
    );

    console.log(`✅ Got ${response.data.length} games from region ${region}`);

    const mappedGames = response.data.map(game => ({
      id: game.id,
      league: mapSportToLeague(game.sport_title),
      sportKey: game.sport_key,
      sportTitle: game.sport_title,
      home_team: game.home_team,
      away_team: game.away_team,
      game_time: game.commence_time,
      odds_home: getOdds(game, 'home', market),
      odds_away: getOdds(game, 'away', market),
      odds_draw: getOdds(game, 'draw', market),
      status: new Date(game.commence_time) > new Date() ? 'upcoming' : 'live',
      market: market,
      region: region,
      bookmakers: game.bookmakers?.slice(0, 3)
    }));

    return {
      success: true,
      data: mappedGames,
      timestamp: new Date().toISOString(),
      source: 'The Odds API',
      gameCount: mappedGames.length,
      region: region,
      market: market
    };
  } catch (error) {
    console.error('Error fetching games by region:', error.message);
    return getGamesMock();
  }
};

// Función auxiliar para obtener las odds y valores de referencia
const getOdds = (game, team, market = 'h2h') => {
  try {
    if (!game.bookmakers || game.bookmakers.length === 0) {
      return { price: team === 'home' ? 1.85 : (team === 'draw' ? 3.5 : 2.10), point: null };
    }
    
    const bookmaker = game.bookmakers[0];
    const marketData = bookmaker.markets?.find(m => m.key === market);
    
    if (!marketData) return { price: team === 'home' ? 1.85 : (team === 'draw' ? 3.5 : 2.10), point: null };
    
    // Para mercados de totals, buscar por "Over" o "Under"
    let teamName;
    if (market === 'totals') {
      teamName = team === 'home' ? 'Over' : (team === 'away' ? 'Under' : 'Draw');
    } else {
      teamName = team === 'draw' ? 'Draw' : (team === 'home' ? game.home_team : game.away_team);
    }
    
    const outcome = marketData.outcomes.find(o => o.name === teamName);
    
    return {
      price: outcome ? outcome.price : (team === 'home' ? 1.85 : (team === 'draw' ? 3.5 : 2.10)),
      point: outcome?.point || null
    };
  } catch (error) {
    return { price: team === 'home' ? 1.85 : (team === 'draw' ? 3.5 : 2.10), point: null };
  }
};

// Mapear nombres de deportes a nuestros formatos
const mapSportToLeague = (sportTitle) => {
  if (sportTitle.includes('NFL')) return 'NFL';
  if (sportTitle.includes('NBA')) return 'NBA';
  if (sportTitle.includes('MLB')) return 'MLB';
  if (sportTitle.includes('NHL')) return 'NHL';
  if (sportTitle.includes('Soccer') || sportTitle.includes('Football')) return 'SOCCER';
  if (sportTitle.includes('Tennis')) return 'TENNIS';
  if (sportTitle.includes('Cricket')) return 'CRICKET';
  if (sportTitle.includes('Rugby')) return 'RUGBY';
  if (sportTitle.includes('Golf')) return 'GOLF';
  return 'OTHER';
};

// Deportes disponibles por defecto
const getDefaultSports = () => {
  return [
    { key: 'americanfootball_nfl', group: 'American Football', title: 'NFL', active: true },
    { key: 'basketball_nba', group: 'Basketball', title: 'NBA', active: true },
    { key: 'baseball_mlb', group: 'Baseball', title: 'MLB', active: true },
    { key: 'icehockey_nhl', group: 'Ice Hockey', title: 'NHL', active: true },
    { key: 'soccer_epl', group: 'Soccer', title: 'English Premier League', active: true },
    { key: 'soccer_la_liga', group: 'Soccer', title: 'Spanish La Liga', active: true },
    { key: 'soccer_bundesliga', group: 'Soccer', title: 'German Bundesliga', active: true },
    { key: 'soccer_serie_a', group: 'Soccer', title: 'Italian Serie A', active: true },
    { key: 'soccer_ligue_1', group: 'Soccer', title: 'French Ligue 1', active: true },
    { key: 'tennis_atp', group: 'Tennis', title: 'ATP', active: true },
    { key: 'tennis_wta', group: 'Tennis', title: 'WTA', active: true },
    { key: 'cricket_test', group: 'Cricket', title: 'Test Cricket', active: false },
    { key: 'cricket_odi', group: 'Cricket', title: 'ODI Cricket', active: false }
  ];
};

// Datos mock como fallback
const getGamesMock = (league = null) => {
  let games = [...MOCK_GAMES];
  
  if (league) {
    games = games.filter(g => g.league === league.toUpperCase());
  }
  
  return {
    success: true,
    data: games,
    timestamp: new Date().toISOString(),
    source: 'Mock Data (Fallback)'
  };
};
