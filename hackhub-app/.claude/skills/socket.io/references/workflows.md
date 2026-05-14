# Socket.io Workflows

## When to use
Follow these workflows when building a new real-time feature end-to-end or debugging an existing one.

## Workflows

**Adding a new real-time event**
1. Define a typed payload interface in `src/types/`
2. Add the handler in `src/services/realtimeService.ts` or a scoped hook
3. Register the listener in a `useEffect` with full cleanup
4. Emit from the component or service layer — never from Zustand store actions
5. Use the `resource:id:action` naming pattern (e.g., `idea:abc123:vote`)

**Debugging a missing event**
1. Confirm the socket is connected: `isConnected` from `useRealtime()`
2. Check that `join:room` was emitted before the listener was registered
3. Verify the event name matches exactly between emitter and listener (namespacing typos are common)
4. Look for missing cleanup causing stale listeners on the previous render cycle

**Integrating chat into a new page**
1. Wrap the page in (or confirm it sits under) `RealtimeContext`
2. Call `useRealtime()` to get the socket
3. Emit `join:team` on mount, `leave:team` on unmount
4. Consume `TeamChat` component or replicate its listener pattern for custom UI

## Pitfalls

- Adding socket logic in Zustand store actions breaks the single-connection contract — keep all socket calls in components or services
- Registering listeners outside a `useEffect` (e.g., at module level) prevents cleanup and causes handlers to stack up across navigations