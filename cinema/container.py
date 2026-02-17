from dependency_injector import containers, providers

from .repositories import BookingRepository, MovieHallRepository, MovieRepository, ScreeningRepository, SeatLockRepository
from .services import BookingService, MovieHallService, MovieService, ScreeningService, SeatLockService


class Container(containers.DeclarativeContainer):
    movie_repository = providers.Factory(MovieRepository)
    screening_repository = providers.Factory(ScreeningRepository)
    booking_repository = providers.Factory(BookingRepository)
    movie_hall_repository = providers.Factory(MovieHallRepository)
    seat_lock_repository = providers.Factory(SeatLockRepository)

    movie_service = providers.Factory(MovieService, repo=movie_repository)
    booking_service = providers.Factory(BookingService, repo=booking_repository)
    seat_lock_service = providers.Factory(SeatLockService, repo=seat_lock_repository)
    screening_service = providers.Factory(
        ScreeningService,
        repo=screening_repository,
        booking_repo=booking_repository,
    )
    movie_hall_service = providers.Factory(MovieHallService, repo=movie_hall_repository)


container = Container()
