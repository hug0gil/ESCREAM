export interface MoviesFilter {
    search: string;
    subgenreIds: number[];
    rating: number[];
    countries: string[];
    yearRange: {
        min: number;
        max: number;
    };
}