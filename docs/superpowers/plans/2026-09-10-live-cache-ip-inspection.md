# Live cache and IP inspection plan

## Objective

Keep the existing Dashboard, Inbox, Analytics, and History data boundaries while adding a five-minute server cache/revalidation policy, a manual refresh that invalidates the relevant cache tags, and an IP-intelligence action that opens the existing Inbox inspection sheet.

## Contract and boundaries

- `tmpvault` remains the Inbox source; SecureMail remains the Dashboard/Analytics/History source.
- Cache upstream JSON on the server for 300 seconds with explicit tags. The browser never receives `SECUREMAILSCOPE_API_KEY`.
- Manual refresh invalidates the SecureMail and Inbox tags, then refreshes the current route.
- Background refresh runs once per open tab every five minutes and re-renders only the current API-backed route. The server cache decides whether the upstream response is reused or revalidated.
- No upstream change-feed or ETag contract is assumed. No fake Spamhaus/IPQualityScore lookup is added.
- Capture queue deletion remains local-only because the ML backend has no delete contract.

## IP detail contract

- Extend the safe Inbox network projection with the upstream IP address, Spamhaus listing state, IP quality/fraud score, level/source, selected IPInfo fields, and bounded issue text.
- Extend TLS projection with the upstream version status and bounded warnings so deprecated/current status remains explicit.
- Missing upstream values render as `Not supplied`/`Not observed`; raw body, HTML, and unbounded payloads remain withheld.
- Replace the History `Rule triggers` column with an `IP` link using the analysis request ID. It navigates to `/inbox?requestId=...`; Inbox resolves the matching item and opens its existing native inspection sheet. No matching item means no fabricated detail.

## Acceptance checks

1. Dashboard, Analytics, and History upstream calls use the 300-second cache policy; Inbox list/detail calls use the Inbox tag and the same TTL.
2. Manual refresh invalidates both tags and re-fetches the current route; the button exposes a busy state and errors remain observable.
3. The five-minute poll does not create duplicate intervals and updates Inbox client data through the existing proxy without a full page navigation.
4. History shows `IP`, and activating it opens the Inbox inspection sheet for the matching request ID.
5. The sheet shows IP reputation and TLS version status/warnings with explicit degraded states.
6. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and desktop/mobile browser checks pass without exposing secrets or raw message content.
