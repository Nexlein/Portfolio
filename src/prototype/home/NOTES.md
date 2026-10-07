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

## Round 4 feedback (owner)

Prefers spider threads. Cards don't feel free-floating in space; wants smoother motion; maybe everything around an element in
the centre. Asked for Claude's own idea (minimal, cool, AI-developer vibe). Not convinced yet.

## Round 5

| H | Round 5 · latent space | Centre = the owner ("trained on 17 projects"), spider threads to every project. Direction = similarity (classical MDS on
Jaccard skill overlap, spread evenly round the circle keeping order), distance = time (Personal closest, Tek1 outermost) with faint
orbit rings. Depth layers (near = bigger/brighter), mouse parallax by depth, slow layered-sine drift with eased speed (slows on
hover instead of freezing). Hover = nearest neighbours with similarity badges (embedding-projector style), preview in the opposite
corner. Legend explains the reading rule. References: TensorFlow Embedding Projector, WizMap, orbit/parallax card layouts. |

## Round 5 feedback (owner)

Getting better. Wants: hover = opening animation of the card in place (not a preview elsewhere); projects linked by X legs to
random points on the background ("spider legs on a wall") rather than to the centre; no cursor parallax, always a little smooth
float, only the hovered project stops.

## Round 6

| I | Round 6 · spider web | Cards float constantly (two layered waves per axis, ~9-16 s periods, per-card clock); only the hovered card
eases to a full stop (measured 0 px vs ~7.6 px/1.5 s for others). Each card hangs on 2-4 legs to seeded wall points, one leg per
main skill; when unfolded, its legs light and name the skills at their tips. Hover intent 120 ms, then the card unfolds in place
(width + 0fr→1fr grid row, staggered media/text), downward or upward near the bottom so the title stays under the cursor, shifted
to stay on screen. Tap to unfold on touch, focus to unfold with keyboard, click/Enter opens the project page, Escape closes.
Layout keeps round 5 meaning (direction = similarity, distance = time); quiet centre without lines; animation pauses off-screen. |

## Round 6 feedback (owner)

- Floating animation is better; the in-place opening animation is cool. Keep both.
- Missed the links between projects from earlier rounds; maybe threads that stick to the cursor when it enters the field.
- The centre has no interest any more: remove it or give it a reason to exist.
- The random-dot spider legs look weird.

Choices made before building round 7: web + frame threads, cursor silk to the 2-3 nearest cards, a "Now" hub, subtle pluck.

## Round 7

| J | Round 7 · silk | A real web instead of random wall dots: each project is tied to its 2 most similar projects (deduplicated),
cards near a wall tie to the frame, slanted outward like a web's radial threads. Threads are quadratic curves that sag a little
and follow the drifting cards. The cursor crossing a thread plucks it (damped vibration, ~0.6 s). In empty space the cursor spins
elastic silk to its 3 nearest cards (within 340 px), a new target shoots a fresh thread. Hover unfolds as in round 6, lights the
card's similarity threads and badges the similar cards with their score. Centre = "Now" (current job, period, school year) with
faint time rings around it, so "closer = more recent" reads. Reduced motion: no drift, no pluck, instant silk. |

Round 7 follow-up: threads no longer run off the board edges. One elliptical rim (about 1.75:1) closes the web around
"Now", cards are kept inside it (`layout(W, H, fit)`), and outer cards tie to the rim along their radial direction (a V of
two threads for the outermost). Activation pulses wander along the similarity threads, sometimes cascade to the next one, and
flash the card they reach; an unfolded card fires along all its own threads (a "forward pass").

## Round 7 feedback (owner)

- Very cool. Threads going through the border to nothing should go: give the impression of a circular shape round the centre.
- Then: free hand to improve anything, even dropping things asked for earlier.

## Round 8

| K | Round 8 · orbits | Critique of J: six motion systems at once (drift, wandering pulses, card flashes, repeated bursts, silk,
pluck), and lines that meant nothing (rim spokes, dashed rings). K keeps only meaningful lines and one thing moving at a time.
Each period (personal, tek 2, tek 1) is a silk loop strung through its own cards, redrawn each frame so it follows them, and
labelled in its widest gap: the circular shape is the timeline, so the rim, spokes, dashed rings and "closer = recent" legend
go. One thought at a time: a pulse walks 2-4 hops through similar projects, lighting the thread it travels and the card it
reaches, then rests 1.8-3.4 s. Hover sends one signal to each similar project (no loop). Boot once at 35 % visible: Now, then
each loop draws and its cards appear inside out, then the web threads. Card subline = two main skills (the loop says the year). |

## Round 9

Question from the owner: keep the random floating or switch to something else?

| L | Round 9 · living web | K with one physical web instead of 17 independent wobbles. Each card sits on a spring to its rest
position; a slow breeze (two long travelling waves, wavelengths ~1.3-3k px) leans neighbouring cards the same way; the similarity
threads are soft springs, so linked cards share their motion. Energy comes from events: a signal landing pushes its card along
its path and the push ripples to neighbours, a pluck shakes the two cards it holds, the cursor's silk tugs its cards a few px.
The hovered card stays exactly still. Measured over 6 s: motion correlation of cards < 300 px apart 0.52 (K's random float:
-0.21), travel 5-15 px per card; hovered card 0 px. Reduced motion: static. |

## Round 9 feedback (owner)

- Too much spider vibe; wants an "AI brain graph" vibe.

## Round 10

| M | Round 10 · neural map | L's layout and living motion, restyled as a neural network. Spider cues removed: sagging silk,
pluck, cursor silk and spinneret, silk loops. Synapses are gentle arcs (no gravity) whose width and brightness are the
similarity weight, plugged into small ports on the card edges. A latent layer of 72 faint hidden neurons, sparsely wired
(2 nearest + a nearby project), fills the space. Spreading activation: a thought starts at one project and spreads to all its
neighbours at 0.62x per step until under 0.3 (comet signals, cards glow with their activation, hidden neurons near a signal
light up), every 3-4.8 s. The cursor is an input: hidden neurons around it light up, dashed attention lines reach the 3 nearest
projects, which lean slightly toward it. Periods are faint dotted layers with labels. Hover activates the neighbours once. |

**Verdict:** _(to fill in: winner, and what to borrow from the others)_

Delete this folder, `prototype-home.html`, the `prototype` npm script, the prototype fonts and the
`src/prototype/**` lint override once the decision is folded into the real pages.
