from app.repository.report_repository import report_repository

from app.schemas.report_schema import ReportResponse


class ReportService:

    async def generate_report(
        self
    ) -> ReportResponse:

        total_servers = await report_repository.get_total_servers()

        properly_allocated = await report_repository.get_properly_allocated()

        under_allocated = await report_repository.get_under_allocated()

        over_allocated = await report_repository.get_over_allocated()

        properly_utilized = await report_repository.get_properly_utilized()

        under_utilized = await report_repository.get_under_utilized()

        over_utilized = await report_repository.get_over_utilized()

        compliant = await report_repository.get_compliant()

        needs_review = await report_repository.get_needs_review()

        return ReportResponse(

            status=True,

            message="Report generated successfully.",

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


report_service = ReportService()