// config/constants.js
export const SPORTS_API = {
  ODDS_API: {
    BASE_URL: process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4',
    API_KEY: process.env.ODDS_API_KEY,
    SPORTS_MAP: {
      'NFL': 'americanfootball_nfl',
      'NBA': 'basketball_nba',
      'MLB': 'baseball_mlb',
      'NHL': 'icehockey_nhl',
      'SOCCER': [
        'soccer_epl',
        'soccer_la_liga',
        'soccer_bundesliga',
        'soccer_serie_a',
        'soccer_ligue_1',
        'soccer_championship',
        'soccer_primeira_liga'
      ],
      'TENNIS': ['tennis_atp', 'tennis_wta'],
      'CRICKET': ['cricket_test', 'cricket_odi'],
      'RUGBY': 'rugby_union',
      'GOLF': 'golf_pga'
    },
    BOOKMAKERS: ['draftkings', 'fanduel', 'betmgm', 'betrivers'],
    MARKETS: {
      'h2h': 'Head to Head (Ganador)',
      'spreads': 'Spreads (Margen)',
      'totals': 'Totales (Over/Under)'
    },
    REGIONS: {
      'us': 'Estados Unidos',
      'uk': 'Reino Unido',
      'eu': 'Europa',
      'au': 'Australia'
    }
  },
  THESPORTSDB: {
    BASE_URL: 'https://www.thesportsdb.com/api/v1/json/3/',
    ENDPOINTS: {
      NBA_EVENTS: 'eventslast.php?id=',
      NFL_EVENTS: 'eventslast.php?id=',
      MLB_EVENTS: 'eventslast.php?id=',
    }
  }
};

export const MOCK_GAMES = [
  {
    id: 'nba_20240118_lal_gsw',
    league: 'NBA',
    home_team: 'Lakers',
    away_team: 'Warriors',
    game_time: new Date(Date.now() + 86400000).toISOString(),
    odds_home: 1.85,
    odds_away: 2.10,
    status: 'upcoming'
  },
  {
    id: 'nba_20240118_bos_mia',
    league: 'NBA',
    home_team: 'Celtics',
    away_team: 'Heat',
    game_time: new Date(Date.now() + 172800000).toISOString(),
    odds_home: 1.95,
    odds_away: 1.90,
    status: 'upcoming'
  },
  {
    id: 'mlb_20240118_lad_sd',
    league: 'MLB',
    home_team: 'Dodgers',
    away_team: 'Padres',
    game_time: new Date(Date.now() + 259200000).toISOString(),
    odds_home: 2.0,
    odds_away: 4.0,
    status: 'upcoming'
  },
  {
    id: 'mlb_20240118_nyy_bos',
    league: 'MLB',
    home_team: 'Yankees',
    away_team: 'Red Sox',
    game_time: new Date(Date.now() + 345600000).toISOString(),
    odds_home: 1.70,
    odds_away: 2.30,
    status: 'upcoming'
  },
  {
    id: 'nfl_20240118_kc_buf',
    league: 'NFL',
    home_team: 'Chiefs',
    away_team: 'Bills',
    game_time: new Date(Date.now() + 432000000).toISOString(),
    odds_home: 1.75,
    odds_away: 2.20,
    status: 'upcoming'
  }
];
