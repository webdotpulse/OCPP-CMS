# Proposed Improvements & Roadmap

The Open-Source OCPP 1.6 & 2.1/2.0.1 CMS provides a solid, barebone foundation for a Charge Point Management System. However, to scale for enterprise, highly-available production environments, several architectural and feature enhancements are recommended. This document outlines potential improvements for contributors or developers building on top of this repository.

## 1. Architectural Enhancements

### Containerization (Docker)
- **Goal:** Simplify deployment and ensure consistent environments across development, staging, and production.
- **Action:** Create `Dockerfile`s for both the Backend and Frontend, and a `docker-compose.yml` to orchestrate the Node.js apps, PostgreSQL database, and any future services.

### Caching and Message Brokering (Redis / RabbitMQ) - *Partially Implemented*
- **Current State:** Redis (`ioredis`) is now implemented for caching (charger configurations, active session data, rate limiting) and Pub/Sub message brokering (routing OCPP commands and logs across a horizontal Node.js cluster).
- **Goal:** Further optimize performance, handle extreme high concurrency.
- **Action:**
  - Potentially introduce **RabbitMQ** or Kafka for more robust message queueing and guaranteed delivery of critical OCPP messages under heavy load, moving beyond the current Redis Pub/Sub implementation.

### Horizontal Scaling & Load Balancing
- **Goal:** Ensure high availability.
- **Action:** Deploy the backend behind a load balancer (e.g., Nginx, AWS ALB). Update the OCPP WebSocket architecture to handle stateless connections, allowing multiple server instances to manage chargers simultaneously.

## 2. Testing & Quality Assurance

### Automated Testing
- **Backend:** Implement unit and integration tests using **Jest** and **Supertest** to cover REST API endpoints and OCPP message handlers.
- **Frontend:** Implement end-to-end (E2E) testing using **Playwright** or **Cypress** to ensure dashboard workflows (like creating a station or initiating a remote start) function correctly.

### CI/CD Pipelines
- **Goal:** Automate code linting, testing, and deployment.
- **Action:** Add GitHub Actions workflows to run Prisma checks, TypeScript compilation, Playwright E2E tests for the frontend, and Jest test suites for the backend on every pull request.

## 3. Advanced Features

### OCPI & OICP Roaming Integration - *Partially Implemented*
- **Current State:** Database schema support for `OcpiEndpoint` and `OicpEndpoint` is present, alongside functional API routes (`/api/ocpi`, `/api/oicp`) and a dedicated Admin Dashboard page (`/roaming`) to manage endpoint configurations.
- **Goal:** Fully enable EV roaming, allowing cross-network driver authentication and CDR reconciliation.
- **Action:** Finalize the business logic for real-time location data sharing, remote authorization, and automated CDR (Charge Detail Record) exchange.

### Smart Charging & Load Management - *Completed*
- **Current State:** Dynamic Load Management is fully implemented via `LoadManagementService.ts`, applying intelligent power limits (`SetChargingProfile`) and recalculating distribution based on active sessions and `maxPower` capacity settings at the `ChargingStation` and `ChargeGroup` levels.

### Payment Gateway Integration - *Foundation Laid*
- **Current State:** Placeholder API routes (`/api/payments`) and base database models (`PaymentTransaction`) exist to support future integrations.
- **Goal:** Enable pre-paid sessions, wallet systems, or pay-as-you-go charging.
- **Action:** Integrate with Stripe, Mollie, Razorpay, or similar gateways. Implement a mechanism to hold funds before `StartTransaction` and capture the exact amount upon `StopTransaction`.

### End-User Mobile App API
- **Goal:** Allow drivers to find chargers, check availability, and start sessions.
- **Action:** Expose a secure GraphQL or REST API specifically tailored for an EV driver mobile application, separate from the admin dashboard API.

### Advanced Analytics & Reporting
- **Goal:** Provide operators with deep insights into their network performance.
- **Action:** Integrate tools like Grafana, or build advanced Recharts views in the Next.js dashboard for revenue tracking, charger uptime SLAs, and usage trends over time.

## 4. Newly Proposed Enhancements

### PgBouncer for Database Connection Pooling
- **Goal:** Prevent database connection exhaustion under heavy concurrent load.
- **Action:** Introduce PgBouncer in the infrastructure layer. Prisma can quickly consume maximum PostgreSQL connections in a horizontal Node.js cluster; PgBouncer provides lightweight connection management.

### Advanced Tariff Management & Billing
- **Goal:** Support highly complex, enterprise-grade pricing models.
- **Action:** Extend the tariff system to support Time-of-Use (TOU) pricing, step tariffs (pricing based on energy delivered thresholds), idle fees, and integration with OCPP 2.0.1 advanced cost calculation mechanisms.

### WebSocket Connection Resilience
- **Goal:** Maintain seamless OCPP connections during backend deployments or horizontal scaling events.
- **Action:** Implement sticky sessions at the load balancer or migrate to a unified connection state registry to gracefully transition active WebSocket connections without dropping charging sessions.

---

*Contributions implementing any of these improvements are highly welcome! Please refer to `CONTRIBUTING.md` to get started.*