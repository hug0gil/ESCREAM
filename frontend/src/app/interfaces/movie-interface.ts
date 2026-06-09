export interface Movie {
  id: number;
  title: string;
  slug: string;
  year: number;
  synopsis: string;
  image: string;
  rating: string;

  country: string;
  movie_url: string | null;

  // Relaciones

  directorId: number;
  productionCompanyId: number;

  director: { id: number; name: string } | null;
  productionCompany: { id: number; name: string } | null;

  actors: { id: number; name: string }[];
  subgenres: { id: number; name: string; slug?: string }[];
}

export interface MoviePayload {
  title: string;
  synopsis: string;
  year?: number;
  image?: string;
  movieUrl?: string;
  rating?: number;

  country: string;

  directorId: number;
  productionCompanyId: number;

  actorIds?: number[];
  subgenreIds?: number[];
}
