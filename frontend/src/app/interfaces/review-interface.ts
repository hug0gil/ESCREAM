export interface Review {
    id: number;
    profileId: number;
    movieId: number;
    rating: number;
    comment?: string;
    date: string;
    createdAt: string;
    updatedAt: string;
    profile?: { id: number; profileName: string };
}

export interface ReviewPaginated {
    data: Review[];
    meta: {
        page: number;
        perPage: number;
        total: number;
        lastPage: number;
    };
}

export interface CreateReview {
    profileId: number;
    movieId: number;
    rating: number;
    comment?: string;
}