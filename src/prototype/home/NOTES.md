# PROTOTYPE — home redesign directions

**Question:** which visual direction should the redesign take?

Run: `npm run prototype` (dev server only), then switch with the floating bar, ← / →, or `?variant=A|B|C`.
Theme toggle on the bar (defaults to the system setting).

| Key | Direction      | Signature                                                                                                 |
| --- | -------------- | --------------------------------------------------------------------------------------------------------- |
| A   | Policy field   | Live value iteration in the hero; the cursor is the reward. Projects as a dense table with hover preview. |
| B   | Learning curve | Career drawn as a training run with real milestones as checkpoints; projects grouped by epoch.            |
| C   | Decision tree  | Visitor picks a branch (hire / freelance / projects / path); only that content opens.                     |

## Round 1 feedback (owner)

- A: likes the live simulation hero (wants more things like it), colors and fonts. Projects table messy, hard to understand.
- B: likes charts / data viz. Hates the font (Recursive). Project grouping clearer.
- C: likes branches rendering different content. Feels empty as a whole page.

## Round 2

| D | Round 2 · projects grid | A's identity + playable hero (click adds walls), B's curve in A's style, C's branches inside sections (project domains, hire vs freelance). Projects as media cards. |
| E | Round 2 · featured + list | Same page; projects as one featured project (video playing) + compact rows. |

**Verdict:** _(to fill in: winner, and what to borrow from the others)_

Delete this folder, `prototype-home.html`, the `prototype` npm script, the prototype fonts and the
`src/prototype/**` lint override once the decision is folded into the real pages.
