# Carrusel de portadas de fondo (MainComponent)

Fondo animado de la página de inicio: varias **columnas de carteles** que se
desplazan en vertical (unas hacia arriba, otras hacia abajo) en bucle infinito,
con una capa oscura encima para que el texto de bienvenida se lea bien.

Afecta solo a tres archivos de `src/app/components/main/`:

- `main.component.ts` → trae las portadas y las reparte en columnas.
- `main.component.html` → pinta la rejilla de columnas detrás de la tarjeta.
- `main.component.css` → posiciona, oscurece y anima el fondo.

---

## 1. La lógica — `main.component.ts`

```ts
ngOnInit(): void {
  // Pedimos un buen puñado de portadas para llenar el fondo.
  this.movieService.getMoviesPaginated(1, 40).subscribe(res => {
    const images = res.data.map(m => m.image).filter(Boolean);
    if (images.length) {
      this.posterColumns = this.buildColumns(images, 5);
    }
  });
}

/**
 * Reparte las portadas en `count` columnas y duplica cada una,
 * para que el desplazamiento vertical se repita sin cortes.
 */
private buildColumns(images: string[], count: number): string[][] {
  const columns: string[][] = Array.from({ length: count }, () => []);
  images.forEach((img, i) => columns[i % count].push(img));
  return columns.map(col => [...col, ...col]);
}
```

**Qué hace, paso a paso:**

1. Reutiliza el `MovieService` que ya tenías: `getMoviesPaginated(1, 40)` pide
   las primeras 40 películas.
2. Se queda solo con las URLs de las portadas (`m.image`) y descarta vacías
   (`.filter(Boolean)`).
3. `buildColumns` reparte esas imágenes en 5 columnas con un reparto redondo
   (`i % count`): la 1ª imagen a la columna 0, la 2ª a la 1… y vuelta a empezar.
4. **El truco clave:** cada columna se **duplica** (`[...col, ...col]`). Esto es
   lo que permite el bucle infinito (ver la animación más abajo).

> Como el proyecto usa zone.js (no zoneless), basta con asignar a una propiedad
> normal (`posterColumns`); la suscripción del HTTP dispara la detección de
> cambios y la vista se actualiza sola.

---

## 2. La plantilla — `main.component.html`

```html
<!-- Carrusel de portadas de fondo (columnas que se desplazan en vertical) -->
<div class="poster-wall" aria-hidden="true">
  @for (col of posterColumns; track $index) {
    <div class="poster-col" [class.reverse]="$index % 2 === 1">
      @for (img of col; track $index) {
        <img class="poster" [src]="img" alt="" loading="lazy" />
      }
    </div>
  }
</div>

<section class="main-content"> … tarjeta de bienvenida … </section>
```

**Detalles:**

- `@for` (control flow nuevo de Angular) recorre las columnas y, dentro, las
  imágenes de cada columna.
- `[class.reverse]="$index % 2 === 1"` marca las columnas **impares** para que
  se muevan en sentido contrario (efecto entrelazado).
- `aria-hidden="true"` y `alt=""` → es decoración, así que se oculta a lectores
  de pantalla.
- `loading="lazy"` → las imágenes que aún no se ven no se descargan de golpe.

---

## 3. Los estilos — `main.component.css`

### El contenedor del fondo

```css
.poster-wall {
  position: fixed;
  inset: 0;          /* ocupa toda la ventana */
  z-index: -1;       /* detrás de todo el contenido en flujo */
  display: flex;
  gap: 12px;
  padding: 12px;
  overflow: hidden;  /* las columnas se salen por arriba y por abajo */
}
```

`position: fixed; inset: 0` lo hace ocupar toda la pantalla. La clave es
`z-index: -1`: lo manda **detrás** del contenido. Funciona porque ni el `body`,
ni el `app-wrapper`, ni el `.main-container` tienen un fondo opaco, así que el
carrusel se ve a través de ellos. La tarjeta (`.main-content`) lleva
`position: relative; z-index: 1` para quedar por delante.

### La capa oscura (legibilidad)

```css
.poster-wall::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 40%,
    rgba(13, 13, 255, 0.35),
    rgba(13, 4, 30, 0.9) 70%
  );
}
```

Un pseudo-elemento que cubre todo con un degradado oscuro semitransparente.
Sin esto, las portadas tan coloridas se comerían el texto.

### La animación (el "carrusel")

```css
.poster-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: scroll-down 60s linear infinite;
}

.poster-col.reverse {
  animation-name: scroll-up;
}

@keyframes scroll-up {
  from { transform: translateY(0); }
  to   { transform: translateY(-50%); }
}

@keyframes scroll-down {
  from { transform: translateY(-50%); }
  to   { transform: translateY(0); }
}
```

**Por qué es un bucle perfecto:** como en el `.ts` duplicamos cada columna, su
contenido es exactamente 2× su mitad. Al desplazar `translateY(-50%)` llegamos
justo al inicio de la copia duplicada, que es idéntica al punto de partida → el
salto es invisible y parece infinito. Las columnas `.reverse` hacen lo mismo
pero al revés, para el efecto entrelazado.

### Accesibilidad

```css
@media (prefers-reduced-motion: reduce) {
  .poster-col { animation: none; }
}
```

Si el usuario tiene activado "reducir movimiento" en su sistema, el fondo se
queda quieto.

---

## Cómo ajustarlo

| Quiero… | Dónde tocar |
|---|---|
| Más/menos portadas | el `40` en `getMoviesPaginated(1, 40)` (`.ts`) |
| Más/menos columnas | el `5` en `buildColumns(images, 5)` (`.ts`) |
| Más rápido/lento | el `60s` de `animation` en `.poster-col` (`.css`) |
| Más/menos oscuro | los `rgba(...)` del `.poster-wall::after` (`.css`) |
| Separación entre carteles | el `gap: 12px` (`.poster-wall` y `.poster-col`) |

---

## Notas / posibles mejoras

- Las URLs salen de `movie.image` tal cual, igual que en `movies-list`. Si algún
  día las portadas vienen relativas, habría que prefijarlas con la base.
- Si hay muy pocas películas, alguna columna quedará corta: baja el nº de
  columnas o sube el límite de portadas.
