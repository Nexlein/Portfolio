/**
 * SVG text scales with its drawing: a chart drawn 1080 wide and shown 300px wide has labels 3.6 times smaller.
 * This keeps `--k` (shown width / drawn width) up to date on `box`, so CSS can hold labels at a readable size:
 * `font-size: max(<design size>, calc(11px / var(--k, 1)))`. Without JS `--k` is unset and the design sizes apply.
 */
export function trackScale(box: Element & ElementCSSInlineStyle, drawnWidth: number): void {
    const set = () => {
        if (box.clientWidth && drawnWidth) box.style.setProperty('--k', (box.clientWidth / drawnWidth).toFixed(3));
    };
    new ResizeObserver(set).observe(box);
}
