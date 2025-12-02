<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Subgenre extends Model
{

    protected $fillable = ['name', 'slug'];

    protected $hidden = [
        "created_at",
        "updated_at"
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($subgenre) {
            $subgenre->slug = Str::slug($subgenre->name);
        });

        static::updating(function ($subgenre) {
            $subgenre->slug = Str::slug($subgenre->name);
        });
    }


    public function movies()
    {
        return $this->belongsToMany(Movie::class, 'movie_subgenre', 'subgenre_id', 'movie_id');
    }
}
