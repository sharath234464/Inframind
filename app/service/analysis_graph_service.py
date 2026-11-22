import asyncio

from app.graph.graph import graph
from app.repository.analysis_repository import analysis_repository
from app.repository.recommendation_repository import recommendation_repository


class AnalysisGraphService:
    async def generate_ai_analysis(self, force: bool = False):
        analysis_results = await analysis_repository.get_all_analysis_results()
        if not analysis_results:
            return {
                "status": False,
                "message": "No comparison results found. Run infrastructure comparison first.",
                "completed": 0,
                "skipped": 0,
                "failed": 0,
            }

        required = (
            "actual_vcpu", "actual_memory", "actual_disk", "cpu_utilization",
            "memory_utilization", "disk_utilization", "golden_vcpu", "golden_memory",
            "golden_disk", "target_cpu_utilization_min", "target_cpu_utilization_max",
            "target_memory_utilization_min", "target_memory_utilization_max",
        )

        eligible = []
        skipped = 0
        failed = 0
        for analysis in analysis_results:
            if not analysis.get("server_id"):
                failed += 1
                continue
            if analysis.get("recommendation") and not force:
                skipped += 1
                continue
            missing = [key for key in required if analysis.get(key) is None]
            if missing:
                failed += 1
                continue
            eligible.append(analysis)

        semaphore = asyncio.Semaphore(4)

        async def run_one(analysis):
            server_id = analysis["server_id"]
            state = {
                "server": {
                    "server_id": server_id,
                    "vcpu": analysis["actual_vcpu"],
                    "memory": analysis["actual_memory"],
                    "disk": analysis["actual_disk"],
                    "cpu_utilization": analysis["cpu_utilization"],
                    "memory_utilization": analysis["memory_utilization"],
                    "disk_utilization": analysis["disk_utilization"],
                },
                "golden_server": {
                    "vcpu": analysis["golden_vcpu"],
                    "memory": analysis["golden_memory"],
                    "disk": analysis["golden_disk"],
                    "target_cpu_utilization_min": analysis["target_cpu_utilization_min"],
                    "target_cpu_utilization_max": analysis["target_cpu_utilization_max"],
                    "target_memory_utilization_min": analysis["target_memory_utilization_min"],
                    "target_memory_utilization_max": analysis["target_memory_utilization_max"],
                },
                "allocation_status": analysis.get("allocation_status", ""),
                "utilization_status": analysis.get("utilization_status", ""),
                "classification": analysis.get("classification", ""),
                "compliance_status": analysis.get("compliance_status", ""),
                "alerts": [],
                "health_score": 100.0,
                "risk_level": "LOW",
                "risk_factors": [],
                "health_recommendation": "",
                "recommendation": "",
            }
            async with semaphore:
                try:
                    await graph.ainvoke(state)
                    return True, server_id, None
                except Exception as exc:
                    print(f"AI analysis failed for {server_id}: {exc}")
                    return False, server_id, str(exc)

        outcomes = await asyncio.gather(*(run_one(item) for item in eligible))
        completed = sum(1 for ok, _, _ in outcomes if ok)
        failed += sum(1 for ok, _, _ in outcomes if not ok)

        # The graph persists its recommendation on analysis_results. The UI reads
        # the dedicated recommendations collection, so keep that view synchronized.
        saved_results = await analysis_repository.get_all_analysis_results()
        recommendation_docs = []
        for item in saved_results:
            recommendation = item.get("recommendation")
            if not recommendation:
                continue
            recommendation_docs.append({
                "server_id": item.get("server_id"),
                "classification": item.get("classification"),
                "recommendation": recommendation,
                "reason": item.get("health_recommendation"),
                "priority": item.get("risk_level", "MEDIUM"),
                "severity": item.get("risk_level", "MEDIUM"),
                "status": "OPEN",
            })
        if recommendation_docs:
            await recommendation_repository.replace_recommendations(recommendation_docs)

        return {
            "status": failed == 0,
            "message": "AI workflow completed. Review completed/failed/skipped counts.",
            "total": len(analysis_results),
            "completed": completed,
            "skipped": skipped,
            "failed": failed,
            "recommendations_saved": len(recommendation_docs),
        }


analysis_graph_service = AnalysisGraphService()
