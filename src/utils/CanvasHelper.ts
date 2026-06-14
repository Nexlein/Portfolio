export class CanvasHelper {
  static drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, spacing: number = 30, color: string = 'rgba(255, 255, 255, 0.02)') {
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

  static drawGlowCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fillColor: string, glowColor: string | null = null, glowBlur: number = 0) {
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

  static drawGAAgent(ctx: CanvasRenderingContext2D, x: number, y: number, crashed: boolean, completed: boolean, isBest: boolean = false) {
    ctx.beginPath();
    ctx.arc(x, y, isBest ? 6 : 4, 0, Math.PI * 2);

    if (completed) {
        ctx.fillStyle = '#10b981';
    } else if (crashed) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    } else if (isBest) {
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 8;
    } else {
        ctx.fillStyle = 'rgba(248, 250, 252, 0.7)';
    }

    ctx.fill();
    ctx.shadowBlur = 0;
  }

  static drawCone(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, angle: number, fov: number, fillColor: string) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, angle - fov / 2, angle + fov / 2);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  static drawRLGrid(ctx: CanvasRenderingContext2D, grid: number[][], qTable: number[][][], rows: number, cols: number, cellSize: number) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellSize;
        const y = r * cellSize;
        const type = grid[r][c];

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);

        if (type === 1) { // Wall
          ctx.fillStyle = '#475569';
          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
          ctx.strokeStyle = '#64748b';
          ctx.beginPath();
          ctx.moveTo(x + 10, y + cellSize - 10);
          ctx.lineTo(x + cellSize - 10, y + cellSize - 10);
          ctx.lineTo(x + cellSize - 10, y + 10);
          ctx.stroke();
        } else if (type === 2) { // Target
          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          CanvasHelper.drawText(ctx, '🏆', x + cellSize / 2, y + cellSize / 2, '28px Outfit');
        } else if (type === 3) { // Trap
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          CanvasHelper.drawText(ctx, '🔥', x + cellSize / 2, y + cellSize / 2, '28px Outfit');
        } else {
          const qVals = qTable[r][c];
          const midX = x + cellSize / 2;
          const midY = y + cellSize / 2;
          const size = cellSize;

          const drawTriangle = (p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number, val: number) => {
            ctx.beginPath();
            ctx.moveTo(p1x, p1y);
            ctx.lineTo(p2x, p2y);
            ctx.lineTo(p3x, p3y);
            ctx.closePath();

            const strength = Math.min(Math.abs(val) / 100, 1.0);
            if (val > 0.001) {
              ctx.fillStyle = `rgba(16, 185, 129, ${0.05 + strength * 0.75})`;
            } else if (val < -0.001) {
              ctx.fillStyle = `rgba(239, 68, 68, ${0.05 + strength * 0.75})`;
            } else {
              ctx.fillStyle = 'transparent';
            }
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.stroke();

            if (Math.abs(val) > 0.1) {
              let tx = (p1x + p2x + p3x) / 3;
              let ty = (p1y + p2y + p3y) / 3;
              CanvasHelper.drawText(ctx, val.toFixed(1), tx, ty, '10px JetBrains Mono', 'rgba(255, 255, 255, 0.7)');
            }
          };

          drawTriangle(x, y, x + size, y, midX, midY, qVals[0]); // Up
          drawTriangle(x + size, y, x + size, y + size, midX, midY, qVals[1]); // Right
          drawTriangle(x, y + size, x + size, y + size, midX, midY, qVals[2]); // Down
          drawTriangle(x, y, x, y + size, midX, midY, qVals[3]); // Left
        }
      }
    }
  }

  static drawRLAgent(ctx: CanvasRenderingContext2D, r: number, c: number, cellSize: number) {
    const agentX = c * cellSize + cellSize / 2;
    const agentY = r * cellSize + cellSize / 2;
    CanvasHelper.drawGlowCircle(ctx, agentX, agentY, cellSize * 0.3, '#06b6d4');
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(agentX, agentY, cellSize * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  static drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string = '#f97316', glowColor: string = 'rgba(249, 115, 22, 0.3)') {
    // Outer glowing boundary
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center dot
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  static drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, font: string = '12px Outfit', color: string = '#ffffff', align: CanvasTextAlign = 'center', baseline: CanvasTextBaseline = 'middle') {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(text, x, y);
  }
}
