from app.repository.dashboard_repository import dashboard_repository

from app.schemas.dashboard_schema import DashboardResponse


class DashboardService:

    async def get_dashboard(self) -> DashboardResponse:

        total_servers = await dashboard_repository.get_total_servers()

        properly_allocated = await dashboard_repository.get_properly_allocated()

        under_allocated = await dashboard_repository.get_under_allocated()

        over_allocated = await dashboard_repository.get_over_allocated()

        properly_utilized = await dashboard_repository.get_properly_utilized()

        under_utilized = await dashboard_repository.get_under_utilized()

        over_utilized = await dashboard_repository.get_over_utilized()

        compliant = await dashboard_repository.get_compliant()

        needs_review = await dashboard_repository.get_needs_review()

        return DashboardResponse(

            status=True,

            message="Dashboard loaded successfully.",

            total_servers=total_servers,

            properly_allocated=properly_allocated,

            under_allocated=under_allocated,

            over_allocated=over_allocated,

            properly_utilized=properly_utilized,

            under_utilized=under_utilized,

            over_utilized=over_utilized,

            compliant=compliant,

            needs_review=needs_review
        )


dashboard_service = DashboardService()