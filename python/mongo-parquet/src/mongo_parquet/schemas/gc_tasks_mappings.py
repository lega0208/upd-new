import polars as pl
from pymongoarrow.api import Schema
from pymongoarrow.types import ObjectIdType
from pyarrow import string, list_, timestamp
from bson import ObjectId
from ..mongo import MongoModel


class GcTasksMappings(MongoModel):
    collection: str = "gc_tasks_mappings"
    filter: dict = {}
    projection: dict | None = None
    schema: Schema = Schema(
        {
            "_id": ObjectId,
            "airtable_id": string(),
            "title": string(),
            "title_fr": string(),
            "tasks": list_(ObjectIdType()),  # Can be ObjectId or Task ref
            "date_mapped": timestamp("ms"),
        }
    )

    def transform(self, df: pl.DataFrame) -> pl.DataFrame:
        return (
            df.with_columns(
                pl.col("_id").bin.encode("hex"),
                pl.col("tasks").list.eval(pl.element().bin.encode("hex")),
                pl.col("date_mapped").cast(pl.Datetime),
            )
        )