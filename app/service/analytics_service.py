from app.repository.analytics_repository import (
    AnalyticsRepository
)


class AnalyticsService:

    def __init__(self):

        self.repository = AnalyticsRepository()

    @staticmethod
    def _number(
        value,
        default=0.0
    ):

        try:
            return float(value)
        except (
            TypeError,
            ValueError
        ):
            return default

    async def get_summary(self):

        records = (
            await self.repository.get_all_records()
        )

        if not records:

            return {
                "total_records": 0,
                "average_cpu_utilization": 0,
                "average_memory_utilization": 0,
                "average_disk_utilization": 0,
                "classifications": []
            }

        cpu_values = []
        memory_values = []
        disk_values = []

        for record in records:

            cpu_values.append(
                self._number(
                    record.get(
                        "cpu_utilization"
                    )
                )
            )

            memory_values.append(
                self._number(
                    record.get(
                        "memory_utilization"
                    )
                )
            )

            disk_values.append(
                self._number(
                    record.get(
                        "disk_utilization"
                    )
                )
            )

        classifications = (
            await self.repository
            .get_classification_counts()
        )

        classification_data = []

        for item in classifications:

            classification_data.append(
                {
                    "classification": (
                        item.get("_id")
                        or "UNKNOWN"
                    ),
                    "count": item.get(
                        "count",
                        0
                    )
                }
            )

        return {
            "total_records": len(records),

            "average_cpu_utilization": round(
                sum(cpu_values) /
                len(cpu_values),
                2
            ),

            "average_memory_utilization": round(
                sum(memory_values) /
                len(memory_values),
                2
            ),

            "average_disk_utilization": round(
                sum(disk_values) /
                len(disk_values),
                2
            ),

            "classifications":
                classification_data
        }

    async def get_server_analytics(
        self,
        server_id: str
    ):

        records = (
            await self.repository
            .get_server_records(
                server_id
            )
        )

        if not records:

            return None

        cpu_values = [
            self._number(
                record.get(
                    "cpu_utilization"
                )
            )
            for record in records
        ]

        memory_values = [
            self._number(
                record.get(
                    "memory_utilization"
                )
            )
            for record in records
        ]

        disk_values = [
            self._number(
                record.get(
                    "disk_utilization"
                )
            )
            for record in records
        ]

        trend = []

        for record in records:

            trend.append(
                {
                    "timestamp":
                        record.get(
                            "created_at"
                        ),

                    "cpu_utilization":
                        self._number(
                            record.get(
                                "cpu_utilization"
                            )
                        ),

                    "memory_utilization":
                        self._number(
                            record.get(
                                "memory_utilization"
                            )
                        ),

                    "disk_utilization":
                        self._number(
                            record.get(
                                "disk_utilization"
                            )
                        )
                }
            )

        return {
            "server_id": server_id,

            "total_records": len(
                records
            ),

            "average_cpu_utilization":
                round(
                    sum(cpu_values) /
                    len(cpu_values),
                    2
                ),

            "average_memory_utilization":
                round(
                    sum(memory_values) /
                    len(memory_values),
                    2
                ),

            "average_disk_utilization":
                round(
                    sum(disk_values) /
                    len(disk_values),
                    2
                ),

            "trend": trend
        }


analytics_service = AnalyticsService()