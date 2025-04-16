import os
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Optional

from bson import ObjectId
from pymongo import MongoClient
from dotenv import load_dotenv

def export_from_mongo(local_dir: Optional[str] = None):
    from mongo_parquet.mongo import MongoConverter
    from mongo_parquet.schemas import (
        AASearchTerms, ActivityMap, Calldrivers, Feedback,
        GSCSearchTerms, GcTss, OverallMetrics, OverallGSCSearchTerms,
        PageMetrics, Pages, Projects, Tasks, Urls, UxTests,
        Readability, SearchAssessment, Reports, Annotations
    )

    load_dotenv()
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = MongoClient(MONGO_URI)
    db = client["upd-test"]

    start_time = datetime.now()
    print("⏳ Starting export...")

    start_date = datetime(2024, 1, 1)
    end_date = datetime.now() - timedelta(days=1)

    print("🔍 Fetching filter references...")

    project_ids = [
        ObjectId("64bb7ea337b9d8195e3b441d"),
        ObjectId("621d280492982ac8c344d372"),
        ObjectId("632c6dda259d340af9c37199"),
    ]

    task_ids = [t["_id"] for t in db.tasks.find({ "projects": { "$in": project_ids } })]
    page_ids = [p["_id"] for p in db.pages.find({ "tasks": { "$in": task_ids } })]

    @dataclass
    class ExportModel:
        model: any
        filter: Optional[dict] = None
        date_range: bool = False
        rename: Optional[str] = None

    MODELS = [
        ExportModel(PageMetrics(),   {"tasks": {"$in": task_ids}},     True),
        ExportModel(GcTss(),         None,                             True),
        ExportModel(Feedback(),      None,                             True),
        ExportModel(AASearchTerms(), {"tasks": {"$in": task_ids}},     True,  "pages_metrics_aa_searchterms"),
        ExportModel(ActivityMap(),   {"tasks": {"$in": task_ids}},     True,  "pages_metrics_activity_map"),
        ExportModel(GSCSearchTerms(),{"tasks": {"$in": task_ids}},     True,  "pages_metrics_gsc_searchterms"),
        ExportModel(Calldrivers(),   None,                             True),
        ExportModel(OverallMetrics(),None,                             True),
        ExportModel(OverallGSCSearchTerms(), None,                     True,  "overall_metrics_gsc_searchterms"),
        ExportModel(Pages(),         {"tasks": {"$in": task_ids}},     False),
        ExportModel(Projects(),      {"_id": {"$in": project_ids}},     False),
        ExportModel(Tasks(),         {"_id": {"$in": task_ids}},        False),
        ExportModel(Urls(),          {"page": {"$in": page_ids}},      False),
        ExportModel(UxTests(),       {"tasks": {"$in": task_ids}},     False),
        ExportModel(Readability(),   {"page": {"$in": page_ids}},      False),
        ExportModel(SearchAssessment(), None,                         False),
        ExportModel(Reports(),       None,                             False),
        ExportModel(Annotations(),   None,                             False),
    ]

    converter = MongoConverter()

    for item in MODELS:
        if item.filter:
            item.model.filter = item.filter
        if item.date_range:
            item.model.start = start_date
            item.model.end = end_date

        name = item.rename or item.model.collection
        print(f"📦 Exporting: `{name}`...")
        converter.save(item.model, collection_rename=item.rename, output_dir=local_dir)

    print(f"✅ All exports completed in {datetime.now() - start_time}")

def import_to_mongo(use_azure: bool = False, local_dir: Optional[str] = None):
    import os
    import polars as pl
    from pymongo import MongoClient
    from bson import ObjectId
    from pymongoarrow.monkey import patch_all

    patch_all()

    MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DB_NAME = "test"

    USE_AZURE = use_azure or False
    DATA_DIR = local_dir or os.getenv("LOCAL_PARQUET_DIR", "sample")
    AZURE_CONTAINER = os.getenv("AZURE_STORAGE_CONTAINER")
    AZURE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")

    print(DATA_DIR)

    if USE_AZURE:
        from adlfs import AzureBlobFileSystem
        fs = AzureBlobFileSystem(connection_string=AZURE_CONNECTION_STRING)

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]

    def array_to_object(arr):
        if isinstance(arr, list):
            return {item["k"]: item["v"] for item in arr if isinstance(item, dict) and "k" in item and "v" in item}
        return arr

    def convert_objectids(value):
        if isinstance(value, str):
            try:
                return ObjectId(value)
            except:
                return value
        elif isinstance(value, dict):
            return {k: convert_objectids(v) for k, v in value.items()}
        elif isinstance(value, list):
            return [convert_objectids(item) for item in value]
        return value

    def parse_objectids(row):
        for key in ["_id", "tasks", "page", "pages", "project", "projects", "ux_tests", "attachments", "en_attachment", "fr_attachment"]:
            if key in row:
                row[key] = convert_objectids(row[key])
        return row

    def read_parquet(filename: str) -> pl.DataFrame:
        if USE_AZURE:
            with fs.open(f"{filename}", "rb") as f:
                return pl.read_parquet(f)
        else:
            return pl.read_parquet(os.path.join(DATA_DIR, filename))
        
    # --- Config for merged collections ---
    IMPORT_CONFIG = {
        "pages_metrics": {
            "base": "pages_metrics.parquet",
            "extensions": [
                ("pages_metrics_activity_map.parquet", "activity_map", ["link", "clicks"]),
                ("pages_metrics_gsc_searchterms.parquet", "gsc_searchterms", ["clicks", "ctr", "impressions", "position", "term"]),
                ("pages_metrics_aa_searchterms.parquet", "aa_searchterms", ["term", "clicks", "position"]),
            ],
        },
        "overall_metrics": {
            "base": "overall_metrics.parquet",
            "extensions": [
                ("overall_metrics_gsc_searchterms.parquet", "gsc_searchterms", ["clicks", "ctr", "impressions", "position", "term"]),
            ],
        },
    }

    def load_and_insert_all_files():
        files = (
            sorted(fs.find(AZURE_CONTAINER)) if USE_AZURE
            else sorted(f for f in os.listdir(DATA_DIR) if f.endswith(".parquet"))
        )

        base_targets = {}
        skip_files = set()
        
        for name, cfg in IMPORT_CONFIG.items():
            base_targets[os.path.basename(cfg["base"])] = name
            for ext in cfg["extensions"]:
                skip_files.add(ext[0]) 

        for filename in sorted(files):
            base_filename = os.path.basename(filename)
            is_base_file = base_filename in base_targets

            if not is_base_file and os.path.basename(filename) in skip_files:
                print(f"⚠️ Skipping {filename} (used as extension)")
                continue

            collection_name = os.path.splitext(os.path.basename(filename))[0]

            if is_base_file:
                collection_name = base_targets[base_filename]
                cfg = IMPORT_CONFIG[collection_name]
                print(f"\n📄 Merged load: {filename} → {collection_name}")

                base_df = read_parquet(filename)

                for ext_filename, nested_field, struct_fields in cfg["extensions"]:
                    
                    matched = [f for f in files if os.path.basename(f) == ext_filename]
                    if not matched:
                        print(f"⚠️ Missing extension file: {ext_filename}")
                        continue

                    ext_path = matched[0]
                    ext_df = read_parquet(ext_path)

                    if "date" in ext_df.columns:
                        ext_df = ext_df.drop("date")

                    ext_df = ext_df.select(["_id"] + struct_fields)

                    struct_fields = [str(f) for f in struct_fields]

                    ext_df_non_null = ext_df.filter(
                        pl.any_horizontal([pl.col(f).is_not_null() for f in struct_fields])
                    )

                    nested = ext_df_non_null.group_by("_id").agg(
                        pl.struct([pl.col(f) for f in struct_fields]).alias(nested_field)
                    )

                    if nested_field in base_df.columns:
                        base_df = base_df.drop(nested_field)

                    base_df = base_df.join(nested, on="_id", how="left")

                df = base_df
            else:
                print(f"\n📂 Standalone load: {filename} → {collection_name}")
                df = read_parquet(filename)

            records = []
            for rec in df.to_dicts():
                rec = parse_objectids(rec)

                if os.path.basename(filename) == "urls.parquet":
                    for field in ["metadata", "langHrefs", "all_titles"]:
                        if field in rec:
                            rec[field] = array_to_object(rec[field])
                elif os.path.basename(filename) == "pages.parquet":
                    for field in ["metadata"]:
                        if field in rec:
                            rec[field] = array_to_object(rec[field])

                keep_empty_lists = {"attachments"}
                rec = {
                    k: v for k, v in rec.items()
                    if v is not None and (v != [] or k in keep_empty_lists) and v != {}
                }

                records.append(rec)

            collection = db[collection_name]
            existing_ids = set(doc["_id"] for doc in collection.find({}, {"_id": 1}))
            new_records = [doc for doc in records if doc["_id"] not in existing_ids]

            if new_records:
                collection.insert_many(new_records)
                print(f"✅ Inserted {len(new_records)} into `{collection_name}`")
            else:
                print(f"🟡 No new documents to insert into `{collection_name}`")


    mode = "Azure Blob" if USE_AZURE else "Local filesystem"
    print(f"🚀 Starting import from {mode}...")

    load_and_insert_all_files()

def upload_to_azure(local_dir: Optional[str] = None):
    import os
    from dotenv import load_dotenv
    from adlfs import AzureBlobFileSystem

    load_dotenv()

    fs = AzureBlobFileSystem(connection_string=os.getenv("AZURE_STORAGE_CONNECTION_STRING"))
    CONTAINER = os.getenv("AZURE_STORAGE_CONTAINER")
    LOCAL_DIR = local_dir or "sample"
    REMOTE_PREFIX = "sample"

    for root, _, files in os.walk(LOCAL_DIR):
        for file in files:
            if file.endswith(".parquet"):
                local_path = os.path.join(root, file)
                relative_path = os.path.relpath(local_path, LOCAL_DIR)
                remote_path = os.path.join(REMOTE_PREFIX, relative_path).replace("\\", "/")

                blob_path = f"{CONTAINER}/{remote_path}"

                print(f"⬆️  Uploading: {local_path} → {blob_path}")
                with open(local_path, "rb") as f:
                    fs.pipe_file(blob_path, f.read())

    print("✅ All Parquet files uploaded.")

def download_from_azure(local_dir: Optional[str] = None):
    import os
    from dotenv import load_dotenv
    from adlfs import AzureBlobFileSystem

    load_dotenv()

    fs = AzureBlobFileSystem(connection_string=os.getenv("AZURE_STORAGE_CONNECTION_STRING"))
    CONTAINER = os.getenv("AZURE_STORAGE_CONTAINER")
    LOCAL_DIR = local_dir or os.getenv("LOCAL_PARQUET_DIR", "sample")
    REMOTE_PREFIX = os.getenv("AZURE_REMOTE_PREFIX", "sample")

    print(f"☁️ Downloading Parquet files from Azure `{CONTAINER}/{REMOTE_PREFIX}` → local `{LOCAL_DIR}`...")

    all_files = fs.find(f"{CONTAINER}/{REMOTE_PREFIX}")

    for remote_path in all_files:
        if not remote_path.endswith(".parquet"):
            continue

        relative_path = os.path.relpath(remote_path, f"{CONTAINER}/{REMOTE_PREFIX}")
        local_path = os.path.join(LOCAL_DIR, relative_path)

        os.makedirs(os.path.dirname(local_path), exist_ok=True)

        print(f"⬇️  Downloading: {remote_path} → {local_path}")
        with fs.open(remote_path, "rb") as remote_file:
            with open(local_path, "wb") as local_file:
                local_file.write(remote_file.read())

    print("✅ All Parquet files downloaded.")

def main():
    import argparse

    parser = argparse.ArgumentParser(description="MongoDB ↔ Parquet utility tool")
    parser.add_argument(
        "--export-from-mongo",
        action="store_true",
        help="Export data from MongoDB to Parquet files.",
    )

    parser.add_argument(
        "--import-to-mongo",
        action="store_true",
        help="Import parquet data to MongoDB",
    )

    parser.add_argument(
        "--upload-to-azure",
        action="store_true",
        help="Upload data to Azure Blob Storage",
    )

    parser.add_argument(
        "--use-azure",
        action="store_true",
        help="To use Azure Blob Storage or Local filesystem",
    )

    parser.add_argument(
        "--download-from-azure",
        action="store_true",
        help="Download data from Azure Blob Storage",
    )

    parser.add_argument(
        "--local-dir",
        type=str,
        default=None,
        help="Override local directory for reading/writing Parquet files.",
    )

    args = parser.parse_args()

    if args.export_from_mongo:
        export_from_mongo(local_dir=args.local_dir)
    if args.import_to_mongo: 
        import_to_mongo(use_azure=args.use_azure, local_dir=args.local_dir)
    if args.upload_to_azure:
        upload_to_azure(local_dir=args.local_dir)
    if args.download_from_azure:
        download_from_azure(local_dir=args.local_dir)
    if not (args.export_from_mongo or args.import_to_mongo or args.upload_to_azure):
        print("No action specified. Use --export_from_mongo (export), --import_to_mongo (import), or --upload_to_azure (upload), or --download_from_azure (download).")
        print("Use --help for more information.")

if __name__ == "__main__":
    main()