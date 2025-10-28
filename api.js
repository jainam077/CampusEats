// api.js – handles all API calls
const BASE_URL = 'http://localhost:3001'; // change later to your real backend

export async function api(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

export const getVenues = () => api('/venues');
export const getMenuForVenue = (venueId) => api(`/menus?venueId=${venueId}`);
export const postReview = (data) =>
  api('/reviews', { method: 'POST', body: JSON.stringify(data) });
