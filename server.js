import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
// Allow Vite dev servers (5175 and 5173) during development
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

    const query = req.body.query || 'fields name, rating; limit 10;';

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
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`));
