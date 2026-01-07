export interface Cover {
  url?: string;
  image_id?: string;
}

export interface Genre {
  id: number;
  name: string | null;
}

export interface Game {
  id: number;
  name: string;
  rating?: number;
  summary?: string;
  cover?: Cover;
  genres?: Genre[];
}

export type Games = Game[];
