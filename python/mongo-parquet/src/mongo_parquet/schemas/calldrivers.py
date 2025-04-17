import polars as pl
from pymongoarrow.api import Schema
from bson import ObjectId
from pyarrow import string, timestamp, list_, float64, int32
from pymongoarrow.types import ObjectIdType
from ..mongo import MongoModel

class Calldrivers(MongoModel):
    collection: str = "calldrivers"
    filter: dict | None = None
    projection: dict | None = None
    schema: Schema = Schema(
        {
            "_id": ObjectId,
            "airtable_id": string(),
            "date": timestamp("ms"),
            "enquiry_line": string(),
            "topic": string(),
            "subtopic": string(),
            "sub_subtopic": string(),
            "tpc_id": int32(),
            "impact": float64(),
            "calls": int32(),
            "selfserve_yes": int32(),
            "selfserve_no": int32(),
            "selfserve_na": int32(),
            "tasks": list_(ObjectIdType()),
            "projects": list_(ObjectIdType()),
        }
    )

    def transform(self, df: pl.DataFrame) -> pl.DataFrame:
        return df.with_columns(
            pl.col("_id").bin.encode("hex"),
            pl.col("tasks").list.eval(pl.element().bin.encode("hex")),
            pl.col("projects").list.eval(pl.element().bin.encode("hex")),
            pl.col("impact").round(4).cast(pl.Float32),
        )
