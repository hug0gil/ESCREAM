export interface MoviesFilter {
    search: string;
    subgenres: string[];
    rating: number[];
    countries: string[];
    yearRange: {
        min: number;
        max: number;
    };
}
