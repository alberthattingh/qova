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
