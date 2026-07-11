import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'assets', 'images');

const logoPath = path.join(assetsDir, 'logo.png');
const logoDarkPath = path.join(assetsDir, 'logo-dark.png');

async function generateAppIcon(sourcePath, outputPath, size, background) {
  await sharp(sourcePath)
    .resize(size, size, {
      fit: 'cover',
      background,
    })
    .flatten({ background })
    .png()
    .toFile(outputPath);
}

async function generateSplash(sourcePath, outputPath) {
  await sharp(sourcePath)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outputPath);
}

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
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(640, 640, { fit: 'contain' })
    .extend({
      top: 192,
      bottom: 192,
      left: 192,
      right: 192,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
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
  await generateAppIcon(
    logoPath,
    path.join(assetsDir, 'icon.png'),
    1024,
    { r: 255, g: 255, b: 255, alpha: 1 },
  );

  await generateAppIcon(
    logoPath,
    path.join(assetsDir, 'favicon.png'),
    192,
    { r: 255, g: 255, b: 255, alpha: 1 },
  );

  await generateSplash(
    logoPath,
    path.join(assetsDir, 'splash-icon.png'),
  );

  await generateSplash(
    logoDarkPath,
    path.join(assetsDir, 'splash-icon-dark.png'),
  );

  const emblem = await extractEmblem(logoPath);
  await sharp(emblem).toFile(path.join(assetsDir, 'android-icon-foreground.png'));

  await generateMonochromeIcon(
    emblem,
    path.join(assetsDir, 'android-icon-monochrome.png'),
  );

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toFile(path.join(assetsDir, 'android-icon-background.png'));

  console.log('Brand assets regenerated from logo.png and logo-dark.png');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
