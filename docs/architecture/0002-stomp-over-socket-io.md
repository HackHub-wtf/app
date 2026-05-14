---
adr: "0002"
title: "STOMP/WebSocket over Socket.io for real-time features"
status: accepted
date: "2026-05-12"
deciders:
  - Engineering Lead
  - Backend Lead
---

# ADR-0002 — STOMP/WebSocket over Socket.io

## Context

The original frontend used two real-time transports simultaneously:
- **Socket.io** (via a separate server) for team chat and collaborative events
- **Supabase Realtime** for database change subscriptions

After ADR-0001 removed Supabase, Socket.io remained as a standalone real-time layer but had no corresponding server implementation — the Spring Boot API didn't run a Socket.io-compatible Node.js server.

## Decision

Use **Spring WebSocket + STOMP** (Streaming Text Oriented Messaging Protocol) for all real-time features. Spring Boot ships `spring-boot-starter-websocket` which provides a first-class STOMP broker relay. The frontend connects using `@stomp/stompjs` and `sockjs-client`.

## Topic routing

| Topic / Queue | Purpose |
|---|---|
| `/topic/team.{teamId}.chat` | Broadcast team chat messages |
| `/topic/hackathon.{id}.updates` | Hackathon-level status events |
| `/user/queue/notifications` | Per-user push notifications |

## Authentication

STOMP `CONNECT` frames are intercepted by `JwtChannelInterceptor` which validates the JWT from the `Authorization` header. Connections without a valid token are rejected before the handshake completes.

## Consequences

**Positive:**
- Single real-time transport, single server. No separate Socket.io process.
- STOMP topic routing is type-safe and explicit — no arbitrary event name strings.
- JWT validation happens at the WebSocket boundary, same as HTTP.
- SockJS fallback for environments that block WebSocket.

**Negative:**
- STOMP adds a framing layer. Pure WebSocket clients need the STOMP protocol.
- Horizontal scaling requires a message broker relay (e.g. RabbitMQ STOMP plugin). The current single-node deployment uses the in-memory broker.

## Status

Implemented. `WebSocketConfig.java` configures the broker; `TeamChatHandler.java` handles chat; `HackathonEventPublisher.java` publishes hackathon events.
