# User & Premium Plan Management Architecture & Guide

This document provides a detailed overview of the **User Credits & Plan Management** features built across the database layer, shared monorepo packages, NestJS API backend, and Next.js Admin dashboard.

---

## 1. Overview & Architecture

The fitness app platform includes AI-assisted chat features and premium subscription tiers. To support granular administration:
- **User Management** allows admins to adjust individual user credits (`Total Credits`, `Remaining Credits`), assign premium plans, and set explicit plan expiration dates.
- **Plans Management** provides a full CRUD system for subscription tiers, designed for seamless integration with App Store, Google Play Store, and RevenueCat.

---

## 2. Database Schema Design (`@fitness/db`)

### `Plan` Model (`plans` collection in MongoDB)

```prisma
model Plan {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  name           String   @unique
  description    String?
  duration       String   // e.g., "monthly", "yearly", "weekly", "lifetime"
  durationDays   Int?     // e.g., 30, 365
  price          Float    @default(0)
  currency       String   @default("USD")
  benefits       String[] // Array of feature bullet points
  storeProductId String?  // RevenueCat / Play Store / App Store Product ID
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  users User[]

  @@map("plans")
}
```

### `User` Model Extensions

```prisma
model User {
  // ... existing fields ...
  totalCredits     Int       @default(5)
  remainingCredits Int       @default(5)
  planId           String?   @db.ObjectId
  planName         String?
  planExpiresAt    DateTime?
  plan             Plan?     @relation(fields: [planId], references: [id])
}
```

---

## 3. Shared Monorepo Packages

- **`@fitness/types`**:
  - `Plan`: Defines the wire interface for subscription plans.
  - `User`: Extended with `totalCredits`, `remainingCredits`, `planId`, `planName`, `planExpiresAt`.
- **`@fitness/validation`**:
  - `createPlanSchema` & `updatePlanSchema`: Zod validation for plan creation and modification.
  - `adminUpdateUserSchema`: Zod validation for admin user edits (credits, plan selection, expiry date, role, verification).
- **`@fitness/db`**:
  - Mappers: `toPlan` and updated `toUser` mapper to maintain strict ISO date and type sanitization.

---

## 4. Backend API Endpoints (`@fitness/api`)

### Plans Management (`/plans`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/plans` | Authenticated | List all active plans (pass `?activeOnly=true` to filter) |
| `GET` | `/plans/:id` | Authenticated | Get detailed information for a single plan |
| `POST` | `/plans` | Admin | Create a new premium plan |
| `PATCH` | `/plans/:id` | Admin | Update an existing plan |
| `DELETE` | `/plans/:id` | Admin | Delete a plan and unlink assigned users |

### User Admin Management (`/users`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `PATCH` | `/users/:id` | Admin | Update user credits (`totalCredits`, `remainingCredits`), `planId`, `planName`, `planExpiresAt`, `role`, and `emailVerified` |

---

## 5. Admin Dashboard Panel (`@fitness/admin`)

### User Management (`/users`)
- **Table Overview**: Displays user profile details, active plan badge, and credit status (`remaining / total`).
- **Edit User Modal**:
  - **AI Chat Credits**: Form fields for `Total Credits` and `Remaining Credits`. Includes a "Reset to Default" shortcut that pulls from App Settings (`freeChatsLimit`).
  - **Subscription Plan**: Dropdown to assign an active plan or a custom plan name.
  - **Plan Expiration**: Date picker for `Plan Expires On`.
  - **Role & Status**: Toggle user roles (`user` / `admin`) and email verification.

### Plans Management (`/plans`)
- **Navigation**: Added to the admin sidebar under `Plans`.
- **Plan Cards**: Visual grid displaying plan pricing, duration, Store Product ID, active status, and benefit bullet points.
- **Create & Edit Modals**: Form for defining plan properties, price, duration, Store Product ID, and dynamic benefit list management.
- **Delete Confirmation**: Safe deletion workflow with modal prompt.

---

## 6. Future Play Store & RevenueCat Integration Roadmap

1. **Product Mapping**:
   Use the `storeProductId` field on each `Plan` (e.g. `com.fitness.pro.monthly`) to match Google Play Console product IDs and RevenueCat entitlements.
2. **Webhook Provisioning**:
   When RevenueCat emits a `INITIAL_PURCHASE` or `RENEWAL` webhook event to `@fitness/api`, query `prisma.plan.findFirst({ where: { storeProductId } })` and automatically provision the corresponding `planId`, `planName`, and `planExpiresAt` on the user record.
