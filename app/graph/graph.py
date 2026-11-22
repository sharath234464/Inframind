from langgraph.graph import StateGraph, START, END

from app.graph.state import GraphState

from app.graph.nodes import (
    load_analysis_node,
    classification_node,
    compliance_node,
    alert_node,
    health_score_node,
    recommendation_node,
    save_node
)


# ============================================================
# CREATE WORKFLOW
# ============================================================

workflow = StateGraph(GraphState)


# ============================================================
# REGISTER NODES
# ============================================================

workflow.add_node(
    "load_analysis",
    load_analysis_node
)

workflow.add_node(
    "classification",
    classification_node
)

workflow.add_node(
    "compliance",
    compliance_node
)

workflow.add_node(
    "alerts",
    alert_node
)

workflow.add_node(
    "health_score",
    health_score_node
)

workflow.add_node(
    "recommendation",
    recommendation_node
)

workflow.add_node(
    "save",
    save_node
)


# ============================================================
# WORKFLOW EDGES
# ============================================================

workflow.add_edge(
    START,
    "load_analysis"
)

workflow.add_edge(
    "load_analysis",
    "classification"
)

workflow.add_edge(
    "classification",
    "compliance"
)

workflow.add_edge(
    "compliance",
    "alerts"
)

workflow.add_edge(
    "alerts",
    "health_score"
)

workflow.add_edge(
    "health_score",
    "recommendation"
)

workflow.add_edge(
    "recommendation",
    "save"
)

workflow.add_edge(
    "save",
    END
)


# ============================================================
# COMPILE GRAPH
# ============================================================

graph = workflow.compile()