# Qova Engineering Standards

## Architecture

- All business logic must live in services.
- Angular components must only handle presentation and user interaction.
- Components must never interact directly with:
  - Firestore
  - Firebase Storage
  - Firebase Auth
  - Firebase Functions
- All Firebase interactions must be encapsulated in dedicated services.

## Angular

- Prefer componentization over large components.
- Keep Angular templates small.
- Extract reusable or logically distinct UI sections into components.
- Do not place business logic in templates.
- Use Angular routing for navigation.
- All authenticated routes must use the auth guard.

## Models

- Every model/interface must be stored in its own file.
- Store models under the appropriate `models/` directory.
- Do not define application data models inside components or services.

## Constants

- Do not use magic strings.
- Store application constants under `constants/`.
- Prefer enums for finite sets of values such as:
  - statuses
  - roles
  - types
  - frequencies
  - decisions
- Use centralized constants for:
  - route paths
  - Firestore collection names
  - Firebase Storage paths
  - Cloud Function names

## Services

Services own:

- business rules
- validation involving application state
- data transformation
- Firestore access
- Storage access
- authentication access
- Cloud Function access

Components should call services and render their results.

## Firestore

- Never access Firestore directly from a component.
- Collection names must come from constants.
- Keep persistence concerns separate from UI concerns.

## Code Quality

Before completing a task:

1. Check for duplicated logic.
2. Check whether large components should be split.
3. Check for magic strings.
4. Check that new models have their own files.
5. Check that Firebase calls occur only through services.
6. Check that authenticated routes are guarded.

## Prefer the Best Architecture Over Backward Compatibility

- Do not design new functionality around preserving legacy architecture, legacy data shapes, deprecated models, or outdated implementation patterns.
- When a new feature would be better supported by refactoring existing code, prefer the refactor instead of adding compatibility layers, duplicate paths, adapters, fallback logic, or special cases for the old implementation.
- Existing code is not a constraint on the desired architecture. Treat it as something that may be changed when a cleaner, simpler, or more scalable design is available.
- Do not maintain support for multiple versions of the same persisted data model unless explicitly instructed to do so.
- When changing a persisted model, Firestore document shape, collection structure, enum value, identifier, or other stored data contract, implement the application against the new desired structure only.
- If existing persisted data would be incompatible with the proposed change, clearly highlight this before or alongside the implementation. Explain:

  - what existing data will become incompatible;
  - what the new expected structure is;
  - why the migration is necessary; and
  - what data migration or cleanup must occur.

- Do not silently introduce runtime compatibility code to compensate for unmigrated data.
- Do not use optional fields, fallback values, legacy property checks, dual reads/writes, or version-detection logic solely to keep old data working unless explicitly requested.
- Assume existing data can be migrated when necessary. Prefer a one-time migration over permanent complexity in the application.
- When evaluating a new feature, first determine the best architecture for the system as it should exist after the change, then refactor existing functionality to fit that architecture.
- Preserve existing user-facing behavior only when it remains part of the current product requirements. Do not preserve obsolete implementation details merely because they already exist.
