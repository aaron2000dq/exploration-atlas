# Instructions for AI coding agents

## Purpose

This repository is an open-source template for location-based birthday and
celebration experiences. The checked-in Hangzhou route is a public example;
personal names, private media, nearby-home rehearsal data, accounts, and local
exports must never be added to the public template.

## Before customizing

Read these files completely:

1. `README.md`
2. `docs/CUSTOMIZE_WITH_AI.md`
3. `docs/PROJECT_BRIEF.template.md` or the user's completed local copy
4. `docs/ART_AND_ASSETS.md` when visual assets are in scope

The user should only need to provide the ordered places and the gift or
experience revealed at each place. Do not ask them to enter coordinates,
repository visibility, a world-building brief, colors, fonts, map bounds, or
other implementation details unless they explicitly want to override the
template defaults.

Resolve current place information from the name, address, or map link. Find and
convert coordinates to WGS-84 yourself. If multiple places or entrances match,
ask the user to choose the correct human-readable location; never ask them to
copy latitude and longitude manually.

Before grouping checkpoints, obtain routed walking distance and time between
each consecutive pair. Straight-line distance is only a preliminary screen.
Also validate the total walking distance/time of each proposed group and check
for rivers, highways, closed compounds, unsafe paths, terrain, appointment
conflicts, and map legibility. By default, keep consecutive legs within about
1.2 km or 15 minutes and a whole map within about 2.5 km or 35 minutes. Treat
1.2–1.8 km or 15–25 minutes as a borderline case that must be surfaced; split
at more than about 1.8 km or 25 minutes, any required vehicle/transit segment,
or a physical barrier. If routed data cannot be verified, mark it for field
checking and split conservatively rather than claiming it is walkable.

Before implementation, return one compact confirmation table containing the
ordered places, gifts, walking distance/time from the previous place, proposed
map groups, transfers, and trigger entrances. Each map group must represent one
continuous walkable area; include the reason for any split or threshold
override.
Ask at most three short questions only for genuine ambiguities or conflicts.
After the user confirms the table, implement without additional questionnaire
rounds. Reuse the checked-in visual/story style and generate clues, reveals,
and finale copy automatically unless the user specifies a different theme.

The open-source template keeps `publicDemo.enabled` on so a newcomer can walk
through the experience without visiting the example coordinates. Turn it off
for a recipient-facing private deployment. Do not remove the isolated demo
route or make demo progress share the formal IndexedDB namespace.

## Implementation rules

- General recipient copy and optional features belong in
  `src/config/experience.ts`.
- Routes, maps, coordinates, checkpoints, clues, references, and thresholds
  belong in `src/config/story.ts`.
- Browser runtime coordinates must be WGS-84.
- Each `ExplorationZone` must match a walkability-validated map group rather
  than an arbitrary number of checkpoints.
- `routeGeo` and `mapRoutePoints` must have matching lengths.
- Recalculate map points from each new `mapBounds`; do not retain coordinates
  or map-specific tests from the checked-in example.
- Optional film and music remain disabled unless real, licensed files exist.
- A missing optional asset must never block the envelope or map flow.
- Public examples use non-personal SVG photo references. Do not commit a real
  person's face without explicit authorization for a public repository.
- The cartographer PIN in a static bundle is not a secret or authentication.
- Preserve offline behavior, reduced-motion behavior, progress recovery, and a
  no-dead-end fallback.

## Verification

Run before handing off:

```bash
npm run verify
```

Report any remaining field checks separately; automated tests do not replace a
walk-through on the final device at the real locations.
