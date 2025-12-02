
export interface Movie {
  id: number;
  title: string;
  slug: string;
  year: number;
  synopsis: string;
  image: string;
  rating: string;
  director_id: number;
  production_company_id: number;
  country: string;

  // Relaciones
  actors?: { id: number; name: string }[];
  director?: { id: number; name: string } | null;
  productionCompany?: { id: number; name: string } | null;
  subgenres?: { id: number; name: string }[];
}
