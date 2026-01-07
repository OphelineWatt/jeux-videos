import type { Game } from "../Model/game.js";
import { initBindings, subscribe } from "./ui.service.js";
const DEFAULT_PAGE_SIZE = 20;

async function fetchPageFromApi(limit: number, offset: number, search?: string): Promise<Game[]> {
  const body: any = { limit, offset };
  if (search && search.trim()) body.search = String(search).trim();
  const response = await fetch('http://localhost:3000/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    console.error('Erreur API:', await response.text());
    return [] as Game[];
  }

  const games: Game[] = await response.json();
  return games;
}

function clearRow() {
  const row = document.getElementById('games-row');
  if (row) row.innerHTML = '';
}

function renderGames(games: Game[]) {
  const row = document.getElementById('games-row');
  if (!row) return;
  games.forEach((game: Game) => {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';

    const card = document.createElement('div');
    card.className = 'card h-100';

    if (game.cover) {
      const img = document.createElement('img');
      const cover = game.cover;
      let src: string | undefined;
      if (cover.url) src = cover.url;
      else if (cover.image_id) src = `https://images.igdb.com/igdb/image/upload/t_cover_big/${cover.image_id}.jpg`;
      if (src) {
        if (src.startsWith('//')) src = 'https:' + src;
        img.src = src;
      } else {
        img.src = 'https://via.placeholder.com/640x360?text=No+Image';
      }
      img.className = 'card-img-top';
      img.alt = game.name || 'cover';
      card.appendChild(img);
    }

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body d-flex flex-column';

    const title = document.createElement('h5');
    title.className = 'card-title';
    title.textContent = game.name || 'Titre inconnu';

    console.log(game);
    

    const text = document.createElement('p');
    text.className = 'card-text';
    let genresText = 'Genre inconnu';
    if (Array.isArray(game.genres) && game.genres.length > 0) {
      const names = game.genres.map(g => g.name).filter((n): n is string => Boolean(n));
      if (names.length > 0) genresText = names.join(', ');
      else genresText = 'Genre inconnu';
    }
    text.textContent = genresText;

    const footer = document.createElement('div');
    footer.className = 'mt-auto d-flex justify-content-between align-items-center';

    const rating = document.createElement('span');
    rating.className = 'badge bg-primary';
    rating.textContent = game.rating ? String(Math.round(game.rating)) : 'N/A';

    const btn = document.createElement('a');
    btn.className = 'btn btn-sm btn-outline-primary';
    btn.href = '#';
    btn.textContent = 'Détails';

    footer.appendChild(rating);
    footer.appendChild(btn);

    cardBody.appendChild(title);
    cardBody.appendChild(text);
    cardBody.appendChild(footer);

    card.appendChild(cardBody);
    col.appendChild(card);
    row.appendChild(col);
  });
}

export async function fetchPage(page: number) {
  const limit = DEFAULT_PAGE_SIZE;
  const offset = page * DEFAULT_PAGE_SIZE;
  return await fetchPageFromApi(limit, offset);
}

export async function initGame() {
  initBindings();

  // charger les données à chaque changement
  subscribe(async (s) => {
    clearRow();
    const games = await fetchPageFromApi(s.pageSize ?? DEFAULT_PAGE_SIZE, (s.currentPage ?? 0) * (s.pageSize ?? DEFAULT_PAGE_SIZE), s.search);
    renderGames(games);
    const next = document.getElementById('next-page') as HTMLButtonElement | null;
    if (next) next.disabled = games.length < (s.pageSize ?? DEFAULT_PAGE_SIZE);
  });
}
