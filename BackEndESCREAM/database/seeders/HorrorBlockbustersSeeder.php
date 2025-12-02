<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Director;
use App\Models\ProductionCompany;
use App\Models\Actor;
use App\Models\Subgenre;
use App\Models\Movie;
use App\Models\Review;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HorrorBlockbustersSeeder extends Seeder
{
    public function run()
    {

        // Directores
        $directorsData = [
            ['id' => 1, 'name' => 'John Carpenter', 'birth_date' => '1948-01-16'],
            ['id' => 2, 'name' => 'Wes Craven', 'birth_date' => '1939-08-02'],
            ['id' => 3, 'name' => 'James Wan', 'birth_date' => '1977-02-26'],
            ['id' => 4, 'name' => 'Guillermo del Toro', 'birth_date' => '1964-10-09'],
            ['id' => 5, 'name' => 'David Cronenberg', 'birth_date' => '1943-03-15'],
            ['id' => 6, 'name' => 'Tobe Hooper', 'birth_date' => '1943-01-25'],
            ['id' => 7, 'name' => 'Ari Aster', 'birth_date' => '1986-07-15'],
            ['id' => 8, 'name' => 'Robert Eggers', 'birth_date' => '1983-07-14'],
            ['id' => 9, 'name' => 'Jordan Peele', 'birth_date' => '1979-02-21'],
            ['id' => 10, 'name' => 'Mike Flanagan', 'birth_date' => '1978-05-20'],
            ['id' => 11, 'name' => 'Stanley Kubrick', 'birth_date' => '1928-07-26'],
            ['id' => 12, 'name' => 'George A. Romero', 'birth_date' => '1940-02-04'],
            ['id' => 13, 'name' => 'Sam Raimi', 'birth_date' => '1959-10-23'],
            ['id' => 14, 'name' => 'Dario Argento', 'birth_date' => '1940-09-07'],
            ['id' => 15, 'name' => 'Jennifer Kent', 'birth_date' => '1969-08-05'],
            ['id' => 16, 'name' => 'Ti West', 'birth_date' => '1980-10-05'],
            ['id' => 17, 'name' => 'M. Night Shyamalan', 'birth_date' => '1970-08-06'],
            ['id' => 18, 'name' => 'Julia Ducournau', 'birth_date' => '1983-11-18'],
        ];

        foreach ($directorsData as $dir) {
            Director::updateOrCreate(['id' => $dir['id']], $dir);
        }

        // Productoras
        $companiesData = [
            ['id' => 1, 'name' => 'Compass International Pictures', 'country' => 'EE.UU.'],
            ['id' => 2, 'name' => 'New Line Cinema', 'country' => 'EE.UU.'],
            ['id' => 3, 'name' => 'Blumhouse Productions', 'country' => 'EE.UU.'],
            ['id' => 4, 'name' => 'Guillermo del Toro Productions', 'country' => 'EE.UU.'],
            ['id' => 5, 'name' => 'Dimension Films', 'country' => 'EE.UU.'],
            ['id' => 6, 'name' => 'Miramax Films', 'country' => 'EE.UU.'],
            ['id' => 7, 'name' => 'A24', 'country' => 'EE.UU.'],
            ['id' => 8, 'name' => 'Lionsgate Films', 'country' => 'EE.UU.'],
            ['id' => 9, 'name' => 'Warner Bros.', 'country' => 'EE.UU.'],
            ['id' => 10, 'name' => 'Universal Pictures', 'country' => 'EE.UU.'],
            ['id' => 11, 'name' => 'Paramount Pictures', 'country' => 'EE.UU.'],
            ['id' => 12, 'name' => 'Netflix', 'country' => 'EE.UU.'],
            ['id' => 13, 'name' => 'Sony Pictures', 'country' => 'EE.UU.'],
            ['id' => 14, 'name' => 'Focus Features', 'country' => 'EE.UU.'],
            ['id' => 15, 'name' => 'Neon', 'country' => 'EE.UU.'],
            ['id' => 16, 'name' => 'IFC Films', 'country' => 'EE.UU.'],
        ];

        foreach ($companiesData as $comp) {
            ProductionCompany::updateOrCreate(['id' => $comp['id']], $comp);
        }

        // Actores
        $actorsData = [
            ['id' => 1, 'name' => 'Jamie Lee Curtis', 'birth_date' => '1958-11-22', 'country' => 'EE.UU.'],
            ['id' => 2, 'name' => 'Robert Englund', 'birth_date' => '1947-06-06', 'country' => 'EE.UU.'],
            ['id' => 3, 'name' => 'Patrick Wilson', 'birth_date' => '1973-07-03', 'country' => 'EE.UU.'],
            ['id' => 4, 'name' => 'Doug Jones', 'birth_date' => '1960-05-24', 'country' => 'EE.UU.'],
            ['id' => 5, 'name' => 'Neve Campbell', 'birth_date' => '1973-10-03', 'country' => 'EE.UU.'],
            ['id' => 6, 'name' => 'Linda Blair', 'birth_date' => '1959-01-22', 'country' => 'EE.UU.'],
            ['id' => 7, 'name' => 'Ethan Hawke', 'birth_date' => '1970-11-06', 'country' => 'EE.UU.'],
            ['id' => 8, 'name' => 'Maika Monroe', 'birth_date' => '1993-05-29', 'country' => 'EE.UU.'],
            ['id' => 9, 'name' => 'Anya Taylor-Joy', 'birth_date' => '1996-04-16', 'country' => 'EE.UU.'],
            ['id' => 10, 'name' => 'Kara Hayward', 'birth_date' => '1998-01-17', 'country' => 'EE.UU.'],
            ['id' => 11, 'name' => 'Daniel Kaluuya', 'birth_date' => '1989-02-24', 'country' => 'Reino Unido'],
            ['id' => 12, 'name' => 'Lupita Nyong\'o', 'birth_date' => '1983-03-01', 'country' => 'Kenia'],
            ['id' => 13, 'name' => 'Jack Nicholson', 'birth_date' => '1937-04-22', 'country' => 'EE.UU.'],
            ['id' => 14, 'name' => 'Shelley Duvall', 'birth_date' => '1949-07-07', 'country' => 'EE.UU.'],
            ['id' => 15, 'name' => 'Bruce Campbell', 'birth_date' => '1958-06-22', 'country' => 'EE.UU.'],
            ['id' => 16, 'name' => 'Toni Collette', 'birth_date' => '1972-11-01', 'country' => 'Australia'],
            ['id' => 17, 'name' => 'Vera Farmiga', 'birth_date' => '1973-08-06', 'country' => 'EE.UU.'],
            ['id' => 18, 'name' => 'Essie Davis', 'birth_date' => '1970-01-07', 'country' => 'Australia'],
            ['id' => 19, 'name' => 'Mia Goth', 'birth_date' => '1993-11-25', 'country' => 'Reino Unido'],
            ['id' => 20, 'name' => 'Haley Joel Osment', 'birth_date' => '1988-04-10', 'country' => 'EE.UU.'],
            ['id' => 21, 'name' => 'Garance Marillier', 'birth_date' => '1998-02-11', 'country' => 'Francia'],
            ['id' => 22, 'name' => 'Thomasin McKenzie', 'birth_date' => '2000-07-26', 'country' => 'Nueva Zelanda'],
            ['id' => 23, 'name' => 'Bill Skarsgård', 'birth_date' => '1990-08-09', 'country' => 'Suecia'],
            ['id' => 24, 'name' => 'Lupita Nyong\'o', 'birth_date' => '1983-03-01', 'country' => 'Kenia'],
            ['id' => 25, 'name' => 'Elisabeth Moss', 'birth_date' => '1982-07-24', 'country' => 'EE.UU.'],
        ];

        foreach ($actorsData as $act) {
            Actor::updateOrCreate(['id' => $act['id']], $act);
        }

        $subgenresData = [
            ['id' => 1, 'name' => 'Slasher', 'description' => 'Asesino que persigue y mata a sus víctimas de manera violenta'],
            ['id' => 2, 'name' => 'Sobrenatural', 'description' => 'Presencias fantasmales o fenómenos paranormales'],
            ['id' => 3, 'name' => 'Terror psicológico', 'description' => 'Miedo generado por la mente, paranoia o ansiedad'],
            ['id' => 4, 'name' => 'Terror corporal', 'description' => 'Miedo a la mutación, enfermedad o invasión del cuerpo humano'],
            ['id' => 5, 'name' => 'Fantasía oscura', 'description' => 'Historias fantásticas con elementos oscuros y macabros'],
            ['id' => 6, 'name' => 'Found footage', 'description' => 'Historias contadas mediante material grabado por los propios personajes'],
            ['id' => 7, 'name' => 'Terror folk', 'description' => 'Basado en leyendas, tradiciones y mitos locales'],
            ['id' => 8, 'name' => 'Terror doméstico', 'description' => 'El horror ocurre en ambientes familiares o cotidianos'],
            ['id' => 9, 'name' => 'Terror social', 'description' => 'Crítica social a través del miedo y la opresión'],
            ['id' => 10, 'name' => 'Zombies', 'description' => 'Historias con muertos vivientes o apocalipsis zombi'],
            ['id' => 11, 'name' => 'Posesión', 'description' => 'Control de una persona por fuerzas sobrenaturales'],
            ['id' => 12, 'name' => 'Cultos y sectas', 'description' => 'Amenaza de rituales oscuros y fanatismo religioso'],
            ['id' => 13, 'name' => 'Terror de venganza', 'description' => 'Historias donde la venganza genera miedo y violencia'],
            ['id' => 14, 'name' => 'Terror cósmico', 'description' => 'Miedo a lo desconocido y entidades incomprensibles'],
            ['id' => 15, 'name' => 'Terror de aislamiento', 'description' => 'Miedo derivado de estar solo o atrapado'],
        ];

        foreach ($subgenresData as $sub) {
            Subgenre::updateOrCreate(
                ['id' => $sub['id']],
                [
                    'name' => $sub['name'] ?? null,
                    'description' => $sub['description'] ?? null,
                    'slug' => Str::slug($sub['name']) ?? null,
                ]
            );
        }

        // Películas
        $moviesData = [
            ['id' => 1, 'title' => 'Halloween', 'year' => 1978, 'synopsis' => 'Michael Myers escapa de un hospital psiquiátrico y regresa a su ciudad natal para aterrorizar a la niñera Laurie Strode.', 'image' => 'halloween.jpg', 'rating' => 8, 'director_id' => 1, 'production_company_id' => 1, 'country' => 'US'],
            ['id' => 2, 'title' => 'Pesadilla en Elm Street', 'year' => 1984, 'synopsis' => 'Un grupo de adolescentes es acosado y asesinado en sus sueños por Freddy Krueger, un asesino con guantes con cuchillas.', 'image' => 'pesadilla_elm_street.jpg', 'rating' => 8, 'director_id' => 2, 'production_company_id' => 2, 'country' => 'US'],
            ['id' => 3, 'title' => 'Expediente Warren: The Conjuring', 'year' => 2013, 'synopsis' => 'Basada en hechos reales, la familia Perron sufre actividad paranormal y llama a investigadores de lo sobrenatural.', 'image' => 'conjuring.jpg', 'rating' => 7, 'director_id' => 3, 'production_company_id' => 3, 'country' => 'US'],
            ['id' => 4, 'title' => 'El laberinto del fauno', 'year' => 2006, 'synopsis' => 'En la España fascista de 1944, una niña se encuentra con un mundo fantástico y oscuro para escapar de su realidad brutal.', 'image' => 'laberinto_fauno.jpg', 'rating' => 9, 'director_id' => 4, 'production_company_id' => 4, 'country' => 'ES'],
            ['id' => 5, 'title' => 'Scream', 'year' => 1996, 'synopsis' => 'Un grupo de adolescentes es perseguido por un asesino enmascarado que sigue las reglas de las películas de terror.', 'image' => 'scream.jpg', 'rating' => 8, 'director_id' => 2, 'production_company_id' => 5, 'country' => 'US'],
            ['id' => 6, 'title' => 'El exorcista', 'year' => 1973, 'synopsis' => 'Una niña sufre posesión demoníaca y su madre busca la ayuda de dos sacerdotes para salvarla.', 'image' => 'exorcista.jpg', 'rating' => 9, 'director_id' => 6, 'production_company_id' => 6, 'country' => 'US'],
            ['id' => 7, 'title' => 'Hereditary', 'year' => 2018, 'synopsis' => 'Después de la muerte de la matriarca, una familia comienza a descubrir secretos oscuros y eventos terroríficos se desatan.', 'image' => 'hereditary.jpg', 'rating' => 8, 'director_id' => 7, 'production_company_id' => 7, 'country' => 'US'],
            ['id' => 8, 'title' => 'Midsommar', 'year' => 2019, 'synopsis' => 'Un grupo de amigos viaja a Suecia para un festival que ocurre una vez cada 90 años y descubren horrores inimaginables.', 'image' => 'midsommar.jpg', 'rating' => 8, 'director_id' => 7, 'production_company_id' => 7, 'country' => 'SE'],
            ['id' => 9, 'title' => 'La bruja', 'year' => 2015, 'synopsis' => 'Una familia puritana en Nueva Inglaterra sufre la influencia de fuerzas malignas tras ser expulsada de su comunidad.', 'image' => 'la_bruja.jpg', 'rating' => 8, 'director_id' => 8, 'production_company_id' => 7, 'country' => 'US'],
            ['id' => 10, 'title' => 'It Follows', 'year' => 2014, 'synopsis' => 'Una joven es perseguida por una entidad sobrenatural tras un encuentro sexual, enfrentando un miedo constante e ineludible.', 'image' => 'it_follows.jpg', 'rating' => 7, 'director_id' => 7, 'production_company_id' => 7, 'country' => 'US'],
            ['id' => 11, 'title' => 'Get Out', 'year' => 2017, 'synopsis' => 'Un joven afroamericano visita la finca de la familia de su novia blanca y descubre secretos perturbadores.', 'image' => 'get_out.jpg', 'rating' => 8, 'director_id' => 9, 'production_company_id' => 3, 'country' => 'US'],
            ['id' => 12, 'title' => 'Us', 'year' => 2019, 'synopsis' => 'Una familia se enfrenta a sus doppelgängers terroríficos durante unas vacaciones.', 'image' => 'us.jpg', 'rating' => 7, 'director_id' => 9, 'production_company_id' => 10, 'country' => 'US'],
            ['id' => 13, 'title' => 'El resplandor', 'year' => 1980, 'synopsis' => 'Un escritor acepta un trabajo como cuidador de invierno en un hotel aislado donde gradualmente pierde la cordura.', 'image' => 'el_resplandor.jpg', 'rating' => 9, 'director_id' => 11, 'production_company_id' => 9, 'country' => 'US'],
            ['id' => 14, 'title' => 'La noche de los muertos vivientes', 'year' => 1968, 'synopsis' => 'Un grupo de personas se refugia en una casa rural mientras hordas de zombies los rodean.', 'image' => 'noche_muertos_vivientes.jpg', 'rating' => 8, 'director_id' => 12, 'production_company_id' => 16, 'country' => 'US'],
            ['id' => 15, 'title' => 'Posesión infernal', 'year' => 1981, 'synopsis' => 'Un grupo de jóvenes en una cabaña despierta fuerzas demoníacas al leer un libro maldito.', 'image' => 'posesion_infernal.jpg', 'rating' => 8, 'director_id' => 13, 'production_company_id' => 16, 'country' => 'US'],
            ['id' => 16, 'title' => 'Suspiria', 'year' => 1977, 'synopsis' => 'Una bailarina americana ingresa a una prestigiosa academia de danza en Roma que esconde secretos siniestros.', 'image' => 'suspiria.jpg', 'rating' => 8, 'director_id' => 14, 'production_company_id' => 16, 'country' => 'IT'],
            ['id' => 17, 'title' => 'The Babadook', 'year' => 2014, 'synopsis' => 'Una madre soltera lucha contra una entidad siniestra que emerge de un libro de cuentos infantil.', 'image' => 'babadook.jpg', 'rating' => 7, 'director_id' => 15, 'production_company_id' => 16, 'country' => 'AU'],
            ['id' => 18, 'title' => 'X', 'year' => 2022, 'synopsis' => 'Un grupo de cineastas porno en los años 70 se enfrenta a una pareja de ancianos asesinos.', 'image' => 'x_movie.jpg', 'rating' => 7, 'director_id' => 16, 'production_company_id' => 7, 'country' => 'US'],
            ['id' => 19, 'title' => 'El sexto sentido', 'year' => 1999, 'synopsis' => 'Un psicólogo infantil trata a un niño que afirma poder ver y hablar con personas muertas.', 'image' => 'sexto_sentido.jpg', 'rating' => 8, 'director_id' => 17, 'production_company_id' => 9, 'country' => 'US'],
            ['id' => 20, 'title' => 'Cruda', 'year' => 2016, 'synopsis' => 'Una joven vegetariana desarrolla un gusto por la carne humana durante su primer año en la universidad veterinaria.', 'image' => 'cruda.jpg', 'rating' => 7, 'director_id' => 18, 'production_company_id' => 14, 'country' => 'FR'],
            ['id' => 21, 'title' => 'Doctor Sleep', 'year' => 2019, 'synopsis' => 'Danny Torrance, ahora adulto, debe proteger a una niña con habilidades psíquicas de un culto que se alimenta de ellas.', 'image' => 'doctor_sleep.jpg', 'rating' => 7, 'director_id' => 10, 'production_company_id' => 9, 'country' => 'US'],
            ['id' => 22, 'title' => 'It', 'year' => 2017, 'synopsis' => 'Un grupo de niños marginados debe enfrentarse a sus peores miedos cuando se encuentran con un payaso asesino.', 'image' => 'it_2017.jpg', 'rating' => 7, 'director_id' => 16, 'production_company_id' => 9, 'country' => 'US'],
            ['id' => 23, 'title' => 'El hombre invisible', 'year' => 2020, 'synopsis' => 'Una mujer cree que su ex abusivo ha encontrado una manera de volverse invisible para aterrorizarla.', 'image' => 'hombre_invisible.jpg', 'rating' => 7, 'director_id' => 3, 'production_company_id' => 10, 'country' => 'US'],
            ['id' => 24, 'title' => 'El faro', 'year' => 2019, 'synopsis' => 'Dos fareros quedan varados en una isla remota y comienzan a perder la cordura.', 'image' => 'el_faro.jpg', 'rating' => 8, 'director_id' => 8, 'production_company_id' => 7, 'country' => 'US'],
            ['id' => 25, 'title' => 'Insidious', 'year' => 2010, 'synopsis' => 'Una familia descubre que su hijo está atrapado en un reino astral y recurre a especialistas en lo paranormal para rescatarlo.', 'image' => 'insidious.jpg', 'rating' => 7, 'director_id' => 3, 'production_company_id' => 3, 'country' => 'US'],
        ];

        foreach ($moviesData as $movie) {
            Movie::updateOrCreate(
                ['id' => $movie['id']], // condición para buscar
                [
                    'title' => $movie['title'],
                    'slug' => Str::slug($movie['title']), 
                    'year' => $movie['year'] ?? null,
                    'synopsis' => $movie['synopsis'] ?? null,
                    'image' => $movie['image'] ?? null,
                    'rating' => $movie['rating'] ?? null,
                    'director_id' => $movie['director_id'] ?? null,
                    'production_company_id' => $movie['production_company_id'] ?? null,
                    'country' => $movie['country'] ?? null
                ]
            );
        }



        // Tabla pivote movie_actor
        DB::table('movie_actor')->truncate();
        DB::table('movie_actor')->insert([
            // Películas originales
            ['movie_id' => 1, 'actor_id' => 1],   // Halloween - Jamie Lee Curtis
            ['movie_id' => 2, 'actor_id' => 2],   // Elm Street - Robert Englund
            ['movie_id' => 3, 'actor_id' => 3],   // Conjuring - Patrick Wilson
            ['movie_id' => 3, 'actor_id' => 17],  // Conjuring - Vera Farmiga
            ['movie_id' => 4, 'actor_id' => 4],   // Laberinto del Fauno - Doug Jones
            ['movie_id' => 5, 'actor_id' => 5],   // Scream - Neve Campbell
            ['movie_id' => 6, 'actor_id' => 6],   // Exorcista - Linda Blair
            ['movie_id' => 7, 'actor_id' => 16],  // Hereditary - Toni Collette
            ['movie_id' => 8, 'actor_id' => 8],   // Midsommar - Florence Pugh
            ['movie_id' => 9, 'actor_id' => 9],   // La bruja - Anya Taylor-Joy
            ['movie_id' => 10, 'actor_id' => 8],  // It Follows - Florence Pugh (como sustituta de la protagonista)
            ['movie_id' => 11, 'actor_id' => 11], // Get Out - Daniel Kaluuya
            ['movie_id' => 12, 'actor_id' => 12], // Us - Lupita Nyong'o
            ['movie_id' => 13, 'actor_id' => 13], // El resplandor - Jack Nicholson
            ['movie_id' => 13, 'actor_id' => 14], // El resplandor - Shelley Duvall
            ['movie_id' => 14, 'actor_id' => 15], // Noche muertos vivientes - (actor genérico)
            ['movie_id' => 15, 'actor_id' => 15], // Posesión infernal - Bruce Campbell
            ['movie_id' => 17, 'actor_id' => 18], // The Babadook - Essie Davis
            ['movie_id' => 18, 'actor_id' => 19], // X - Mia Goth
            ['movie_id' => 19, 'actor_id' => 20], // El sexto sentido - Haley Joel Osment
            ['movie_id' => 20, 'actor_id' => 21], // Cruda - Garance Marillier
            ['movie_id' => 21, 'actor_id' => 7],  // Doctor Sleep - Ewan McGregor (usando Ethan Hawke como sustituto)
            ['movie_id' => 22, 'actor_id' => 23], // It - Bill Skarsgård
            ['movie_id' => 23, 'actor_id' => 25], // El hombre invisible - Elisabeth Moss
            ['movie_id' => 24, 'actor_id' => 22], // El faro - (usando Thomasin McKenzie como sustituto)
            ['movie_id' => 25, 'actor_id' => 3],  // Insidious - Patrick Wilson
            ['movie_id' => 25, 'actor_id' => 17], // Insidious - Vera Farmiga
        ]);

        // Tabla pivote movie_subgenre
        DB::table('movie_subgenre')->truncate();
        DB::table('movie_subgenre')->insert([
            // Películas originales
            ['movie_id' => 1, 'subgenre_id' => 1],   // Halloween - Slasher
            ['movie_id' => 2, 'subgenre_id' => 1],   // Elm Street - Slasher
            ['movie_id' => 2, 'subgenre_id' => 2],   // Elm Street - Sobrenatural
            ['movie_id' => 3, 'subgenre_id' => 2],   // Conjuring - Sobrenatural
            ['movie_id' => 4, 'subgenre_id' => 5],   // Fauno - Fantasía oscura
            ['movie_id' => 5, 'subgenre_id' => 1],   // Scream - Slasher
            ['movie_id' => 6, 'subgenre_id' => 2],   // Exorcista - Sobrenatural
            ['movie_id' => 6, 'subgenre_id' => 11],  // Exorcista - Posesión
            ['movie_id' => 7, 'subgenre_id' => 3],   // Hereditary - Terror psicológico
            ['movie_id' => 7, 'subgenre_id' => 8],   // Hereditary - Terror doméstico
            ['movie_id' => 8, 'subgenre_id' => 3],   // Midsommar - Terror psicológico
            ['movie_id' => 8, 'subgenre_id' => 7],   // Midsommar - Terror folk
            ['movie_id' => 9, 'subgenre_id' => 7],   // La bruja - Terror folk
            ['movie_id' => 9, 'subgenre_id' => 3],   // La bruja - Terror psicológico
            ['movie_id' => 10, 'subgenre_id' => 3],  // Terror psicológico
            ['movie_id' => 10, 'subgenre_id' => 8],  // Terror doméstico

            ['movie_id' => 11, 'subgenre_id' => 9],  // Get Out - Terror social
            ['movie_id' => 11, 'subgenre_id' => 3],  // Get Out - Terror psicológico
            ['movie_id' => 12, 'subgenre_id' => 9],  // Us - Terror social
            ['movie_id' => 12, 'subgenre_id' => 3],  // Us - Terror psicológico
            ['movie_id' => 13, 'subgenre_id' => 3],  // El resplandor - Terror psicológico
            ['movie_id' => 13, 'subgenre_id' => 15], // El resplandor - Terror de aislamiento
            ['movie_id' => 14, 'subgenre_id' => 10], // Noche muertos vivientes - Zombies
            ['movie_id' => 15, 'subgenre_id' => 11], // Posesión infernal - Posesión
            ['movie_id' => 16, 'subgenre_id' => 12], // Suspiria - Giallo
            ['movie_id' => 16, 'subgenre_id' => 2],  // Suspiria - Sobrenatural
            ['movie_id' => 17, 'subgenre_id' => 3],  // The Babadook - Terror psicológico
            ['movie_id' => 17, 'subgenre_id' => 8],  // The Babadook - Terror doméstico
            ['movie_id' => 18, 'subgenre_id' => 1],  // X - Slasher
            ['movie_id' => 18, 'subgenre_id' => 13], // X - Terror de venganza
            ['movie_id' => 19, 'subgenre_id' => 2],  // El sexto sentido - Sobrenatural
            ['movie_id' => 19, 'subgenre_id' => 3],  // El sexto sentido - Terror psicológico
            ['movie_id' => 20, 'subgenre_id' => 4],  // Cruda - Terror corporal
            ['movie_id' => 20, 'subgenre_id' => 3],  // Cruda - Terror psicológico
            ['movie_id' => 21, 'subgenre_id' => 2],  // Doctor Sleep - Sobrenatural
            ['movie_id' => 21, 'subgenre_id' => 3],  // Doctor Sleep - Terror psicológico
            ['movie_id' => 22, 'subgenre_id' => 2],  // It - Sobrenatural
            ['movie_id' => 22, 'subgenre_id' => 3],  // It - Terror psicológico
            ['movie_id' => 23, 'subgenre_id' => 3],  // El hombre invisible - Terror psicológico
            ['movie_id' => 23, 'subgenre_id' => 8],  // El hombre invisible - Terror doméstico
            ['movie_id' => 24, 'subgenre_id' => 3],  // El faro - Terror psicológico
            ['movie_id' => 24, 'subgenre_id' => 15], // El faro - Terror de aislamiento
            ['movie_id' => 25, 'subgenre_id' => 2],  // Sobrenatural
            ['movie_id' => 25, 'subgenre_id' => 11], // Posesión
        ]);

        $reviewsData = [
            [
                'id' => 1,
                'user_id' => 1,
                'movie_id' => 1,
                'rating' => 5,
                'comment' => '¡Película increíble! Imprescindible verla.',
                'date' => '2017-10-01',
            ],
            [
                'id' => 2,
                'user_id' => 2,
                'movie_id' => 2,
                'rating' => 4,
                'comment' => 'Gran historia y personajes.',
                'date' => '2023-10-02',
            ],
            [
                'id' => 3,
                'user_id' => 1,
                'movie_id' => 3,
                'rating' => 3,
                'comment' => null,
                'date' => '2025-10-03',
            ],
        ];

        foreach ($reviewsData as $review) {
            Review::updateOrCreate(['id' => $review['id']], $review);
        }
    }
}
