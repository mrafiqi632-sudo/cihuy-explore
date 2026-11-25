# Security Specification — cihuy explore (RBAC & Firestore)

## 1. Data Invariants
1. Every user document at `/users/{userId}` belongs strictly to `request.auth.uid == userId`; unprivileged registration may only create `role: "user"` (only the verified bootstrapped admin `mrafiqi632@gmail.com` may initialize with `role: "admin"`).
2. Role updates on `/users/{userId}` are permitted strictly to `isAdmin()`; non-admin users cannot escalate `role` or alter `uid`, `email`, or `createdAt`.
3. Personal favorites (`/users/{userId}/favorites/{favId}`) and personal trips (`/user_trips/{userId}`) require verified auth and strict ownership (`request.auth.uid == userId`).
4. Catalog collections (`catalog_destinations`, `catalog_foods`, `catalog_stays`) allow verified users to read published entries, `operator` + `admin` staff to create and update entries, and `admin` exclusively to delete entries.
5. Package templates (`catalog_packages`) allow `admin` exclusively to create, update, and delete entries.

## 2. Adversarial Payloads Checked Against Rules
1. Unauthenticated `get`/`list` on `/users/{uid}` -> rejected by `isVerifiedUser()`.
2. Self-assignment of `role: "admin"` or `role: "operator"` during `/users/{uid}` create -> rejected by `incoming().role == 'user'`.
3. Owner updating own `role` field on `/users/{uid}` -> rejected by `incoming().role == existing().role && affectedKeys().hasOnly(['displayName', 'updatedAt'])`.
4. Regular `user` creating or updating `/catalog_destinations/{id}` -> rejected by `isStaff()`.
5. `operator` deleting `/catalog_destinations/{id}` or `/catalog_foods/{id}` -> rejected by `isAdmin()`.
6. `operator` creating or updating `/catalog_packages/{id}` -> rejected by `isAdmin()`.
7. Injecting extra shadow fields (`isAdmin: true`) into any document -> rejected by `data.keys().hasOnly([...])`.
8. Oversized path ID (`> 128` chars or special characters) -> rejected by `isValidId()`.
9. Client-spoofed `createdAt`/`updatedAt` timestamp -> rejected by `== request.time`.
10. Cross-user access to `/users/{otherUid}/favorites/{id}` or `/user_trips/{otherUid}` -> rejected by `isOwner(userId)`.
11. Unverified email spoofing (`email_verified == false`) -> rejected by `isVerifiedUser()`.
12. `list` query attempting to read unpublished or cross-user docs -> rejected by `resource.data` filters.
