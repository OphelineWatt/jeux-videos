type Listener = (state: { currentPage: number; pageSize: number; search: string }) => void;

const state = {
  currentPage: 0,
  pageSize: 20,
  search: ''
};

const listeners: Listener[] = [];

export function subscribe(cb: Listener) {
  listeners.push(cb);
  cb({ ...state });
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
}

function emit() {
  listeners.forEach(cb => cb({ ...state }));
}

export function setPage(page: number) {
  state.currentPage = Math.max(0, Math.floor(page));
  emit();
}

export function nextPage() {
  state.currentPage += 1;
  emit();
}

export function prevPage() {
  if (state.currentPage > 0) {
    state.currentPage -= 1;
    emit();
  }
}

export function setPageSize(size: number) {
  state.pageSize = Math.max(1, Math.floor(size));
  state.currentPage = 0;
  emit();
}

export function setSearch(term: string) {
  state.search = term ?? '';
  state.currentPage = 0;
  emit();
}

// Aide optionnelle : lier les éléments DOM (si présents) pour mettre à jour l'état et refléter les changements
export function initBindings(options?: {
  prevId?: string;
  nextId?: string;
  indicatorId?: string;
  searchInputId?: string;
  searchBtnId?: string;
  debounceMs?: number;
}) {
  const cfg = Object.assign({
    prevId: 'prev-page',
    nextId: 'next-page',
    indicatorId: 'page-indicator',
    searchInputId: 'search-input',
    searchBtnId: 'search-btn',
    debounceMs: 300
  }, options || {});

  const prev = document.getElementById(cfg.prevId) as HTMLButtonElement | null;
  const next = document.getElementById(cfg.nextId) as HTMLButtonElement | null;
  const indicator = document.getElementById(cfg.indicatorId) as HTMLElement | null;
  const searchInput = document.getElementById(cfg.searchInputId) as HTMLInputElement | null;
  const searchBtn = document.getElementById(cfg.searchBtnId) as HTMLButtonElement | null;

  if (prev) prev.addEventListener('click', () => prevPage());
  if (next) next.addEventListener('click', () => nextPage());
  if (searchBtn && searchInput) searchBtn.addEventListener('click', () => setSearch(searchInput.value));

  if (searchInput) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    searchInput.addEventListener('input', () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setSearch(searchInput.value), cfg.debounceMs);
    });
  }

  // mettre à jour les éléments UI lorsque l'état change
  subscribe(s => {
    if (prev) prev.disabled = s.currentPage === 0;
    if (next) next.disabled = false;
    if (indicator) indicator.textContent = `Page ${s.currentPage + 1}`;
    if (searchInput && searchInput.value !== s.search) searchInput.value = s.search;
  });
}
