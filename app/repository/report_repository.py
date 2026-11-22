from app.db_handler.mongodb import database


class ReportRepository:

    def __init__(self):
        self.collection = database["analysis_results"]

    async def get_total_servers(self):
        return await self.collection.count_documents({})

    async def get_properly_allocated(self):
        return await self.collection.count_documents({
            "allocation_status": "Properly Allocated"
        })

    async def get_under_allocated(self):
        return await self.collection.count_documents({
            "allocation_status": "Under Allocated"
        })

    async def get_over_allocated(self):
        return await self.collection.count_documents({
            "allocation_status": "Over Allocated"
        })

    async def get_properly_utilized(self):
        return await self.collection.count_documents({
            "utilization_status": "Properly Utilized"
        })

    async def get_under_utilized(self):
        return await self.collection.count_documents({
            "utilization_status": "Under Utilized"
        })

    async def get_over_utilized(self):
        return await self.collection.count_documents({
            "utilization_status": "Over Utilized"
        })

    async def get_compliant(self):
        return await self.collection.count_documents({
            "classification": "Compliant"
        })

    async def get_needs_review(self):
        return await self.collection.count_documents({
            "classification": {
                "$exists": True,
                "$ne": "Compliant"
            }
        })


report_repository = ReportRepository()