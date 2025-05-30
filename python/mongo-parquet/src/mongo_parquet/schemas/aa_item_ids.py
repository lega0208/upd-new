import polars as pl
from pymongoarrow.api import Schema
from pymongoarrow.types import ObjectIdType
from pyarrow import string, list_, struct
from bson import ObjectId
from ..mongo import MongoModel


class AAItemIds(MongoModel):
    collection: str = "aa_item_ids"
    filter: dict = {}
    projection: dict | None = None
    schema: Schema = Schema(
        {
            "_id": ObjectId,
            "type": string(),
            "page": ObjectId,
            "pages": list_(ObjectIdType()),
            "itemId": string(),
            "value": string(),
        }
    )

    def transform(self, df: pl.DataFrame) -> pl.DataFrame:
        return (
            df.with_columns(
                pl.col("_id").bin.encode("hex"),
                pl.col("page").bin.encode("hex"),
                pl.col("pages").cast(pl.List(pl.Binary)).list.eval(pl.element().bin.encode("hex")),
            )
        )
