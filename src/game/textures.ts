/**
 * Procedural texture generators for Spider-Man NYC Web-Slinger 3D.
 * 100% Canvas-based with zero external image dependencies.
 */
import * as THREE from 'three';

export function setupTextureDefaults(texture: THREE.Texture, maxAnisotropy: number = 4) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(maxAnisotropy, 8);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
}

/**
 * Creates high-detail procedural skyscraper window facades
 */
export function createSkyscraperFacadeTexture(
  type: 'modern_glass' | 'art_deco' | 'brick_classic' | 'tower_night',
  maxAniso: number = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const rows = 16;
  const cols = 8;
  const winWidth = canvas.width / cols;
  const winHeight = canvas.height / rows;

  if (type === 'modern_glass') {
    // Sleek blue-tinted reflective glass with metallic mullions
    ctx.fillStyle = '#0f2238';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * winWidth;
        const y = r * winHeight;

        // Window pane
        const isLit = (r + c * 3) % 4 === 0 || (r * 7 + c) % 5 === 0;
        const grad = ctx.createLinearGradient(x, y, x + winWidth, y + winHeight);
        if (isLit) {
          grad.addColorStop(0, '#fef08a');
          grad.addColorStop(1, '#ca8a04');
        } else {
          grad.addColorStop(0, '#1e3a5f');
          grad.addColorStop(0.5, '#0c1b2e');
          grad.addColorStop(1, '#08121f');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(x + 2, y + 2, winWidth - 4, winHeight - 4);

        // Mullion frames
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 1, y + 1, winWidth - 2, winHeight - 2);
      }
    }
  } else if (type === 'art_deco') {
    // Warm limestone / bronze art-deco style (Empire State / Chrysler look)
    ctx.fillStyle = '#948a78';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vertical limestone piers
    for (let c = 0; c < cols; c++) {
      const x = c * winWidth;
      ctx.fillStyle = '#b0a693';
      ctx.fillRect(x, 0, 4, canvas.height);
      ctx.fillStyle = '#6e6556';
      ctx.fillRect(x + winWidth - 4, 0, 4, canvas.height);

      for (let r = 0; r < rows; r++) {
        const y = r * winHeight;
        // Spandrel
        ctx.fillStyle = '#574f42';
        ctx.fillRect(x + 4, y, winWidth - 8, 4);

        // Window
        const isLit = (r * 5 + c * 2) % 3 === 0;
        ctx.fillStyle = isLit ? '#fed7aa' : '#1e293b';
        ctx.fillRect(x + 6, y + 6, winWidth - 12, winHeight - 10);

        // Window frame
        ctx.strokeStyle = '#2d271f';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 6, y + 6, winWidth - 12, winHeight - 10);
      }
    }
  } else if (type === 'brick_classic') {
    // Classic NYC reddish/brownish brick with white window trim
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Brick mortar lines
    ctx.strokeStyle = '#431407';
    ctx.lineWidth = 1;
    for (let y = 0; y < canvas.height; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * winWidth + 8;
        const y = r * winHeight + 6;
        const w = winWidth - 16;
        const h = winHeight - 12;

        // White stone lintel & sill
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(x - 2, y - 3, w + 4, 3);
        ctx.fillRect(x - 2, y + h, w + 4, 4);

        // Window
        const isLit = (r * 11 + c * 7) % 4 === 1;
        ctx.fillStyle = isLit ? '#fef3c7' : '#0f172a';
        ctx.fillRect(x, y, w, h);

        // 4-pane crossbar
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2, y + h);
        ctx.moveTo(x, y + h / 2);
        ctx.lineTo(x + w, y + h / 2);
        ctx.stroke();
      }
    }
  } else {
    // tower_night: Highly dramatic illuminated night skyline windows
    ctx.fillStyle = '#060b14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * winWidth;
        const y = r * winHeight;
        const litVal = Math.sin(r * 2.3 + c * 1.7) * 0.5 + 0.5;

        if (litVal > 0.45) {
          const warm = litVal > 0.75;
          ctx.fillStyle = warm ? '#fef08a' : '#bae6fd';
          ctx.fillRect(x + 3, y + 3, winWidth - 6, winHeight - 6);
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x + 3, y + 3, winWidth - 6, winHeight - 6);
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  setupTextureDefaults(texture, maxAniso);
  return texture;
}

/**
 * Creates vibrant Times Square procedural billboard signs
 */
export function createBillboardTexture(
  theme: 'bugle' | 'stark' | 'oscorp' | 'broadway' | 'daily_globe',
  textHeader: string,
  textSub: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  if (theme === 'bugle') {
    // Daily Bugle iconic red / black / yellow news headline
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 44px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE DAILY BUGLE', 256, 65);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillText(textHeader, 256, 128);

    ctx.fillStyle = '#fde047';
    ctx.font = 'italic 22px Arial, sans-serif';
    ctx.fillText(textSub, 256, 175);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
  } else if (theme === 'stark') {
    // Stark Industries high-tech arc blue
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(1, '#082f49');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STARK INDUSTRIES', 256, 75);

    ctx.fillStyle = '#e0f2fe';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillText(textHeader, 256, 135);

    ctx.fillStyle = '#7dd3fc';
    ctx.font = '20px monospace';
    ctx.fillText(textSub, 256, 185);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  } else if (theme === 'oscorp') {
    // Oscorp emerald green & neon gold
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, '#064e3b');
    grad.addColorStop(1, '#022c22');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#34d399';
    ctx.font = '900 52px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OSCORP', 256, 75);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillText(textHeader, 256, 135);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = '22px Arial, sans-serif';
    ctx.fillText(textSub, 256, 185);
  } else {
    // Broadway show neon
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 50px serif';
    ctx.textAlign = 'center';
    ctx.fillText('BROADWAY', 256, 70);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(textHeader, 256, 130);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '20px sans-serif';
    ctx.fillText(textSub, 256, 180);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates asphalt road texture with lane dashes and pedestrian crosswalks
 */
export function createRoadTexture(isCrosswalk: boolean = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dark asphalt base
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle asphalt grain
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.fillStyle = Math.random() > 0.5 ? '#292524' : '#141210';
    ctx.fillRect(x, y, 2, 2);
  }

  if (isCrosswalk) {
    // White zebra stripes
    ctx.fillStyle = '#f8fafc';
    for (let x = 16; x < canvas.width - 16; x += 32) {
      ctx.fillRect(x, 24, 18, canvas.height - 48);
    }
  } else {
    // Yellow double center line
    ctx.fillStyle = '#facc15';
    ctx.fillRect(124, 0, 3, canvas.height);
    ctx.fillRect(130, 0, 3, canvas.height);

    // White dashed lane markers
    ctx.fillStyle = '#f8fafc';
    for (let y = 16; y < canvas.height; y += 48) {
      ctx.fillRect(60, y, 3, 24);
      ctx.fillRect(193, y, 3, 24);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  setupTextureDefaults(texture);
  return texture;
}

/**
 * Procedural Spider-Man eye lens texture (honeycomb reflective white with black contour)
 */
export function createSpiderEyeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // White base
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 128, 128);

  // Hexagonal micro mesh pattern
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  const hexSize = 8;
  for (let y = 0; y < 128; y += hexSize * 1.5) {
    for (let x = 0; x < 128; x += hexSize * Math.sqrt(3)) {
      ctx.beginPath();
      for (let a = 0; a < 6; a++) {
        const angle = (a * Math.PI) / 3;
        const px = x + hexSize * Math.cos(angle);
        const py = y + hexSize * Math.sin(angle);
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Spider-Man suit webbing fabric texture
 */
export function createSpiderWebFabricTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Vivid classic crimson red
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, 256, 256);

  // Black webbing grid lines
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2.5;

  // Concentric curved web lines
  for (let r = 20; r <= 180; r += 28) {
    ctx.beginPath();
    ctx.arc(128, 128, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Radiating web spokes
  for (let a = 0; a < 12; a++) {
    const angle = (a * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(128 + Math.cos(angle) * 160, 128 + Math.sin(angle) * 160);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  setupTextureDefaults(texture);
  return texture;
}
