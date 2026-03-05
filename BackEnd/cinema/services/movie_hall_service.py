"""MovieHallService — list cinema halls."""

from dataclasses import dataclass
from ..repositories import MovieHallRepository


@dataclass(frozen=True)
class MovieHallService:
    """Thin service wrapper around MovieHallRepository."""
    repo: MovieHallRepository

    def list_halls(self):
        return self.repo.list()
