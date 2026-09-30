# PROJECT.md — Reputation OS

## Project Overview

**Name:** Reputation OS  
**Type:** Multi-tenant SaaS Platform  
**Domain:** Customer Feedback & Google Review Growth  
**Status:** Planning  
**Created:** 2026-09-30  

## Vision

Turn more customer interactions into genuine feedback, Google review opportunities, and actionable reputation insights for local businesses.

## Product Positioning

Reputation OS is a **customer feedback and Google review growth platform** for local businesses. It is NOT a generic QR generator. It is a premium SaaS product that businesses pay for monthly.

## Core Value Proposition

- Make it effortless for genuine customers to leave genuine Google reviews
- Provide actionable reputation insights from customer feedback
- Track feedback sources (Reception QR, Instagram) with unified analytics
- Beautiful, branded customer-facing feedback experiences
- Premium business dashboard with meaningful metrics

## Critical Policy: Google Review Compliance

> [!CAUTION]
> **NO REVIEW GATING.** Every customer must have access to the Google review option regardless of their rating. Do not manipulate, fabricate, incentivize, suppress, or selectively solicit reviews. This is a hard constraint that applies to all phases.

## Review Sources

1. **Reception QR** — Physical QR code scanned at business location
2. **Instagram** — Link shared via Instagram bio/stories

Each business gets ONE Reception QR and ONE Instagram source. Both lead to the same branded feedback experience with source tracking.

## Customer Flow

```
Reception QR Scan / Instagram Link
  → Branded Feedback Page (mobile-first, fast, premium)
  → Customer selects star rating (1-5)
  → Customer writes feedback text
  → Feedback submitted
  → Google Review CTA shown (ALL customers, regardless of rating)
  → Customer chooses whether to continue to Google
```

## Multi-Tenancy Model

```
Platform
├── Business A
│   ├── Reception QR
│   └── Instagram
├── Business B
│   ├── Reception QR
│   └── Instagram
└── Business C
    ├── Reception QR
    └── Instagram
```

Every business has fully isolated data. A business must never access another business's data.

## Design Direction

**Inspired by:** Linear, Stripe, Vercel, Apple  
**Style:** Premium, modern, minimal, professional  
**Avoid:** Generic admin templates, excessive cards/gradients, childish UI, bloated navigation

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Review gating | Prohibited | Google policy compliance |
| QR locations | Single (Reception) | Simplicity first |
| Feedback sources | Reception QR + Instagram | Core acquisition channels |
| Customer auth | Not required | Frictionless feedback |
| AI features | Deferred to later phases | Product-first approach |
| WhatsApp | Future integration | Architecture-ready, not implemented |
| Google API | Review URL redirect only | No text injection API exists |

## Milestone: v1.0 — Core Platform

**Objective:** Ship a production-ready multi-tenant feedback and review growth platform with Reception QR and Instagram sources, business dashboard, and reputation analytics.

**Phases:** See ROADMAP.md

## Team

- Solo developer / AI-assisted development

## Repository

- `c:\Automation\QR`
- Monorepo structure (TBD based on architecture decisions)
