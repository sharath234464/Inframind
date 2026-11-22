from app.service.audit_service import audit_service


async def log_audit(
    user_id: str,
    action: str,
    entity_type: str,
    entity_id: str,
    description: str,
    status: str = "SUCCESS"
):
    """
    Central helper for recording important system actions.
    """

    try:
        await audit_service.create_audit_log(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            status=status
        )

    except Exception:
        # Audit failure should not break the main business operation.
        pass