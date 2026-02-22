from dependency_injector import containers, providers

from .repositories import BookingRepository, MovieHallRepository, MovieRepository, ScreeningRepository
from .services import BookingService, MovieHallService, MovieService, ScreeningService


class Container(containers.DeclarativeContainer):
    movie_repository = providers.Factory(MovieRepository)
    screening_repository = providers.Factory(ScreeningRepository)
    booking_repository = providers.Factory(BookingRepository)
    movie_hall_repository = providers.Factory(MovieHallRepository)

    movie_service = providers.Factory(MovieService, repo=movie_repository)
    booking_service = providers.Factory(BookingService, repo=booking_repository)
    screening_service = providers.Factory(
        ScreeningService,
        repo=screening_repository,
        booking_repo=booking_repository,
    )
    movie_hall_service = providers.Factory(MovieHallService, repo=movie_hall_repository)


container = Container()
