from fastapi import HTTPException

from app.db_handler.mongodb import database


class RequestExecutionService:

    def __init__(self):
        self.inventory_collection = database["server_inventory"]
        self.golden_collection = database["golden_configuration"]

    async def execute(
        self,
        request_data: dict
    ):

        request_type = request_data["request_type"]
        payload = request_data.get(
            "payload",
            {}
        )

        if request_type == "ADD_SERVER":

            return await self._add_server(
                payload
            )

        if request_type == "UPDATE_SERVER":

            return await self._update_server(
                request_data,
                payload
            )

        if request_type == "DELETE_SERVER":

            return await self._delete_server(
                request_data
            )

        if request_type == "RESOURCE_CHANGE":

            return await self._resource_change(
                request_data,
                payload
            )

        if request_type == "GOLDEN_CONFIG_CHANGE":
            return await self._golden_config_change(request_data, payload)

        if request_type == "INVENTORY_UPLOAD":
            return await self._inventory_upload(payload)

        if request_type == "GOLDEN_CONFIG_GENERATION":
            return await self._generate_and_approve_golden(request_data, payload)

        raise HTTPException(
            status_code=400,
            detail=f"Unsupported request type: {request_type}"
        )

    async def _inventory_upload(self, payload: dict):
        records = payload.get("records") or []
        if not records:
            raise HTTPException(status_code=400, detail="No inventory records were included in the request")
        server_ids = [str(row.get("server_id", "")).strip() for row in records]
        if any(not sid for sid in server_ids):
            raise HTTPException(status_code=400, detail="Every inventory row must include server_id")
        if len(server_ids) != len(set(server_ids)):
            raise HTTPException(status_code=409, detail="Duplicate server IDs exist inside the submitted file")
        existing = await self.inventory_collection.find(
            {"server_id": {"$in": server_ids}}, {"server_id": 1, "_id": 0}
        ).to_list(length=None)
        if existing:
            ids = [str(item.get("server_id")) for item in existing]
            raise HTTPException(status_code=409, detail=f"Server IDs already exist: {', '.join(ids)}")
        result = await self.inventory_collection.insert_many(records)
        return {"message": "Approved inventory uploaded", "uploaded_records": len(result.inserted_ids), "filename": payload.get("filename")}

    async def _generate_and_approve_golden(self, request_data: dict, payload: dict):
        from app.service.golden_generation_service import golden_generation_service
        instance_type = payload.get("instance_type")
        minimum = int(payload.get("minimum_healthy_servers", 1))
        approved_by = request_data.get("approved_by") or "admin"
        proposals = await golden_generation_service.generate(
            instance_type=instance_type,
            minimum_healthy_servers=minimum,
            created_by=request_data.get("requested_by", "user")
        )
        approved = []
        for proposal in proposals:
            if proposal.get("status") == "PENDING_APPROVAL":
                result = await golden_generation_service.approve_proposal(
                    proposal_id=proposal["proposal_id"], approved_by=approved_by
                )
                approved.append(result)
        if not approved:
            raise HTTPException(status_code=400, detail="No golden configuration proposals were generated for approval")
        return {"message": "Golden configuration generated from inventory and activated after admin approval", "instance_type": instance_type, "approved_configurations": len(approved), "proposals": approved}

    async def _add_server(
        self,
        payload: dict
    ):

        server_id = payload.get("server_id")

        if not server_id:
            raise HTTPException(
                status_code=400,
                detail="server_id is required"
            )

        allowed_fields = {
            "server_id", "server_name", "environment", "region", "instance_type",
            "vcpu", "memory", "disk", "os", "patch_level",
            "cpu_utilization", "memory_utilization", "disk_utilization"
        }
        unknown_fields = set(payload) - allowed_fields
        if unknown_fields:
            raise HTTPException(status_code=400, detail=f"Unsupported server fields: {', '.join(sorted(unknown_fields))}")
        required_fields = allowed_fields
        missing_fields = [field for field in required_fields if payload.get(field) in (None, "")]
        if missing_fields:
            raise HTTPException(status_code=400, detail=f"Missing required server fields: {', '.join(sorted(missing_fields))}")

        existing = await self.inventory_collection.find_one(
            {"server_id": server_id}
        )

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Server already exists"
            )

        await self.inventory_collection.insert_one(
            payload
        )

        return {
            "message": "Server added successfully",
            "server_id": server_id
        }

    async def _update_server(
        self,
        request_data: dict,
        payload: dict
    ):

        target_id = request_data.get(
            "target_id"
        )

        if not target_id:
            raise HTTPException(
                status_code=400,
                detail="target_id is required"
            )

        allowed_fields = {
            "server_name", "environment", "region", "instance_type", "vcpu",
            "memory", "disk", "os", "patch_level", "cpu_utilization",
            "memory_utilization", "disk_utilization"
        }
        updates = {key: value for key, value in payload.items() if key in allowed_fields}
        if not updates:
            raise HTTPException(status_code=400, detail="No valid server fields were provided for update")
        update_result = await self.inventory_collection.update_one(
            {"server_id": target_id},
            {"$set": updates}
        )

        if update_result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Server not found"
            )

        return {
            "message": "Server updated successfully",
            "server_id": target_id,
            "updated_fields": sorted(updates.keys())
        }

    async def _delete_server(
        self,
        request_data: dict
    ):

        target_id = request_data.get(
            "target_id"
        )

        if not target_id:
            raise HTTPException(
                status_code=400,
                detail="target_id is required"
            )

        result = await self.inventory_collection.delete_one(
            {"server_id": target_id}
        )

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Server not found"
            )

        return {
            "message": "Server deleted successfully",
            "server_id": target_id
        }

    async def _resource_change(
        self,
        request_data: dict,
        payload: dict
    ):

        target_id = request_data.get(
            "target_id"
        )

        if not target_id:
            raise HTTPException(
                status_code=400,
                detail="target_id is required"
            )

        allowed_fields = {
            "vcpu",
            "memory",
            "disk"
        }

        resource_update = {
            key: value
            for key, value in payload.items()
            if key in allowed_fields
        }

        if not resource_update:
            raise HTTPException(
                status_code=400,
                detail="No valid resource fields provided"
            )

        result = await self.inventory_collection.update_one(
            {"server_id": target_id},
            {"$set": resource_update}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Server not found"
            )

        return {
            "message": "Resource allocation updated successfully",
            "server_id": target_id,
            "updated_resources": resource_update
        }

    async def _golden_config_change(
        self,
        request_data: dict,
        payload: dict
    ):

        target_id = request_data.get(
            "target_id"
        )

        if not target_id:
            raise HTTPException(
                status_code=400,
                detail="instance_type is required"
            )

        result = await self.golden_collection.update_one(
            {"instance_type": target_id},
            {"$set": payload}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Golden configuration not found"
            )

        return {
            "message": "Golden Configuration updated successfully",
            "instance_type": target_id
        }