# WIP: WebKit e2e stall (remove before the PR)

## Evidence so far

- CI 39072202437, project.spec:57 (webkit, worker 7): newPage 315 ms, goto /projects/arcade.html, request recorded
  with no timings (send/wait -1, status -1), one blank screencast frame, then nothing for 30 s. Worker 7's previous
  tests: project.spec:33 (gallery), pages.spec:91/111 (video pages). Worker 6 (separate browser) kept loading pages.
- Playwright WebKit fires requestWillBeSent from the web process, so the recorded request does not prove the network
  process or the server ever got it. No server log exists for that run.
- Each context has its own network session (own SoupSession), so pooled keep-alive connections from earlier tests
  should not be shared; still unverified.
- CI 38639492757: both failures ran on code from before a0a6fbb (run 21:20Z, commit 21:32Z).
    - home.spec:225 failed the old threshold (>30 frames in 5 s, got 23): already fixed by a0a6fbb.
    - pages.spec:111 used the old `networkidle` goto; then `evaluate(scrollWidth)` hung 24 s on zappy.html (video),
      newPage took 2.8 s: web process frozen while the video plays.

## Local stress (16-core box, taskset -c 0-1)

- Logging server: `node wip-stress-server.mjs` (vite preview on 4173, logs conn/req/fin/abort), then
  `CI=1 taskset -c 0-1 npx playwright test -c playwright.stress.config.ts --workers 2 --repeat-each 8 e2e/project.spec.ts e2e/pages.spec.ts`.
- Run 1 (2 workers, repeat 8, project + pages): 343 passed, 1 failed, no stall reproduced. Media requests: plain GET,
  200, finished, no Range, no aborts.
- New, different flake: pages.spec:75 (404 page, fr-FR): after clicking #nf-home, navigated to / then the head script
  redirected to /fr/ (all 200), but `toHaveURL(/\/$/)` saw "" for 5 s. Playwright WebKit lost the frame URL during the
  JS redirect. Not fixed.
- Run 2 (4 workers, repeat 40, project.spec): stopped at 65 passed, 0 failed.

## Left

1. Reproduce the goto stall (more load / longer runs), with the logging server, to see whether the request reaches
   the server. If it does not: WebKit side; if it does: server/keep-alive side.
2. Candidate fixes to test once reproducible: stub media playback in the webkit project only; or serve media
   differently. Retries stay 0.
3. pages.spec:75 URL "" after redirect.
