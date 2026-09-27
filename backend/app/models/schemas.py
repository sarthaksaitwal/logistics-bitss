from pydantic import BaseModel, Field, model_validator

from app.config import settings


class Stop(BaseModel):
    id: str = Field(min_length=1)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class OptimizeRequest(BaseModel):
    stops: list[Stop] = Field(min_length=2, max_length=settings.max_stops)
    depot_index: int = Field(default=0, ge=0)
    return_to_depot: bool = True

    @model_validator(mode="after")
    def check_depot_and_ids(self):
        if self.depot_index >= len(self.stops):
            raise ValueError("depot_index is out of range")

        ids = [stop.id for stop in self.stops]
        if len(ids) != len(set(ids)):
            raise ValueError("stop ids must be unique")

        return self


class OptimizeResponse(BaseModel):
    order: list[str]                         # stop ids in visiting order
    geometry: list[tuple[float, float]]      # road line as (lat, lng) points
    total_duration_s: float
    total_distance_m: float
    naive_duration_s: float
    naive_distance_m: float
