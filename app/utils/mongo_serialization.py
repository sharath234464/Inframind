from __future__ import annotations

from datetime import date, datetime
from bson import ObjectId


def serialize_mongo(value):
    """Convert MongoDB BSON values into JSON-safe Python values recursively.

    This function only transforms values returned to the API; it never writes
    to MongoDB and never changes stored documents.
    """
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(key): serialize_mongo(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [serialize_mongo(item) for item in value]
    return value
