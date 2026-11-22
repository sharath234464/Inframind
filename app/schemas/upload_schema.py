from pydantic import BaseModel


class UploadResponse(BaseModel):
    status: bool
    message: str
    filename: str
    uploaded_records: int