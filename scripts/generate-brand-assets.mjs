import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'assets', 'images');

const logoPath = path.join(assetsDir, 'logo.png');
const logoDarkPath = path.join(assetsDir, 'logo-dark.png');

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * Place artwork centered on a square canvas with safe-zone padding.
 * `contentRatio` is the fraction of the canvas the artwork may occupy
 * (Android adaptive icons need ~0.52–0.58 so circle/squircle masks do not crop).
 */
async function generatePaddedIcon(sourceBufferOrPath, outputPath, size, contentRatio, background) {
  const contentSize = Math.round(size * contentRatio);
  const artwork = await sharp(sourceBufferOrPath)
    .resize(contentSize, contentSize, {
      fit: 'contain',
      background: TRANSPARENT,
    })
    .png()
    .toBuffer();

  let pipeline = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  }).composite([{ input: artwork, gravity: 'centre' }]);

  // Only flatten when the canvas background is opaque (keeps adaptive-icon alpha intact).
  if (background.alpha === 1) {
    pipeline = pipeline.flatten({ background });
  }

  await pipeline.png().toFile(outputPath);
}

async function generateSplash(sourcePath, outputPath) {
  await sharp(sourcePath)
    .resize(1024, 1024, {
      fit: 'contain',
      background: TRANSPARENT,
    })
    .png()
    .toFile(outputPath);
}

/** Extract the shield/clock emblem from the full logo (above the wordmark). */
async function extractEmblem(sourcePath) {
  const { data, info } = await sharp(sourcePath)
    .extract({ left: 220, top: 105, width: 585, height: 585 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let index = 0; index < data.length; index += 4) {
    const distanceFromWhite = Math.max(
      255 - data[index],
      255 - data[index + 1],
      255 - data[index + 2],
    );
    const colourAlpha = Math.max(0, Math.min(255, (distanceFromWhite - 8) * 5));
    data[index + 3] = Math.round((data[index + 3] * colourAlpha) / 255);
  }

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .trim({ background: TRANSPARENT })
    .png()
    .toBuffer();
}

async function generateMonochromeIcon(source, outputPath) {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let index = 0; index < data.length; index += 4) {
    data[index] = 255;
    data[index + 1] = 255;
    data[index + 2] = 255;
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toFile(outputPath);
}

async function main() {
  // Full logo for Expo / iOS icon — keep ~20% padding so rounded masks do not clip text.
  await generatePaddedIcon(
    logoPath,
    path.join(assetsDir, 'icon.png'),
    1024,
    0.72,
    WHITE,
  );

  await generatePaddedIcon(
    logoPath,
    path.join(assetsDir, 'favicon.png'),
    192,
    0.72,
    WHITE,
  );

  await generateSplash(logoPath, path.join(assetsDir, 'splash-icon.png'));
  await generateSplash(logoDarkPath, path.join(assetsDir, 'splash-icon-dark.png'));

  // Android adaptive foreground uses emblem only, sized well inside the safe zone
  // (important content must sit in the center ~66% circle).
  const emblem = await extractEmblem(logoPath);
  await generatePaddedIcon(
    emblem,
    path.join(assetsDir, 'android-icon-foreground.png'),
    1024,
    0.48,
    TRANSPARENT,
  );

  const foreground = await sharp(path.join(assetsDir, 'android-icon-foreground.png'))
    .png()
    .toBuffer();
  await generateMonochromeIcon(
    foreground,
    path.join(assetsDir, 'android-icon-monochrome.png'),
  );

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: WHITE,
    },
  })
    .png()
    .toFile(path.join(assetsDir, 'android-icon-background.png'));

  console.log('Brand assets regenerated with safe-zone padding for phone home screens');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
