<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateMovieRequest;
use App\Http\Requests\UpdateMovieRequest;
use App\Models\Movie;
use App\Services\Movie\MovieService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Symfony\Component\HttpFoundation\Response;

class MoviesController extends Controller
{
    public function __construct(private MovieService $movieService) {}


    public function index(Request $request)
    {
        $perPage = $request->query("per_page", 10);

        $movies = $this->movieService->getAllPaginated($perPage);
        return response()->json($movies, Response::HTTP_OK);
    }

    public function all()
    {
        $movies = $this->movieService->getAllMovies();
        return response()->json($movies, Response::HTTP_OK);
    }

    public function show(Movie $movie)
    {
        $movieData = $this->movieService->getMovie($movie);
        return response()->json(['movieData' => $movieData], Response::HTTP_OK);
    }

    public function store(CreateMovieRequest $request)
    {
        try {
            $movie = $this->movieService->createMovie($request->validated());


            Artisan::call('db:seed', [
                '--class' => 'MovieImageSeeder',
            ]);

            return response()->json([
                "message" => "Movie created successfully!",
                "movie" => $movie
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                "error" => "Failed to create movie",
                "details" => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }


    public function update(UpdateMovieRequest $request, Movie $movie)
    {
        try {
            $updated = $this->movieService->updateMovie($movie, $request->validated());
            return response()->json([
                "message" => "Movie updated successfully!",
                "movie" => $updated
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                "error" => "Failed to update movie",
                "details" => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(Movie $movie)
    {
        $deleted = $this->movieService->deleteMovie($movie);

        if ($deleted) {
            return response()->json(["message" => "Movie deleted successfully"], Response::HTTP_OK);
        }

        return response()->json(["error" => "Cannot delete movie due to database constraints"], Response::HTTP_CONFLICT);
    }

    public function getAllPlans()
    {
        $plans = $this->movieService->getAllPlans();
        return response()->json($plans, Response::HTTP_OK);
    }

    public function getImage(Movie $movie)
    {
        return redirect()->away($movie->image);
    }

    public function getMoviePerSubgenre(string $slug)
    {
        $movies = $this->movieService->getMoviesBySubgenre($slug);

        if (!$movies) {
            return response()->json(['message' => 'Subgenre not found'], Response::HTTP_NOT_FOUND);
        }

        return response()->json($movies, Response::HTTP_OK);
    }

    public function showBySlug(string $slug)
    {
        $movie = Movie::with(['actors', 'director', 'productionCompany', 'subgenres'])->where('slug', $slug)->firstOrFail();
        return response()->json($movie, Response::HTTP_OK);
    }

    public function filter(Request $request)
    {
        $movies = $this->movieService->filter($request->all());
        return response()->json($movies);
    }
}
