export interface Movie {
  id: number;
  title: string;
  slug: string;
  year: number;
  synopsis: string;
  image: string;
  rating: string;
  directorId: number;
  productionCompanyId: number;
  country: string;
  movie_url: string | null;

  // Relaciones (planas; el service aplana los pivots Prisma)
  actors?: { id: number; name: string }[];
  director?: { id: number; name: string } | null;
  productionCompany?: { id: number; name: string } | null;
  subgenres?: { id: number; name: string; slug?: string }[];
}
