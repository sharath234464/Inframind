# User Requests and Admin Approval Workflow

## Role behavior

- `USER` sees only their own requests at `/user/requests` (`GET /requests/mine`).
- `ADMIN` sees all requests at `/admin/requests` (`GET /requests/admin`) and can approve/reject pending items.
- The backend enforces role checks; hiding a button in React is not the security boundary.

## Inventory upload

1. A user opens **Servers → Submit Inventory for Approval** and selects `.xlsx`/`.xls`.
2. `POST /requests/inventory-upload` validates the spreadsheet and checks duplicate IDs but does not insert into `server_inventory`.
3. A pending `INVENTORY_UPLOAD` request is written to `infrastructure_requests`.
4. Admin approves/rejects it in **Requests & Approvals**.
5. Approval re-checks duplicates and inserts records. Rejection does not write inventory. An execution failure is marked `FAILED` and shown as an error.

Admins may continue using the direct admin-only inventory upload flow when they are explicitly performing the upload themselves.

## AI Assistant actions

A regular user can submit clearly phrased requests such as:

- `Add server` followed by the required labeled fields shown by the assistant.
- `Update server SRV-1001 memory to 32 GB`.
- `Delete server SRV-1001`.
- `Generate Golden Configuration from inventory for General Purpose`.

The assistant creates a `PENDING` request in `infrastructure_requests`. It does not directly mutate server inventory. Admin approval executes the validated request. For Golden Configuration generation, approval generates a proposal from healthy inventory and activates it through the existing proposal approval service.

If the assistant cannot identify a required target or field, it asks for the missing details instead of claiming that a request was created.

## Test sequence

1. Sign in as USER and upload a valid inventory spreadsheet. Confirm the UI reports submission for approval, not insertion.
2. Confirm a `PENDING` `INVENTORY_UPLOAD` document exists in `infrastructure_requests`; confirm its server IDs are not yet in `server_inventory`.
3. Sign in as ADMIN and open **Requests & Approvals**. Approve the request and confirm records are inserted, and the request becomes `COMPLETED`.
4. Submit another test inventory request and reject it. Confirm the server IDs remain absent from `server_inventory` and the request is `REJECTED`.
5. As USER, ask the assistant to update/delete a test server. Confirm it creates a pending request and the server remains unchanged until approval.
6. After inventory is approved, ask the assistant to generate a Golden Configuration for an instance type present in healthy inventory. Approve the request as ADMIN and verify the baseline in `golden_configuration`.
7. Confirm USER sees only their own requests and ADMIN sees all requests.

Do not test destructive requests against important existing production-like records. Use disposable test server IDs.
