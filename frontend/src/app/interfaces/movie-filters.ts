export interface MoviesFilter {
    search?: string;

    subgenreIds?: number[];
    countries?: string[];
    rating?: number[];

    yearRange?: {
        min: number;
        max: number;
    };
}