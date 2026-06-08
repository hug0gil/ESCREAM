import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const STREAM_BASE = 'https://www.streamimdb.com/es-es/title';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface SuggestionEntry {
  id: string;
  l?: string;
  qid?: string;
  y?: number;
}

interface SuggestionResponse {
  d?: SuggestionEntry[];
}

/**
 * Busca el título en la API de sugerencias de IMDB y devuelve el id
 * (ttXXXXXXX) cuya entrada coincida exactamente con el año dado. Si no hay
 * coincidencia exacta, devuelve el id con el año más cercano. Si no hay año
 * informado, devuelve el primer id de tipo título.
 */
async function findImdbId(
  title: string,
  year: number | null,
): Promise<{ id: string; matchedYear: number | null; exact: boolean } | null> {
  const cleaned = title.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').trim();
  const firstChar = cleaned.match(/\p{L}|\p{N}/u)?.[0] ?? 'a';
  const url = `https://v3.sg.media-imdb.com/suggestion/${firstChar}/${encodeURIComponent(cleaned)}.json`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    console.warn(`  IMDB respondió ${res.status} para "${title}"`);
    return null;
  }

  const data = (await res.json()) as SuggestionResponse;
  const titles = (data.d ?? []).filter((e) => /^tt\d+$/.test(e.id));
  if (titles.length === 0) return null;

  if (year !== null) {
    const exact = titles.find((t) => t.y === year);
    if (exact) return { id: exact.id, matchedYear: exact.y ?? null, exact: true };

    // Sin coincidencia exacta: elegimos el de año más cercano (entre los que
    // traen año). Si ninguno trae año, caemos al primero.
    const withYear = titles.filter((t) => typeof t.y === 'number');
    if (withYear.length > 0) {
      const closest = withYear.reduce((best, cur) =>
        Math.abs((cur.y as number) - year) < Math.abs((best.y as number) - year)
          ? cur
          : best,
      );
      return { id: closest.id, matchedYear: closest.y ?? null, exact: false };
    }
  }

  return { id: titles[0].id, matchedYear: titles[0].y ?? null, exact: false };
}

async function main() {
  const force = process.argv.includes('--force');

  const movies = await prisma.movie.findMany({
    select: { id: true, title: true, year: true, movieUrl: true },
    orderBy: { id: 'asc' },
  });
  console.log(
    `Procesando ${movies.length} películas${force ? ' (forzando reprocesado)' : ''}…`,
  );

  let ok = 0;
  let approx = 0;
  let fail = 0;
  let skipped = 0;

  for (const m of movies) {
    if (m.movieUrl && !force) {
      console.log(`↪ skip [${m.id}] ${m.title} (ya tiene URL)`);
      skipped++;
      continue;
    }

    try {
      const found = await findImdbId(m.title, m.year);
      if (!found) {
        console.warn(`✗ [${m.id}] ${m.title}: no se encontró id en IMDB`);
        fail++;
      } else {
        const movieUrl = `${STREAM_BASE}/${found.id}`;
        await prisma.movie.update({
          where: { id: m.id },
          data: { movieUrl },
        });
        const tag = found.exact ? '✓' : '~';
        const yearInfo = found.matchedYear !== null ? ` (${found.matchedYear})` : '';
        console.log(`${tag} [${m.id}] ${m.title}${m.year ? ` ${m.year}` : ''} → ${found.id}${yearInfo}`);
        if (found.exact) ok++; else approx++;
      }
    } catch (e) {
      console.error(`✗ [${m.id}] ${m.title}:`, (e as Error).message);
      fail++;
    }

    await sleep(250);
  }

  console.log(
    `\nResumen → exactos=${ok} aproximados=${approx} fail=${fail} skip=${skipped}`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
