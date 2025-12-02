<?php

use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MoviesController;
use App\Http\Controllers\SubGenresController;
use App\Http\Controllers\UsersController;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\CheckSubscription;
use App\Http\Middleware\LogRequests;
use Illuminate\Support\Facades\Route;

Route::get("/test", function () {
    return response()->json(["message" => "API funciona correctamente"]);
});

// USERS
Route::prefix('users')->group(function () {

    // Rutas públicas (no requiere JWT)
    Route::middleware(LogRequests::class)->group(function () {
        Route::post("login", [AuthController::class, "logIn"]);
        Route::post("register", [AuthController::class, "register"]);
    });

    // Rutas protegidas (requiere JWT)
    Route::middleware(["jwt.auth", LogRequests::class])->group(function () {
        Route::post("logout", [AuthController::class, "logout"]);
        Route::post("refresh", [AuthController::class, "refresh"]);
        Route::put("changeSubscription", [AuthController::class, "changeSubscription"]);
        Route::get("who", [AuthController::class, "who"]);

        // Acciones sobre usuarios (podrían necesitar admin si quieres)
        Route::put("update/{user}", [UsersController::class, "update"]);
        Route::delete("{user}", [UsersController::class, "delete"]);
    });

    // Información pública o semi-pública
    Route::get("", [UsersController::class, "index"]);
    Route::get("{user}", [UsersController::class, "show"]);
    Route::get("plan/{id}", [UsersController::class, "getPlan"]);
});

// ADMINS
Route::prefix('admin')->middleware([LogRequests::class, CheckRole::class])->group(function () {
    Route::post('register', [AdminAuthController::class, 'register']);
    // Otras rutas admin-only
});

// PUBLIC MOVIES
Route::get('/movies/plans', [MoviesController::class, "getAllPlans"]);
Route::get('/movies/subgenres', [SubGenresController::class, "index"]);
Route::get('/movies/subgenre/{subgenreSlug}', [MoviesController::class, 'getMoviePerSubgenre'])->middleware(LogRequests::class);
Route::get('/movies/getImage/{movie}', [MoviesController::class, 'getImage']);

// Provisional
Route::get('movies/', action: [MoviesController::class, 'index']);
Route::get('/movies/slug/{slug}', [MoviesController::class, 'showBySlug']);
Route::get('/{movie}', [MoviesController::class, 'show']);


// AUTHTENTICATED + SUBSCRIBED MOVIES
Route::prefix('movies')->middleware([CheckSubscription::class])->group(function () {
    //Route::get('/', [MoviesController::class, 'index']);
    // Route::get('/{movie}', [MoviesController::class, 'show']);
});

// ADMIN MOVIES
Route::apiResource('/movies', MoviesController::class)
    ->except(['index', 'show'])
    ->middleware([LogRequests::class, CheckRole::class]);

/*
|--------------------------------------------------------------------------
| Notas
|--------------------------------------------------------------------------
| Método HTTP   Ruta                Acción
| GET           /movies             index
| POST          /movies             store
| GET           /movies/{movie}     show
| PUT/PATCH     /movies/{movie}     update
| DELETE        /movies/{movie}     destroy
*/
