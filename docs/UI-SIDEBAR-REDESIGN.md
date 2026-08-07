# Sidebar-first Prompt Library UI

Date: 2026-08-07

## Goal

Turn the Prompt Library from a horizontally filtered catalog into a focused application shell: persistent navigation and filtering on the left, content on the right.

## Reference rationale

- OpenAI `apps-sdk-ui` publicly exposes sidebar-oriented icon primitives (`Sidebar`, `SidebarLeft`, `SidebarCollapseLeft`, `SidebarMenuMobile`) alongside its neutral/semantic token system. This supports a persistent left-rail application pattern.
- OpenAI Apps SDK UI typography favors readable UI scales rather than decorative display type: 14/20 and 16/24 body scales, 600 weight for hierarchy.
- GitHub Primer's productivity model emphasizes flow, focus, compactness and scanability.

## Layout

Desktop:

- fixed 264px sidebar
- full-height light-gray application surface
- main content fills the rest of the viewport
- no horizontal filter bar
- no global top navigation

Mobile/tablet:

- 52px compact topbar
- sidebar becomes an overlay drawer
- same filters and navigation; no duplicated controls

## Sidebar hierarchy

1. Product identity
2. Views
   - Industry Digest
   - Porter Originals
   - Sources
3. Quick actions
   - Random prompt
   - Favorites
4. Contextual filters for the active view
5. Utility links
   - GitHub
   - Source corpus / audit

## Typography

The previous UI overused 9–10px metadata and uppercase labeling. New scale:

- Page title: 32/38, 600
- Section title: 22/28, 600
- Card title: 16/22, 600
- Primary UI / nav: 14/20, 500
- Body: 14/21, 400
- Secondary metadata: 12/18, 400–500
- Filter labels: 12/16, 500, sentence case
- Mono prompt/excerpt: 12.5–13/19

Uppercase is reserved for rare machine/status tokens, not for ordinary navigation or filter labels.

## Interaction

- `/` focuses the search input for the active view.
- Active navigation item uses a subtle gray fill instead of a colored tab.
- Active category chips are rendered as compact rows inside the sidebar rather than horizontal pills across the canvas.
- Sidebar scrolls independently from the content grid.
- Desktop keeps navigation continuously visible; mobile uses an overlay and backdrop.

## Content principle

The main canvas should visually belong to the examples, not to the controls. Source preview images provide the color; the application chrome remains neutral.
