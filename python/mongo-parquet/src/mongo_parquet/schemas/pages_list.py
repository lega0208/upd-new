import polars as pl
from pymongoarrow.api import Schema
from pymongoarrow.types import ObjectIdType
from pyarrow import string, timestamp
from bson import ObjectId
from ..mongo import MongoModel


class PagesList(MongoModel):
    collection: str = "pages_list"
    filter: dict = {}
    projection: dict | None = None

    schema: Schema = Schema(
        {
            "_id": ObjectId,
            "airtable_id": string(),
            "url": string(),
            "title": string(),
            "lang": string(),  # values: 'en', 'fr', or ''
            "last_255": string(),
            "owners": string(),
            "sections": string(),
            "updatedAt": timestamp("ms"),
            "createdAt": timestamp("ms"),
        }
    )

    def transform(self, df: pl.DataFrame) -> pl.DataFrame:
        return (
            df.with_columns(
                pl.col("_id").bin.encode("hex"),
                pl.col("updatedAt").cast(pl.Datetime),
                pl.col("createdAt").cast(pl.Datetime),
                pl.col("lang").fill_null("").str.strip_chars(),  # normalize empty/null lang
            )
        )