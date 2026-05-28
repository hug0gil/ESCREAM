import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const TMDB_URL = 'https://api.themoviedb.org/3/search/movie';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * search/movie no trae el director, así que pedimos los créditos de la peli
 * y devolvemos el nombre del director (job === 'Director').
 */
async function getDirector(
  movieId: number,
  apiKey: string,
): Promise<string | undefined> {
  const params = new URLSearchParams({ api_key: apiKey, language: 'es-ES' });
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/credits?${params.toString()}`,
  );
  if (!res.ok) return undefined;

  const data: { crew?: { job?: string; name?: string }[] } = await res.json();
  return data.crew?.find((c) => c.job === 'Director')?.name;
}

async function main() {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.error('Falta TMDB_API_KEY en .env');
    process.exit(1);
  }

  const movies = await prisma.movie.findMany({ include: { director: true } });
  console.log(`Procesando ${movies.length} películas…`);

  for (const movie of movies) {
    const params = new URLSearchParams({
      api_key: apiKey,
      query: movie.title,
      year: String(movie.year),
      language: 'es-ES'
    });

    try {
      const res = await fetch(`${TMDB_URL}?${params.toString()}`);
      if (!res.ok) {
        console.error(`Error API para "${movie.title}" (HTTP ${res.status})`);
        continue;
      }

      const data: {
        results?: {
          id?: number;
          title?: string;
          overview?: string;
          release_date?: string;
          poster_path?: string | null;
        }[];
      } = await res.json();

      const results = data.results ?? [];
      const year = String(movie.year);
      const title = movie.title.toLowerCase(); // comparación insensible a mayúsculas

      // Coincidencias síncronas (de search/movie)
      const byBoth = results.find(
        (r) => r.title?.toLowerCase() === title && r.release_date?.slice(0, 4) === year,
      );
      const byTitle = results.find((r) => r.title?.toLowerCase() === title);
      const byYear = results.find((r) => r.release_date?.slice(0, 4) === year);

      // Director: la señal más fiable. Miramos TODOS los resultados (no solo los
      // del mismo año, porque el año de TMDB y el de la BD a veces no coinciden).
      let byDirector: (typeof results)[number] | undefined;
      if (movie.director?.name) {
        const directorName = movie.director.name.toLowerCase();
        for (const r of results) {
          if (!r.id) continue;
          const d = await getDirector(r.id, apiKey);
          await sleep(250); // no saturar la API de créditos
          if (d?.toLowerCase() === directorName) {
            byDirector = r;
            break;
          }
        }
      }

      // Cascada, de la más segura a la menos:
      // director → título+año → título → año → primer resultado
      const chosen = byDirector ?? byBoth ?? byTitle ?? byYear ?? results[0];

      if (chosen) {
        await prisma.movie.update({
          where: { id: movie.id },
          data: { image: `${POSTER_BASE}${chosen?.poster_path}`, synopsis: chosen?.overview },
        });
        const how = byDirector
          ? 'director'
          : byBoth
            ? 'título+año'
            : byTitle
              ? 'título'
              : byYear
                ? 'año'
                : '1er resultado';
        console.log(`✓ Imagen para ${movie.title}`);
      } else {
        console.warn(`⚠ Sin póster para ${movie.title}`);
      }
    } catch (e) {
      console.error(`Error con la API para ${movie.title}:`, e);
    }

    await sleep(500);
  }

  console.log('Done.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
