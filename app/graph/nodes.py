from app.graph.state import GraphState

from app.service.recommendation_ai_service import (
    recommendation_ai_service
)

from app.repository.analysis_repository import (
    analysis_repository
)

from app.graph.classification_helper import (
    classification_helper
)

from app.service.health_score_service import (
    health_score_service
)

from app.service.policy_engine import (
    policy_engine
)

from app.service.alert_service import (
    alert_service
)


# ============================================================
# LOAD ANALYSIS
# ============================================================

def load_analysis_node(state: GraphState):

    server = state["server"]

    print(
        f"Loading Server: {server['server_id']}"
    )

    return state


# ============================================================
# CLASSIFICATION
# ============================================================

def classification_node(state: GraphState):

    server = state["server"]

    golden = state["golden_server"]

    # --------------------------------------------------------
    # Allocation status
    # --------------------------------------------------------

    allocation = (
        classification_helper.get_allocation_status(
            server,
            golden
        )
    )

    # --------------------------------------------------------
    # Utilization status
    # --------------------------------------------------------

    utilization = (
        classification_helper.get_utilization_status(
            server,
            golden
        )
    )

    # --------------------------------------------------------
    # Final 9-state classification
    # --------------------------------------------------------

    classification = (
        classification_helper.get_classification(
            allocation,
            utilization
        )
    )

    state["allocation_status"] = allocation

    state["utilization_status"] = utilization

    state["classification"] = classification

    return state


# ============================================================
# COMPLIANCE
# ============================================================

def compliance_node(state: GraphState):

    if state["classification"] == "Compliant":

        state["compliance_status"] = "Compliant"

    else:

        state["compliance_status"] = "Non-Compliant"

    return state


# ============================================================
# SMART ALERT / POLICY ENGINE
# ============================================================

async def alert_node(state: GraphState):

    server = dict(
        state["server"]
    )

    # Add classification information
    server["classification"] = (
        state.get(
            "classification",
            ""
        )
    )

    # Add compliance information
    server["compliance_status"] = (
        state.get(
            "compliance_status",
            ""
        )
    )

    # --------------------------------------------------------
    # Evaluate deterministic policies
    # --------------------------------------------------------

    alerts = policy_engine.evaluate_server(
        server
    )

    created_alerts = []

    # --------------------------------------------------------
    # Create alerts in MongoDB
    # --------------------------------------------------------

    for alert in alerts:

        created_alert = (
            await alert_service.create_alert(
                server_id=alert["server_id"],
                alert_type=alert["alert_type"],
                severity=alert["severity"],
                title=alert["title"],
                message=alert["message"],
                recommendation=alert.get(
                    "recommendation"
                )
            )
        )

        created_alerts.append(
            created_alert
        )

    state["alerts"] = created_alerts

    return state


# ============================================================
# HEALTH SCORE
# ============================================================

async def health_score_node(state: GraphState):

    server = dict(
        state["server"]
    )

    # Add classification
    server["classification"] = (
        state.get(
            "classification",
            ""
        )
    )

    # Add compliance status
    server["compliance_status"] = (
        state.get(
            "compliance_status",
            ""
        )
    )

    # --------------------------------------------------------
    # Calculate health score
    # --------------------------------------------------------

    health_result = (
        await health_score_service.calculate_and_save(
            server
        )
    )

    state["health_score"] = (
        health_result["health_score"]
    )

    state["risk_level"] = (
        health_result["risk_level"]
    )

    state["risk_factors"] = (
        health_result["risk_factors"]
    )

    state["health_recommendation"] = (
        health_result["recommendation"]
    )

    return state


# ============================================================
# AI RECOMMENDATION
# ============================================================

async def recommendation_node(
    state: GraphState
):

    recommendation = (
        await recommendation_ai_service.generate_recommendation(
            state
        )
    )

    state["recommendation"] = recommendation

    return state


# ============================================================
# SAVE ANALYSIS
# ============================================================

async def save_node(
    state: GraphState
):

    server = state["server"]

    await analysis_repository.update_analysis_result(

        server["server_id"],

        {
            "allocation_status": state.get(
                "allocation_status"
            ),

            "utilization_status": state.get(
                "utilization_status"
            ),

            "classification": state.get(
                "classification"
            ),

            "compliance_status": state.get(
                "compliance_status"
            ),

            "recommendation": state.get(
                "recommendation"
            ),

            "health_score": state.get(
                "health_score"
            ),

            "risk_level": state.get(
                "risk_level"
            ),

            "risk_factors": state.get(
                "risk_factors",
                []
            ),

            "health_recommendation": state.get(
                "health_recommendation"
            ),

            "alert_count": len(
                state.get(
                    "alerts",
                    []
                )
            )
        }

    )

    return state