from pydantic import BaseModel


class GoldenUploadResponse(BaseModel):
    status: bool
    message: str
    filename: str
    uploaded_records: int