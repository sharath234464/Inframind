from langchain_openai import ChatOpenAI

from app.core.config import settings


class RemediationAIService:
    """
    AI layer for explaining deterministic remediation plans.

    The AI does NOT decide the classification or resource changes.
    It only provides:
    - reasoning
    - expected impact
    - risk explanation
    - human-readable recommendation
    """

    def __init__(self):
        self.llm = ChatOpenAI(
            model=settings.MODEL_NAME,
            temperature=settings.TEMPERATURE,
            api_key=settings.OPENAI_API_KEY
        )

    async def generate_reasoning(
        self,
        server_id: str,
        issue_type: str,
        action: str,
        changes: dict,
        reason: str,
        expected_impact: str,
        risk_level: str
    ) -> dict:

        prompt = f"""
You are an Enterprise Infrastructure AI Assistant.

Analyze the following remediation plan.

IMPORTANT:
- Do NOT invent infrastructure values.
- Do NOT change the proposed resource values.
- Do NOT override the deterministic remediation decision.
- Explain the remediation clearly for an infrastructure engineer.
- Focus only on the information provided.

Server ID:
{server_id}

Issue Type:
{issue_type}

Proposed Action:
{action}

Proposed Changes:
{changes}

Deterministic Reason:
{reason}

Expected Impact:
{expected_impact}

Risk Level:
{risk_level}

Return your response in exactly this format:

REASONING:
<Explain why this remediation makes sense based on the provided issue and changes.>

EXPECTED_IMPACT:
<Explain the expected operational impact.>

RISK_EXPLANATION:
<Explain the risks or considerations an engineer should review before execution.>

RECOMMENDATION:
<Give a concise engineer-facing recommendation.>
"""

        try:
            response = await self.llm.ainvoke(prompt)

            content = response.content

            return self._parse_response(content)

        except Exception as exc:
            return {
                "reasoning": (
                    "AI reasoning could not be generated. "
                    "The deterministic remediation plan remains available."
                ),
                "expected_impact": expected_impact,
                "risk_explanation": (
                    f"Review the proposed infrastructure change manually. "
                    f"AI service error: {str(exc)}"
                ),
                "recommendation": (
                    "Review the remediation plan and approve it only "
                    "after validating the infrastructure impact."
                )
            }

    def _parse_response(self, content: str) -> dict:
        """
        Convert the structured LLM response into a dictionary.
        """

        result = {
            "reasoning": "",
            "expected_impact": "",
            "risk_explanation": "",
            "recommendation": ""
        }

        sections = {
            "REASONING:": "reasoning",
            "EXPECTED_IMPACT:": "expected_impact",
            "RISK_EXPLANATION:": "risk_explanation",
            "RECOMMENDATION:": "recommendation"
        }

        current_key = None

        for line in content.splitlines():

            stripped_line = line.strip()

            if stripped_line in sections:
                current_key = sections[stripped_line]
                continue

            if current_key:
                if result[current_key]:
                    result[current_key] += "\n"

                result[current_key] += line.strip()

        return result


remediation_ai_service = RemediationAIService()