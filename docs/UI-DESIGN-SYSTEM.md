# Seedance Porter UI System — White Product UI

Verified: 2026-08-07

This document records the public design-system sources and the product decisions used by Seedance Porter's Prompt Intelligence interface. It is a derived Porter system, not a copy of ChatGPT or any other product UI.

## Public reference systems

### OpenAI Apps SDK UI

Official repository: https://github.com/openai/apps-sdk-ui

What Porter adopts:

- three-tier token architecture: primitives -> semantic -> components;
- system sans stack rather than requiring a proprietary font;
- 4px base spacing grid;
- neutral light surfaces and high-contrast text;
- subtle hairline borders rather than heavy cards/shadows;
- semantic text levels instead of arbitrary opacity;
- compact radius scale (2/4/6/8/10/12/16/20/24);
- black/dark primary actions and neutral secondary/ghost actions;
- visible focus rings;
- restrained elevation.

Relevant public files:

- `src/styles/variables-primitive.css`
- `src/styles/variables-semantic.css`
- `src/Typography.mdx`

### GitHub Primer

Official product design system: https://primer.style/product/

What Porter adopts:

- optimize productivity UI for flow, focus, compactness and familiarity;
- keep metadata tokens short and scannable;
- do not use color as the primary hierarchy mechanism;
- treat accessibility as a foundation, not a retrofit;
- use consistent spacing and typography primitives.

### Vercel Geist

Official design system: https://vercel.com/geist/introduction

What Porter adopts:

- developer-tool density;
- high-contrast white/black foundation;
- strong grid alignment;
- minimal visual decoration;
- compact controls and crisp card boundaries.

### Radix Themes

Official theme docs: https://www.radix-ui.com/themes/docs/theme/radius

What Porter adopts:

- a small consistent radius scale;
- interaction states that change predictably;
- component geometry driven by tokens rather than one-off values.

## Porter design goals

1. **Tool first, gallery second.** The interface exists to find, compare, remix and reuse prompts quickly.
2. **White is the canvas.** Images provide the visual color; UI chrome stays neutral.
3. **One hierarchy system.** Text size, weight and spacing carry structure; color is secondary.
4. **Dense but calm.** Default controls are 36-40px high. Card information fits above the fold without becoming cramped.
5. **Source and adaptation are visually distinct.** Source provenance is neutral/blue-linked; Porter output uses black primary actions.
6. **No fake elevation.** Borders first, shadow only for overlays and active floating surfaces.
7. **Keyboard and focus states are mandatory.** Search keeps `/`; all controls show a clear focus ring.
8. **Responsive by reduction.** On smaller screens hide nonessential metadata before shrinking readable content.

## Porter light tokens

```css
--sp-white: #ffffff;
--sp-gray-25: #fcfcfc;
--sp-gray-50: #f9f9f9;
--sp-gray-75: #f3f3f3;
--sp-gray-100: #ededed;
--sp-gray-150: #dfdfdf;
--sp-gray-200: #cdcdcd;
--sp-gray-400: #8f8f8f;
--sp-gray-500: #5d5d5d;
--sp-gray-700: #303030;
--sp-gray-800: #212121;
--sp-gray-1000: #0d0d0d;

--sp-text: var(--sp-gray-1000);
--sp-text-secondary: var(--sp-gray-500);
--sp-text-tertiary: var(--sp-gray-400);
--sp-surface: var(--sp-white);
--sp-surface-subtle: var(--sp-gray-50);
--sp-surface-hover: var(--sp-gray-75);
--sp-border: var(--sp-gray-100);
--sp-border-strong: var(--sp-gray-150);
--sp-primary: var(--sp-gray-1000);
--sp-focus: #0285ff;

--sp-radius-sm: 6px;
--sp-radius-md: 8px;
--sp-radius-lg: 10px;
--sp-radius-xl: 12px;
--sp-radius-2xl: 16px;
--sp-radius-full: 9999px;
--sp-space: 4px;
```

The numeric neutral values intentionally align closely with the publicly documented OpenAI Apps SDK UI neutral primitives, while the naming and application layer are Porter-specific.

## Default information architecture

Top bar:

- product identity;
- Industry Digest / Porter Originals / Source Audit tabs;
- GitHub link.

Page header:

- small context label;
- 32-40px page title;
- one-sentence explanation;
- compact inline statistics/actions.

Sticky utility bar:

- primary search;
- four compact filters;
- category chips;
- result count directly below.

Cards:

- visual preview;
- category + mode/date;
- 16px semibold title;
- creator/use line;
- max 3-4 metadata tokens;
- two explicit actions maximum.

Drawer:

- source image;
- title + provenance;
- original excerpt/source link;
- why it works;
- editable Porter adaptation;
- copy/export actions.

This is the baseline for future Studio and Prompt Intelligence surfaces.
