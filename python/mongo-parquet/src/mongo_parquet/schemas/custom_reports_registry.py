import polars as pl
from pymongoarrow.api import Schema
from pymongoarrow.types import ObjectIdType
from pyarrow import string, list_, struct, timestamp, bool_
from bson import ObjectId
from ..mongo import MongoModel


class CustomReportsRegistry(MongoModel):
    collection: str = "custom_reports_registry"
    filter: dict = {}
    projection: dict | None = None

    schema: Schema = Schema(
        {
            "_id": ObjectId,
            "config": struct(
                {
                    "dateRange": struct(
                        {
                            "start": timestamp("ms"),
                            "end": timestamp("ms"),
                        }
                    ),
                    "granularity": string(),
                    "urls": list_(string()),
                    "grouped": bool_(),
                    "metrics": list_(string()),
                    "breakdownDimension": string(),
                }
            ),
            "configHash": string(),
        }
    )

    def transform(self, df: pl.DataFrame) -> pl.DataFrame:
        return (
            df.with_columns(
                pl.col("_id").bin.encode("hex"),
            )
        )