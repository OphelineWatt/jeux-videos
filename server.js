import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { log } from 'node:console';

dotenv.config();

const app = express();
app.use(cors({ origin: ['http://localhost:5175', 'http://localhost:5173'] }));
app.use(express.json());

app.post('/api/games', async (req, res) => {
  try {
    const params = new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials'
    });

    const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?${params.toString()}`, { method: 'POST' });
    if (!tokenRes.ok) return res.status(502).json({ error: 'Failed to fetch token' });
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    const limit = Number.isInteger(req.body.limit) ? req.body.limit : undefined;
    const offset = Number.isInteger(req.body.offset) ? req.body.offset : undefined;
    let query = req.body.query;
    const search = typeof req.body.search === 'string' && req.body.search.trim() ? String(req.body.search).trim() : undefined;
    if (!query) {
      // Construire une requête par défaut avec recherche/limit/offset optionnels
      const fields = 'fields name, rating, summary, cover.url, cover.image_id, genres;';
      const parts = [];
      if (search) {
        // échapper les guillemets doubles dans le terme de recherche
        const escaped = search.replace(/"/g, '\\"');
        parts.push(`search "${escaped}";`);
      }
      parts.push(fields);
      if (limit !== undefined) parts.push(`limit ${limit};`);
      if (offset !== undefined) parts.push(`offset ${offset};`);
      query = parts.join(' ');
    }

    const igdbRes = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'
      },
      body: query
    });

    if (!igdbRes.ok) {
      const text = await igdbRes.text();
      return res.status(502).json({ error: 'IGDB error', details: text });
    }

    const data = await igdbRes.json();

    // Si les jeux contiennent des ids de genres, récupérer les noms et les mapper
    try {
      // récupérer les ids de genres uniques
      const genreIds = Array.from(new Set((data || []).flatMap(g => (g.genres || []).filter(id => typeof id === 'number'))));
      if (genreIds.length > 0) {
        const genresQuery = `fields id,name; where id = (${genreIds.join(',')});`;
        const genresRes = await fetch('https://api.igdb.com/v4/genres', {
          method: 'POST',
          headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'text/plain'
          },
          body: genresQuery
        });
        if (genresRes.ok) {
          const genresData = await genresRes.json();
          const genreMap = new Map(genresData.map(g => [g.id, g.name]));
          // remplacer les ids par des objets {id, name}
          data.forEach(game => {
            if (Array.isArray(game.genres)) {
              game.genres = game.genres.map(id => ({ id, name: genreMap.get(id) || null }));
            }
          });
        }
      }
    } catch (err) {
      console.warn('Échec de la récupération/du mapping des genres', err);
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`));
