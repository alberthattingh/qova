# Firebase Functions Standards

- Functions must be thin entry points.
- Business logic belongs in services.
- Validate authentication and authorization before performing writes.
- Never trust user IDs supplied by the client when the authenticated user ID can be derived from auth context.
- Scheduled processes must be idempotent.
- Firestore batch/transaction operations should be used where atomicity is required.
- Use constants for function names and collection names.
