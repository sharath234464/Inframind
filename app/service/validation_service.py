import pandas as pd

from fastapi import HTTPException, UploadFile


class ValidationService:

    ALLOWED_EXTENSIONS = (".xlsx", ".xls")

    INVENTORY_REQUIRED_COLUMNS = [
        "server_id",
        "server_name",
        "environment",
        "region",
        "instance_type",
        "vcpu",
        "memory",
        "disk",
        "os",
        "patch_level",
        "cpu_utilization",
        "memory_utilization",
        "disk_utilization"
    ]

    GOLDEN_REQUIRED_COLUMNS = [
        "instance_type",
        "vcpu",
        "memory",
        "disk",
        "os",
        "patch_level",
        "target_cpu_utilization_min",
        "target_cpu_utilization_max",
        "target_memory_utilization_min",
        "target_memory_utilization_max",
        "security_baseline",
        "cost_per_hour",
        "monthly_cost"
    ]

    VALID_ENVIRONMENTS = [
        "Production",
        "Staging",
        "QA",
        "Development"
    ]

    def validate_file_extension(
        self,
        file: UploadFile
    ):

        if not file.filename.lower().endswith(self.ALLOWED_EXTENSIONS):
            raise HTTPException(
                status_code=400,
                detail="Only Excel files (.xlsx, .xls) are allowed."
            )

    def validate_empty_dataframe(
        self,
        dataframe: pd.DataFrame
    ):

        if dataframe.empty:
            raise HTTPException(
                status_code=400,
                detail="Uploaded Excel file is empty."
            )

    def validate_required_columns(
        self,
        dataframe: pd.DataFrame,
        required_columns: list[str]
    ):

        dataframe.columns = (
            dataframe.columns
            .astype(str)
            .str.strip()
            .str.lower()
        )

        required_columns = [
            column.strip().lower()
            for column in required_columns
        ]

        missing_columns = [
            column
            for column in required_columns
            if column not in dataframe.columns
        ]

        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )

    def validate_duplicates(
        self,
        dataframe: pd.DataFrame,
        column_name: str
    ):

        if dataframe[column_name].duplicated().any():
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate {column_name} values found."
            )

    def validate_null_values(
        self,
        dataframe: pd.DataFrame
    ):

        if dataframe.isnull().values.any():
            raise HTTPException(
                status_code=400,
                detail="Excel contains null or empty values."
            )

    def validate_data_quality(
        self,
        dataframe: pd.DataFrame
    ):

        numeric_columns = [
            "vcpu",
            "memory",
            "disk",
            "cpu_utilization",
            "memory_utilization",
            "disk_utilization",
            "target_cpu_utilization_min",
            "target_cpu_utilization_max",
            "target_memory_utilization_min",
            "target_memory_utilization_max",
            "cost_per_hour",
            "monthly_cost"
        ]

        for column in numeric_columns:

            if column not in dataframe.columns:
                continue

            dataframe[column] = pd.to_numeric(
                dataframe[column],
                errors="coerce"
            )

            if dataframe[column].isnull().any():
                raise HTTPException(
                    status_code=400,
                    detail=f"{column} must contain numeric values."
                )

        positive_columns = [
            "vcpu",
            "memory",
            "disk",
            "cost_per_hour",
            "monthly_cost"
        ]

        for column in positive_columns:

            if column not in dataframe.columns:
                continue

            if (dataframe[column] <= 0).any():
                raise HTTPException(
                    status_code=400,
                    detail=f"{column} must be greater than 0."
                )

        utilization_columns = [
            "cpu_utilization",
            "memory_utilization",
            "disk_utilization",
            "target_cpu_utilization_min",
            "target_cpu_utilization_max",
            "target_memory_utilization_min",
            "target_memory_utilization_max"
        ]

        for column in utilization_columns:

            if column not in dataframe.columns:
                continue

            if (
                (dataframe[column] < 0)
                | (dataframe[column] > 100)
            ).any():
                raise HTTPException(
                    status_code=400,
                    detail=f"{column} must be between 0 and 100."
                )

        if "environment" in dataframe.columns:

            invalid_environment = dataframe[
                ~dataframe["environment"].isin(
                    self.VALID_ENVIRONMENTS
                )
            ]

            if not invalid_environment.empty:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid environment values found."
                )


validation_service = ValidationService()