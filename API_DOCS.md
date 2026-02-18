## Endpoints

### Movies

-   `GET /api/movies/`: Retrieve a list of all movies.
-   `POST /api/movies/`: Create a new movie.
-   `GET /api/movies/{id}/`: Retrieve a specific movie by its ID.
-   `PUT /api/movies/{id}/`: Update a specific movie.
-   `PATCH /api/movies/{id}/`: Partially update a specific movie.
-   `DELETE /api/movies/{id}/`: Delete a specific movie.
-   `GET /api/movies/{id}/screenings/`: Retrieve all screenings for a specific movie.
-   `GET /api/movies/search_tmdb/?query=<query>&page=<page>`: Search for movies on TMDB.
-   `GET /api/movies/popular_tmdb/?page=<page>`: Get popular movies from TMDB.
-   `GET /api/movies/tmdb_details/?movie_id=<id>`: Get details for a specific movie from TMDB.

### Screenings

-   `GET /api/screenings/`: Retrieve a list of all screenings.
-   `POST /api/screenings/`: Create a new screening.
-   `GET /api/screenings/{id}/`: Retrieve a specific screening by its ID.
-   `PUT /api/screenings/{id}/`: Update a specific screening.
-   `PATCH /api/screenings/{id}/`: Partially update a specific screening.
-   `DELETE /api/screenings/{id}/`: Delete a specific screening.
-   `GET /api/screenings/{id}/bookings/`: Retrieve all bookings for a specific screening.

### Bookings

-   `GET /api/bookings/`: Retrieve a list of all bookings.
-   `POST /api/bookings/`: Create a new booking.
-   `GET /api/bookings/{id}/`: Retrieve a specific booking by its ID.
-   `PUT /api/bookings/{id}/`: Update a specific booking.
-   `PATCH /api/bookings/{id}/`: Partially update a specific booking.
-   `DELETE /api/bookings/{id}/`: Delete a specific booking.

### Movie Halls

-   `GET /api/moviehalls/`: Retrieve a list of all movie halls.
-   `POST /api/moviehalls/`: Create a new movie hall.
-   `GET /api/moviehalls/{id}/`: Retrieve a specific movie hall by its ID.
-   `PUT /api/moviehalls/{id}/`: Update a specific movie hall.
-   `PATCH /api/moviehalls/{id}/`: Partially update a specific movie hall.
-   `DELETE /api/moviehalls/{id}/`: Delete a specific movie hall.
