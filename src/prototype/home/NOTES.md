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

## Round 2 feedback (owner)

- Prefers the list of projects over cards.
- Dislikes one big + the rest small: wants all small, opening big on hover or click.
- Hero and curve feel too big.
- Misses the branch style (C).
- Idea: projects as a chart / neural-network-like system of small floating cards.

## Round 3

| F | Round 3 · network | Compact hero with a "now / open to" status. "What brings you here?" branch tree under the hero (jumps to and opens sections). Slim curve. Projects as a neural network: layers Tek1 → Tek2 → Personal, edges = shared technologies (C/C++ counts as C and C++, RL = reinforcement learning), small floating nodes coloured by domain, hover lights the links + preview, click opens it big, occasional forward-pass pulse. Network freezes while pointed at or focused (moving targets are hard to hit). List view toggle: every project small, one opens big (exclusive details). Phones default to the list. Hire / freelance as a branch tree. |

Notes for the real build: the curve needs a vertical layout on phones; domain colours already go through data-domain (no inline styles, CSP-ready).

## Round 3 feedback (owner)

Better, but wants cards placed freely (random-looking) across the whole space, not in a box, gently floating,
a bit more than just the name, held by "spider" links to points or other projects, evoking a circuit board / AI neural system.
Discussion answers: threads "AI brain" or minimal spider (both interesting) · anchors = skill pins · cards minimal and clean,
maybe an icon · behaviours: hover lights links, pulses on threads, click opens big (no drag).

## Round 4

| G | Round 4 · skill board | Full-width board. Skill pins (technologies used by 2+ projects; Gymnasium/SB3 folded into RL; "Infra & CI"
concept pin for MyMarvin + Octopus) at designed positions, related skills as neighbours. Cards hang from their skills via a seeded
force layout (no overlaps, verified), float gently, freeze while pointed at/focused. Card = domain line icon + title + year · first tag.
Hover a card: its skills light + preview. Hover a pin: every project using it lights. Pulses flow pin → card. Click opens big.
Thread style toggle to compare: Synapse (soft curves) vs Spider (thin straight). |

**Verdict:** _(to fill in: winner, and what to borrow from the others)_

Delete this folder, `prototype-home.html`, the `prototype` npm script, the prototype fonts and the
`src/prototype/**` lint override once the decision is folded into the real pages.
