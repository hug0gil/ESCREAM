export type AdminFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'date'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'country'
  | 'multiselect'
  | 'rating';

export interface AdminColumn {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'boolean' | 'number' | 'image';
}

export interface AdminOptionSource {
  resource: string;
  labelKey: string;
  perPage?: number;
}

export interface AdminField {
  key: string;
  label: string;
  type: AdminFieldType;
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  step?: number;
  placeholder?: string;
  optionSource?: AdminOptionSource;
  valuePath?: string;
  relationArray?: {
    path: string;
    itemPath?: string;
    idKey?: string;
  };
  omitWhenEmpty?: boolean;
  createOnly?: boolean;
}

export interface AdminCrudConfig {
  resource: string;
  routePath: string;
  singular: string;
  plural: string;
  createLabel?: string;
  seedImages?: boolean;
  idLabel?: string;
  columns: AdminColumn[];
  fields: AdminField[];
  deleteLabelKey: string;
}

export const ADMIN_CRUD_CONFIGS: Record<string, AdminCrudConfig> = {
  movies: {
    resource: 'movies',
    routePath: 'movies',
    singular: 'película',
    plural: 'Películas',
    createLabel: 'Nueva película',
    seedImages: true,
    deleteLabelKey: 'title',
    columns: [
      { key: 'id', label: '#' },
      { key: 'image', label: '', type: 'image' },
      { key: 'title', label: 'Título' },
      { key: 'director.name', label: 'Director' },
      { key: 'year', label: 'Año', type: 'number' },
      { key: 'country', label: 'País' },
    ],
    fields: [
      { key: 'title', label: 'Título', type: 'text', required: true, maxLength: 255, placeholder: 'Ej: Escream' },
      { key: 'synopsis', label: 'Sinopsis', type: 'textarea', placeholder: 'Breve descripción de la película...' },
      { key: 'image', label: 'URL imagen', type: 'text', maxLength: 2048, placeholder: 'https://...' },
      { key: 'movieUrl', label: 'URL película', type: 'text', maxLength: 2048, placeholder: 'https://...' },
      { key: 'year', label: 'Año', type: 'number', min: 1800, max: 2100, placeholder: 'Ej: 1972', omitWhenEmpty: true },
      { key: 'rating', label: 'Nivel de miedo', type: 'rating', min: 1, max: 5, omitWhenEmpty: true },
      {
        key: 'directorId',
        label: 'Director',
        type: 'select',
        required: true,
        optionSource: { resource: 'directors', labelKey: 'name', perPage: 200 },
      },
      {
        key: 'productionCompanyId',
        label: 'Productora',
        type: 'select',
        required: true,
        optionSource: { resource: 'production-companies', labelKey: 'name', perPage: 200 },
      },
      { key: 'country', label: 'País', type: 'country', required: true, maxLength: 255 },
      {
        key: 'actorIds',
        label: 'Actores',
        type: 'multiselect',
        optionSource: { resource: 'actors', labelKey: 'name', perPage: 300 },
        relationArray: { path: 'actors', itemPath: 'actor', idKey: 'id' },
        omitWhenEmpty: true,
      },
      {
        key: 'subgenreIds',
        label: 'Subgéneros',
        type: 'multiselect',
        optionSource: { resource: 'subgenres', labelKey: 'name', perPage: 200 },
        relationArray: { path: 'subgenres', itemPath: 'subgenre', idKey: 'id' },
        omitWhenEmpty: true,
      },
    ],
  },
  reviews: {
    resource: 'reviews',
    routePath: 'reviews',
    singular: 'review',
    plural: 'Reviews',
    createLabel: 'Nueva reseña',
    deleteLabelKey: 'comment',
    columns: [
      { key: 'id', label: '#' },
      { key: 'movie.title', label: 'Película' },
      { key: 'profile.profileName', label: 'Perfil' },
      { key: 'rating', label: 'Rating', type: 'number' },
      { key: 'comment', label: 'Comentario' },
      { key: 'createdAt', label: 'Creada', type: 'date' },
    ],
    fields: [
      {
        key: 'profileId',
        label: 'Perfil',
        type: 'select',
        required: true,
        optionSource: { resource: 'profiles', labelKey: 'profileName', perPage: 200 },
      },
      {
        key: 'movieId',
        label: 'Película',
        type: 'select',
        required: true,
        optionSource: { resource: 'movies', labelKey: 'title', perPage: 200 },
      },
      { key: 'rating', label: 'Rating', type: 'number', required: true, min: 0, max: 9.9, step: 0.1 },
      { key: 'comment', label: 'Comentario', type: 'textarea', maxLength: 1000, omitWhenEmpty: true },
    ],
  },
  users: {
    resource: 'users',
    routePath: 'users',
    singular: 'usuario',
    plural: 'Usuarios',
    createLabel: 'Nuevo usuario',
    deleteLabelKey: 'email',
    columns: [
      { key: 'id', label: '#' },
      { key: 'name', label: 'Nombre' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Rol' },
      { key: 'subscribed', label: 'Suscrito', type: 'boolean' },
      { key: 'planId', label: 'Plan' },
    ],
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', required: true, maxLength: 255 },
      { key: 'email', label: 'Email', type: 'email', required: true, maxLength: 255 },
      {
        key: 'planId',
        label: 'Plan',
        type: 'select',
        optionSource: { resource: 'plans', labelKey: 'name', perPage: 50 },
        omitWhenEmpty: true,
      },
      { key: 'startDate', label: 'Fecha inicio', type: 'date', omitWhenEmpty: true },
      { key: 'endDate', label: 'Fecha fin', type: 'date', omitWhenEmpty: true },
      { key: 'subscribed', label: 'Suscrito', type: 'checkbox' },
    ],
  },
  directors: {
    resource: 'directors',
    routePath: 'directors',
    singular: 'director',
    plural: 'Directores',
    createLabel: 'Nuevo director',
    deleteLabelKey: 'name',
    columns: [
      { key: 'id', label: '#' },
      { key: 'name', label: 'Nombre' },
      { key: 'birthDate', label: 'Nacimiento', type: 'date' },
    ],
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', required: true, maxLength: 255 },
      { key: 'birthDate', label: 'Fecha de nacimiento', type: 'date', required: true },
    ],
  },
  actors: {
    resource: 'actors',
    routePath: 'actors',
    singular: 'actor',
    plural: 'Actores',
    createLabel: 'Nuevo actor',
    deleteLabelKey: 'name',
    columns: [
      { key: 'id', label: '#' },
      { key: 'name', label: 'Nombre' },
      { key: 'country', label: 'País' },
      { key: 'birthDate', label: 'Nacimiento', type: 'date' },
    ],
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', required: true, maxLength: 255 },
      { key: 'birthDate', label: 'Fecha de nacimiento', type: 'date', required: true },
      { key: 'country', label: 'País', type: 'country', required: true, maxLength: 255 },
    ],
  },
  'production-companies': {
    resource: 'production-companies',
    routePath: 'production-companies',
    singular: 'productora',
    plural: 'Productoras',
    createLabel: 'Nueva productora',
    deleteLabelKey: 'name',
    columns: [
      { key: 'id', label: '#' },
      { key: 'name', label: 'Nombre' },
      { key: 'country', label: 'País' },
    ],
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', required: true, maxLength: 255 },
      { key: 'country', label: 'País', type: 'country', required: true, maxLength: 255 },
    ],
  },
  subgenres: {
    resource: 'subgenres',
    routePath: 'subgenres',
    singular: 'subgénero',
    plural: 'Subgéneros',
    createLabel: 'Nuevo subgénero',
    deleteLabelKey: 'name',
    columns: [
      { key: 'id', label: '#' },
      { key: 'name', label: 'Nombre' },
      { key: 'slug', label: 'Slug' },
      { key: 'description', label: 'Descripción' },
    ],
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', required: true, maxLength: 255 },
      { key: 'description', label: 'Descripción', type: 'textarea', maxLength: 255, omitWhenEmpty: true },
    ],
  },
};
