RECOMMENDATION_PROMPT = """
You are an Enterprise Infrastructure Optimization Expert.

Analyze the following server.

Server ID:
{server_id}

Allocation Status:
{allocation_status}

Utilization Status:
{utilization_status}

Classification:
{classification}

Actual Configuration

CPU:
{actual_vcpu}

Memory:
{actual_memory}

Disk:
{actual_disk}

Golden Configuration

CPU:
{golden_vcpu}

Memory:
{golden_memory}

Disk:
{golden_disk}

Generate ONLY TWO sections.

1. Recommendation
Provide a complete recommendation explaining exactly what configuration changes should be made.

2. Justification
Explain why these changes are required, the business impact, expected benefits, operational improvements, cost optimization, performance improvements, and future scalability.

Return only plain text.
"""