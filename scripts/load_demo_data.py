"""Safely seed the included sample workbook data for a quick dashboard demo.

This script only inserts rows that do not already exist. It never deletes,
truncates, or overwrites existing inventory or Golden Configuration records.
It directly imports the included Golden Configuration workbook and therefore
is a demo shortcut, not the AI proposal/approval workflow.

Run from the project root after configuring .env:
    python scripts/load_demo_data.py
"""

import asyncio
from pathlib import Path

import pandas as pd

from app.db_handler.mongodb import client, database

ROOT = Path(__file__).resolve().parents[1]


def _native_records(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(f"Sample workbook not found: {path}")
    frame = pd.read_excel(path)
    frame.columns = [str(column).strip() for column in frame.columns]
    frame = frame.astype(object).where(pd.notna(frame), None)
    records = []
    for row in frame.to_dict(orient="records"):
        item = {}
        for key, value in row.items():
            if hasattr(value, "item"):
                value = value.item()
            if value is not None and hasattr(value, "isoformat") and not isinstance(value, str):
                value = value.isoformat()
            item[key] = value
        records.append(item)
    return records


async def main() -> None:
    inventory_path = ROOT / "data" / "server_inventory_1000.xlsx"
    golden_path = ROOT / "data" / "golden_configuration.xlsx"

    inventory = _native_records(inventory_path)
    golden = _native_records(golden_path)

    inventory_collection = database["server_inventory"]
    golden_collection = database["golden_configuration"]

    existing_ids = {
        row["server_id"]
        for row in await inventory_collection.find(
            {"server_id": {"$in": [row["server_id"] for row in inventory]}},
            {"_id": 0, "server_id": 1},
        ).to_list(length=None)
    }
    new_inventory = [row for row in inventory if row.get("server_id") not in existing_ids]
    if new_inventory:
        await inventory_collection.insert_many(new_inventory, ordered=False)

    existing_types = {
        row["instance_type"]
        for row in await golden_collection.find(
            {"instance_type": {"$in": [row["instance_type"] for row in golden]}},
            {"_id": 0, "instance_type": 1},
        ).to_list(length=None)
    }
    new_golden = []
    for row in golden:
        if row.get("instance_type") in existing_types:
            continue
        normalized = dict(row)
        normalized["required_security_baseline"] = normalized.pop("security_baseline", None)
        normalized["demand_cost_per_hour"] = normalized.pop("cost_per_hour", None)
        normalized["estimated_monthly_cost"] = normalized.pop("monthly_cost", None)
        normalized["source"] = "included_demo_workbook_direct_import"
        new_golden.append(normalized)
    if new_golden:
        await golden_collection.insert_many(new_golden, ordered=False)

    inventory_total = await inventory_collection.count_documents({})
    golden_total = await golden_collection.count_documents({})

    print("Demo data import completed without deleting or overwriting records.")
    print(f"Inventory rows newly inserted: {len(new_inventory)}")
    print(f"Golden baselines newly inserted: {len(new_golden)}")
    print(f"Inventory records now in collection: {inventory_total}")
    print(f"Golden baselines now in collection: {golden_total}")
    print("NOTE: This imports active sample baselines directly for a quick demo.")
    print("For the User -> AI proposal -> Admin approval demonstration, use the frontend workflow instead.")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
