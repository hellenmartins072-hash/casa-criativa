const url = 'https://lbxgbqjktvhjbsjiijxi.supabase.co/rest/v1/stores?select=*&limit=10';
const key = 'sb_publishable__nTvrtL9t4B_8gofZw_u3Q_rMmIOFPJ';
fetch(url, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } })
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(console.error);
