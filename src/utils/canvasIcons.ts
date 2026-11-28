/**
 * Crisp 2D Canvas vector icon painters so exported PNG postcards (Zoo Coloring,
 * My Zoo Playground) and live canvas banners (Ball Pass GOAL) draw bespoke
 * storybook illustrations instead of OS-dependent system emojis!
 */

const INK = '#4A3525';

export function drawCanvasStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  fill = '#FAD44A',
  withFace = false
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.48;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.8, radius * 0.14);
  ctx.lineJoin = 'round';
  ctx.stroke();

  if (withFace) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(-radius * 0.22, -radius * 0.12, radius * 0.09, 0, Math.PI * 2);
    ctx.arc(radius * 0.22, -radius * 0.12, radius * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, radius * 0.08, radius * 0.2, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.5, radius * 0.1);
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCanvasStickerIcon(
  ctx: CanvasRenderingContext2D,
  kind: string,
  cx: number,
  cy: number,
  size: number
) {
  const s = size / 44;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (kind) {
    case 'star':
      drawCanvasStar(ctx, 0, 0, 20, '#FAD44A', true);
      break;

    case 'heart':
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.bezierCurveTo(-16, 6, -22, -4, -18, -13);
      ctx.bezierCurveTo(-14, -20, -4, -19, 0, -11);
      ctx.bezierCurveTo(4, -19, 14, -20, 18, -13);
      ctx.bezierCurveTo(22, -4, 16, 6, 0, 16);
      ctx.closePath();
      ctx.fillStyle = '#F06A94';
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.8;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.58)';
      ctx.beginPath();
      ctx.ellipse(-7, -9, 3.4, 2, -0.3, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'flower': {
      const petals: [number, number][] = [
        [0, -12],
        [11.5, -3.5],
        [7, 10],
        [-7, 10],
        [-11.5, -3.5],
      ];
      ctx.fillStyle = '#F082A8';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.4;
      for (const [px, py] of petals) {
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#FAD44A';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'butterfly':
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.4;
      ctx.fillStyle = '#4DAAD8';
      for (const sx of [-11, 11]) {
        ctx.beginPath();
        ctx.ellipse(sx, -6, 10, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#9B74D4';
      for (const sx of [-8, 8]) {
        ctx.beginPath();
        ctx.ellipse(sx, 8, 7.5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#FAD44A';
      for (const sx of [-11, 11]) {
        ctx.beginPath();
        ctx.arc(sx, -6, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.ellipse(0, 2, 3.5, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-1, -10);
      ctx.quadraticCurveTo(-6, -18, -10, -16);
      ctx.moveTo(1, -10);
      ctx.quadraticCurveTo(6, -18, 10, -16);
      ctx.stroke();
      break;

    case 'rainbow':
      for (const [r, col, lw] of [
        [18, '#E51A1A', 6],
        [13, '#FFE01B', 5.5],
        [8, '#1578E8', 5],
      ] as [number, string, number][]) {
        ctx.beginPath();
        ctx.arc(0, 8, r, Math.PI, 0, false);
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.stroke();
      }
      ctx.fillStyle = '#FFFDF7';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.2;
      for (const cx2 of [-16, 16]) {
        ctx.beginPath();
        ctx.arc(cx2, 10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      break;

    case 'sun':
      ctx.strokeStyle = '#FF7A00';
      ctx.lineWidth = 3.2;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 14.5, Math.sin(a) * 14.5);
        ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
        ctx.stroke();
      }
      ctx.fillStyle = '#FFE01B';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(-4, -2, 1.7, 0, Math.PI * 2);
      ctx.arc(4, -2, 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-4, 3.5);
      ctx.quadraticCurveTo(0, 7, 4, 3.5);
      ctx.lineWidth = 2;
      ctx.stroke();
      break;

    case 'crown':
      ctx.beginPath();
      ctx.moveTo(-18, 12);
      ctx.lineTo(-19, -8);
      ctx.lineTo(-7, 2);
      ctx.lineTo(0, -14);
      ctx.lineTo(7, 2);
      ctx.lineTo(19, -8);
      ctx.lineTo(18, 12);
      ctx.closePath();
      ctx.fillStyle = '#FAD44A';
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.6;
      ctx.stroke();
      for (const [jx, jy, jr, col] of [
        [0, 4, 3, '#E51A1A'],
        [-10, 6, 2.2, '#1578E8'],
        [10, 6, 2.2, '#1FA838'],
      ] as [number, number, number, string][]) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(jx, jy, jr, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'paw':
      ctx.fillStyle = '#9C6844';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 6, 10, 8.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      for (const [tx, ty, tr] of [
        [-12, -5, 4.6],
        [-4.2, -12, 4.8],
        [4.2, -12, 4.8],
        [12, -5, 4.6],
      ]) {
        ctx.beginPath();
        ctx.arc(tx, ty, tr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      break;

    case 'watermelon':
      ctx.beginPath();
      ctx.arc(0, -4, 19, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.closePath();
      ctx.fillStyle = '#2BB84A';
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -4, 14.5, 0.12 * Math.PI, 0.88 * Math.PI);
      ctx.closePath();
      ctx.fillStyle = '#FF5C7A';
      ctx.fill();
      ctx.fillStyle = INK;
      for (const [sx, sy] of [
        [-6, 3],
        [0, 6],
        [6, 3],
      ]) {
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'banana':
      ctx.beginPath();
      ctx.moveTo(-15, 10);
      ctx.bezierCurveTo(-2, 18, 14, 12, 16, -12);
      ctx.bezierCurveTo(12, -13, 9, -10, 7, -6);
      ctx.bezierCurveTo(4, 4, -4, 7, -15, 5);
      ctx.closePath();
      ctx.fillStyle = '#FFE03B';
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      break;

    case 'balloon':
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.quadraticCurveTo(4, 16, -2, 22);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -4, 12.5, 15, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#FF5C8A';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(-4.5, -9, 3, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      break;

    default:
      drawCanvasStar(ctx, 0, 0, 18, '#FAD44A', false);
      break;
  }

  ctx.restore();
}
