from datetime import datetime, timezone

from fastapi import HTTPException, UploadFile

from app.repository.inventory_repository import inventory_repository
from app.repository.golden_repository import golden_repository

from app.schemas.upload_schema import UploadResponse
from app.schemas.golden_schema import GoldenUploadResponse

from app.service.validation_service import validation_service
from app.utils.excel_reader import excel_reader


class UploadService:

    @staticmethod
    def _native_records(dataframe) -> list[dict]:
        """Convert dataframe values into Python/BSON-compatible values."""

        frame = dataframe.astype(object).where(
            dataframe.notna(),
            None
        )

        records = frame.to_dict(
            orient="records"
        )

        normalized = []

        for row in records:
            item = {}

            for key, value in row.items():

                if hasattr(value, "item"):
                    value = value.item()

                if (
                    value is not None
                    and hasattr(value, "isoformat")
                    and not isinstance(value, str)
                ):
                    value = value.isoformat()

                item[str(key).strip().lower()] = value

            normalized.append(item)

        return normalized

    @staticmethod
    def _normalise_columns(dataframe):
        dataframe.columns = (
            dataframe.columns
            .astype(str)
            .str.strip()
            .str.lower()
        )

        return dataframe

    # --------------------------------------------------
    # USER INVENTORY SUBMISSION FOR ADMIN APPROVAL
    # --------------------------------------------------

    async def prepare_inventory_for_request(
        self,
        file: UploadFile
    ) -> list[dict]:

        validation_service.validate_file_extension(file)

        dataframe = self._normalise_columns(
            await excel_reader.read_excel(file)
        )

        validation_service.validate_empty_dataframe(
            dataframe
        )

        validation_service.validate_required_columns(
            dataframe,
            validation_service.INVENTORY_REQUIRED_COLUMNS
        )

        dataframe["server_id"] = (
            dataframe["server_id"].astype(str).str.strip()
        )

        dataframe["instance_type"] = (
            dataframe["instance_type"].astype(str).str.strip()
        )

        validation_service.validate_duplicates(
            dataframe,
            "server_id"
        )

        validation_service.validate_null_values(dataframe)
        validation_service.validate_data_quality(dataframe)

        server_ids = dataframe["server_id"].tolist()

        existing = await inventory_repository.get_existing_server_ids(
            server_ids
        )

        if existing:
            raise HTTPException(
                status_code=409,
                detail=(
                    "These server IDs already exist: "
                    + ", ".join(map(str, existing[:25]))
                )
            )

        return self._native_records(dataframe)

    # --------------------------------------------------
    # ADMIN DIRECT INVENTORY UPLOAD
    # --------------------------------------------------

    async def upload_inventory(
        self,
        file: UploadFile
    ) -> UploadResponse:

        validation_service.validate_file_extension(file)

        dataframe = self._normalise_columns(
            await excel_reader.read_excel(file)
        )

        validation_service.validate_empty_dataframe(
            dataframe
        )

        validation_service.validate_required_columns(
            dataframe,
            validation_service.INVENTORY_REQUIRED_COLUMNS
        )

        dataframe["server_id"] = (
            dataframe["server_id"].astype(str).str.strip()
        )

        dataframe["instance_type"] = (
            dataframe["instance_type"].astype(str).str.strip()
        )

        validation_service.validate_duplicates(
            dataframe,
            "server_id"
        )

        validation_service.validate_null_values(dataframe)
        validation_service.validate_data_quality(dataframe)

        server_ids = dataframe["server_id"].tolist()

        existing = await inventory_repository.get_existing_server_ids(
            server_ids
        )

        if existing:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Server IDs already exist: "
                    + ", ".join(map(str, existing[:25]))
                )
            )

        records = self._native_records(dataframe)

        inserted = await inventory_repository.insert_inventory(
            records
        )

        return UploadResponse(
            status=True,
            message="Inventory uploaded successfully.",
            filename=file.filename or "server_inventory.xlsx",
            uploaded_records=inserted
        )

    # --------------------------------------------------
    # ADMIN GOLDEN CONFIGURATION EXCEL UPLOAD
    # --------------------------------------------------

    async def upload_golden_configuration(
        self,
        file: UploadFile
    ) -> GoldenUploadResponse:

        validation_service.validate_file_extension(file)

        dataframe = self._normalise_columns(
            await excel_reader.read_excel(file)
        )

        validation_service.validate_empty_dataframe(
            dataframe
        )

        validation_service.validate_required_columns(
            dataframe,
            validation_service.GOLDEN_REQUIRED_COLUMNS
        )

        dataframe["instance_type"] = (
            dataframe["instance_type"].astype(str).str.strip()
        )

        if dataframe["instance_type"].str.casefold().duplicated().any():
            raise HTTPException(
                status_code=400,
                detail=(
                    "The workbook contains duplicate instance_type "
                    "values (case-insensitive)."
                )
            )

        validation_service.validate_null_values(dataframe)
        validation_service.validate_data_quality(dataframe)

        invalid_ranges = dataframe[
            (
                dataframe["target_cpu_utilization_min"]
                > dataframe["target_cpu_utilization_max"]
            )
            |
            (
                dataframe["target_memory_utilization_min"]
                > dataframe["target_memory_utilization_max"]
            )
        ]

        if not invalid_ranges.empty:

            bad_types = (
                invalid_ranges["instance_type"].astype(str).tolist()
            )

            raise HTTPException(
                status_code=400,
                detail=(
                    "Minimum utilization cannot exceed maximum "
                    "utilization for: "
                    + ", ".join(bad_types)
                )
            )

        dataframe = dataframe.rename(
            columns={
                "security_baseline": "required_security_baseline",
                "cost_per_hour": "demand_cost_per_hour",
                "monthly_cost": "estimated_monthly_cost"
            }
        )

        records = self._native_records(dataframe)

        now = datetime.now(timezone.utc)

        for record in records:
            record["source"] = "admin_excel_upload"
            record["updated_at"] = now

        try:
            processed = (
                await golden_repository.upsert_golden_configurations(
                    records
                )
            )

        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail=str(exc)
            ) from exc

        return GoldenUploadResponse(
            status=True,
            message=(
                f"{processed} Golden Configuration baseline(s) imported. "
                "Existing instance types were updated and new types were inserted."
            ),
            filename=file.filename or "golden_configuration.xlsx",
            uploaded_records=processed
        )


upload_service = UploadService()