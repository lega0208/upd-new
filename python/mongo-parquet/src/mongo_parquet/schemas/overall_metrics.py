import polars as pl
from pymongoarrow.api import Schema
from bson import ObjectId
from pyarrow import string, timestamp, list_, float64, int32
from pymongoarrow.types import ObjectIdType
from ..mongo import MongoModel


class OverallMetrics(MongoModel):
    collection: str = "overall_metrics"
    schema: Schema = Schema(
        {
            "_id": ObjectId,
            "date": timestamp("ms"),
            "average_time_spent": float64(),
            "bouncerate": float64(),
            "dyf_no": int32(),
            "dyf_submit": int32(),
            "dyf_yes": int32(),
            "fwylf_cant_find_info": int32(),
            "fwylf_error": int32(),
            "fwylf_hard_to_understand": int32(),
            "fwylf_other": int32(),
            "gsc_total_clicks": int32(),
            "gsc_total_ctr": float64(),
            "gsc_total_impressions": int32(),
            "gsc_total_position": float64(),
            "nav_menu_initiated": int32(),
            "rap_404": int32(),
            "rap_access_code": int32(),
            "rap_blank_form": int32(),
            "rap_cant_find": int32(),
            "rap_completed": int32(),
            "rap_gc_key": int32(),
            "rap_info_missing": int32(),
            "rap_info_wrong": int32(),
            "rap_initiated": int32(),
            "rap_link_not_working": int32(),
            "rap_login_error": int32(),
            "rap_other": int32(),
            "rap_other_login": int32(),
            "rap_securekey": int32(),
            "rap_sin": int32(),
            "rap_spelling": int32(),
            "views": int32(),
            "visitors": int32(),
            "visits": int32(),
            "visits_device_desktop": int32(),
            "visits_device_mobile": int32(),
            "visits_device_other": int32(),
            "visits_device_tablet": int32(),
            "visits_geo_ab": int32(),
            "visits_geo_bc": int32(),
            "visits_geo_mb": int32(),
            "visits_geo_nb": int32(),
            "visits_geo_nl": int32(),
            "visits_geo_ns": int32(),
            "visits_geo_nt": int32(),
            "visits_geo_nu": int32(),
            "visits_geo_on": int32(),
            "visits_geo_outside_canada": int32(),
            "visits_geo_pe": int32(),
            "visits_geo_qc": int32(),
            "visits_geo_sk": int32(),
            "visits_geo_us": int32(),
            "visits_geo_yt": int32(),
            "visits_referrer_other": int32(),
            "visits_referrer_searchengine": int32(),
            "visits_referrer_social": int32(),
            "visits_referrer_typed_bookmarked": int32(),
        }
    )

    def transform(self, df: pl.DataFrame) -> pl.DataFrame:
        return df.with_columns(
            pl.col("_id").bin.encode("hex"),
        ).sort("date")
