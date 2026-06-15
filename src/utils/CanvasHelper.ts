export class CanvasHelper {
    static drawGrid(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        spacing: number = 30,
        color: string = 'rgba(255, 255, 255, 0.02)'
    ) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += spacing) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }
        for (let j = 0; j < height; j += spacing) {
            ctx.beginPath();
            ctx.moveTo(0, j);
            ctx.lineTo(width, j);
            ctx.stroke();
        }
    }

    static drawGlowCircle(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        r: number,
        fillColor: string,
        glowColor: string | null = null,
        glowBlur: number = 0
    ) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;

        if (glowColor && glowBlur > 0) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = glowBlur;
        }

        ctx.fill();
        ctx.shadowBlur = 0; // reset
    }

    static drawCone(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        radius: number,
        angle: number,
        fov: number,
        fillColor: string
    ) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius, angle - fov / 2, angle + fov / 2);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
    }

    static drawText(
        ctx: CanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        font: string = '12px Outfit',
        color: string = '#ffffff',
        align: CanvasTextAlign = 'center',
        baseline: CanvasTextBaseline = 'middle'
    ) {
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        ctx.fillText(text, x, y);
    }
}
