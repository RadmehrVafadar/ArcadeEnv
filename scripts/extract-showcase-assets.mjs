import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

// Lossless pixel extraction from the existing artwork, without generating new art.
// Masks include each object's shadow; nearby floor samples restore the room underneath.
const masks = [
  { name: 'mirror', points: [[31,254],[57,249],[71,257],[76,286],[81,313],[68,322],[28,323],[22,314],[29,305],[26,277]] },
  { name: 'boids', points: [[326,245],[369,252],[371,288],[383,299],[382,318],[361,330],[314,315],[309,300],[321,291]] },
  { name: 'fake-news', points: [[51,617],[89,617],[96,625],[96,681],[91,695],[53,694],[47,682],[47,628]] },
  { name: 'music-orb', points: [[335,614],[350,628],[365,615],[365,637],[391,628],[377,650],[391,663],[377,671],[383,695],[361,685],[350,708],[339,688],[318,699],[324,677],[307,661],[324,650],[311,631],[333,640]] },
  { name: 'video-player', points: [[47,979],[88,970],[103,978],[103,1016],[116,1031],[120,1051],[106,1061],[60,1059],[43,1047],[41,1035],[49,1021]] },
  { name: 'minesweeper', points: [[325,978],[371,978],[376,984],[376,1033],[367,1048],[325,1044],[318,1034],[318,987]] },
];

const output = new URL('../apps/portfolio/src/portfolio-game/scene/assets/', import.meta.url);
await mkdir(output, { recursive: true });
const original = await readFile(new URL('../apps/portfolio/src/assets/pixelB.png', import.meta.url));
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const assets = await page.evaluate(async ({ data, masks }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const room = document.createElement('canvas');
    room.width = image.width;
    room.height = image.height;
    const context = room.getContext('2d');
    context.drawImage(image, 0, 0);
    const result = [];
    for (const mask of masks) {
      const xs = mask.points.map(point => point[0]);
      const ys = mask.points.map(point => point[1]);
      const x = Math.min(...xs), y = Math.min(...ys);
      const width = Math.max(...xs) - x, height = Math.max(...ys) - y;
      const sprite = document.createElement('canvas');
      sprite.width = width;
      sprite.height = height;
      const spriteContext = sprite.getContext('2d');
      const path = new Path2D();
      mask.points.forEach(([px, py], i) => i ? path.lineTo(px, py) : path.moveTo(px, py));
      path.closePath();
      spriteContext.translate(-x, -y);
      spriteContext.clip(path);
      spriteContext.drawImage(image, 0, 0);
      const sampleY = y < 400 ? 340 : y < 800 ? 724 : 754;
      context.drawImage(image, x, sampleY, width, height, x, y, width, height);
      result.push({ name: mask.name, image: sprite.toDataURL().split(',')[1], x, y, width, height });
    }
    result.push({ name: 'room', image: room.toDataURL().split(',')[1] });
    return result;
  }, { data: original.toString('base64'), masks });
  for (const asset of assets) {
    await writeFile(new URL(`${asset.name}.png`, output), Buffer.from(asset.image, 'base64'));
    console.log(asset.name, asset.x ?? 0, asset.y ?? 0, asset.width ?? 426, asset.height ?? 1114);
  }
} finally {
  await browser.close();
}
