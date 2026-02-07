// src/services/b2bApi.js
// API Service para endpoints B2B (Betting Houses, Bets, Reports)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

// Constante de timeout de sesión (debe coincidir con AuthContext)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

const getSessionUserRole = () => {
  try {
    const savedSession = localStorage.getItem('authSession');
    if (!savedSession) return null;
    const session = JSON.parse(savedSession);
    return session?.user?.role || null;
  } catch {
    return null;
  }
};

// Validar que la sesión no haya expirado
const checkSessionExpired = () => {
  const savedSession = localStorage.getItem('authSession');
  if (savedSession) {
    const session = JSON.parse(savedSession);
    const loginTime = session.loginTime || Date.now();
    const timeElapsed = Date.now() - loginTime;
    
    if (timeElapsed >= SESSION_TIMEOUT) {
      localStorage.removeItem('authSession');
      alert('⏱️ Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      window.location.href = '/';
      return true;
    }
  }
  return false;
};

// ============================================
// BETTING HOUSES
// ============================================

export async function getAllBettingHouses() {
  if (checkSessionExpired()) throw new Error('Sesión expirada');
  try {
    const response = await fetch(`${API_URL}/betting-houses`);
    if (!response.ok) throw new Error('Failed to fetch betting houses');
    return await response.json();
  } catch (error) {
    console.error('Error fetching betting houses:', error);
    throw error;
  }
}

export async function getBettingHouseById(id) {
  if (checkSessionExpired()) throw new Error('Sesión expirada');
  try {
    const response = await fetch(`${API_URL}/betting-houses/${id}`);
    if (!response.ok) throw new Error('Failed to fetch betting house');
    return await response.json();
  } catch (error) {
    console.error('Error fetching betting house:', error);
    throw error;
  }
}

export async function createBettingHouse(data) {
  if (checkSessionExpired()) throw new Error('Sesión expirada');
  try {
    const response = await fetch(`${API_URL}/betting-houses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create betting house');
    return await response.json();
  } catch (error) {
    console.error('Error creating betting house:', error);
    throw error;
  }
}

// Crear casa de apuestas sin sesión (afiliación pública)
export async function createBettingHousePublic(data) {
  try {
    const response = await fetch(`${API_URL}/betting-houses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to create betting house');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating betting house (public):', error);
    throw error;
  }
}

export async function getBettingHousesSummary() {
  try {
    const response = await fetch(`${API_URL}/betting-houses/summary`);
    if (!response.ok) throw new Error('Failed to fetch summary');
    return await response.json();
  } catch (error) {
    console.error('Error fetching summary:', error);
    throw error;
  }
}

export async function deleteBettingHouse(id) {
  try {
    const response = await fetch(`${API_URL}/betting-houses/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to delete betting house');
    return await response.json();
  } catch (error) {
    console.error('Error deleting betting house:', error);
    throw error;
  }
}

export async function updateBettingHouseStatus(id, status) {
  try {
    const userRole = getSessionUserRole();
    const response = await fetch(`${API_URL}/betting-houses/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(userRole ? { 'x-user-role': userRole } : {})
      },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update betting house status');
    return await response.json();
  } catch (error) {
    console.error('Error updating betting house status:', error);
    throw error;
  }
}

// ============================================
// BETS
// ============================================

export async function placeBet(betData) {
  if (checkSessionExpired()) throw new Error('Sesión expirada');
  try {
    const response = await fetch(`${API_URL}/bets-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(betData)
    });
    if (!response.ok) throw new Error('Failed to place bet');
    return await response.json();
  } catch (error) {
    console.error('Error placing bet:', error);
    throw error;
  }
}

export async function getBetsForHouse(bettingHouseId, limit = 50, offset = 0) {
  if (checkSessionExpired()) throw new Error('Sesión expirada');
  try {
    const response = await fetch(
      `${API_URL}/bets-db?betting_house_id=${bettingHouseId}&limit=${limit}&offset=${offset}`
    );
    if (!response.ok) throw new Error('Failed to fetch bets');
    return await response.json();
  } catch (error) {
    console.error('Error fetching bets:', error);
    throw error;
  }
}

export async function getBetById(betId) {
  try {
    const response = await fetch(`${API_URL}/bets-db/${betId}`);
    if (!response.ok) throw new Error('Failed to fetch bet');
    return await response.json();
  } catch (error) {
    console.error('Error fetching bet:', error);
    throw error;
  }
}

export async function settleBet(betId, status, actualWin = 0) {
  if (checkSessionExpired()) throw new Error('Sesión expirada');
  try {
    console.log(`Settling bet ${betId}: status=${status}, actualWin=${actualWin}`);
    const response = await fetch(`${API_URL}/bets-db/${betId}/settle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, actualWin })
    });
    if (!response.ok) throw new Error('Failed to settle bet');
    return await response.json();
  } catch (error) {
    console.error('Error settling bet:', error);
    throw error;
  }
}

export async function getBetStats(bettingHouseId, fromDate = null, toDate = null) {
  try {
    let url = `${API_URL}/bets-db/stats?betting_house_id=${bettingHouseId}`;
    if (fromDate) url += `&from_date=${fromDate}`;
    if (toDate) url += `&to_date=${toDate}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return await response.json();
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
}

export async function getBetsByDate(bettingHouseId, date) {
  try {
    const response = await fetch(
      `${API_URL}/bets-db/by-date?betting_house_id=${bettingHouseId}&date=${date}`
    );
    if (!response.ok) throw new Error('Failed to fetch bets by date');
    return await response.json();
  } catch (error) {
    console.error('Error fetching bets by date:', error);
    throw error;
  }
}

// ============================================
// REPORTS
// ============================================

export async function calculateDailyReport(bettingHouseId, reportDate) {
  try {
    const response = await fetch(`${API_URL}/reports/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ betting_house_id: bettingHouseId, report_date: reportDate })
    });
    if (!response.ok) throw new Error('Failed to calculate report');
    return await response.json();
  } catch (error) {
    console.error('Error calculating report:', error);
    throw error;
  }
}

export async function getDailyReportByDate(bettingHouseId, date) {
  if (checkSessionExpired()) throw new Error('Sesión expirada');
  try {
    const response = await fetch(
      `${API_URL}/reports/daily?betting_house_id=${bettingHouseId}&date=${date}`
    );
    if (!response.ok) throw new Error('Failed to fetch report');
    return await response.json();
  } catch (error) {
    console.error('Error fetching report:', error);
    throw error;
  }
}

export async function getReportsByRange(bettingHouseId, fromDate, toDate) {
  if (checkSessionExpired()) throw new Error('Sesión expirada');
  try {
    const response = await fetch(
      `${API_URL}/reports/range?betting_house_id=${bettingHouseId}&from_date=${fromDate}&to_date=${toDate}`
    );
    if (!response.ok) throw new Error('Failed to fetch reports');
    return await response.json();
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
}

export async function getLatestReport(bettingHouseId) {
  try {
    const response = await fetch(`${API_URL}/reports/latest?betting_house_id=${bettingHouseId}`);
    if (!response.ok) throw new Error('Failed to fetch latest report');
    return await response.json();
  } catch (error) {
    console.error('Error fetching latest report:', error);
    throw error;
  }
}
