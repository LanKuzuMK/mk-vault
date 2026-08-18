# Visitor and Administrator Access Verification

The public `/` route was opened without an authenticated browser session. It rendered the selected-project collection, catalog count, and public empty state without redirecting to sign-in. The page exposed only a link to the administrator route; no local archive controls, R2 controls, or project-management operations were visible.

The administrator `/admin` route is separately protected in the client interface and server procedures. Archive publication and R2 operations use the `adminProcedure` role guard, which was verified by unit tests to reject signed-in non-administrators before storage access.
