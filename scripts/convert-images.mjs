/**
 * Converte todas as imagens PNG dos pratos para WebP.
 * Gera variantes em 3 tamanhos: 400px, 800px, 1200px.
 *
 * Uso:
 *   npm run convert-images
 *
 * Requer: npm install -D sharp
 */

import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const INPUT_DIR = join(__dirname, '../public/images/dishes');
const OUTPUT_DIR = join(__dirname, '../public/images/dishes');

const SIZES = [400, 800, 1200];
const QUALITY = 78;

async function convertImages() {
  const files = (await readdir(INPUT_DIR)).filter(f => extname(f).toLowerCase() === '.png');

  console.log(`Convertendo ${files.length} imagens PNG para WebP...\n`);

  let totalOriginalKB = 0;
  let totalOutputKB = 0;

  for (const file of files) {
    const name = basename(file, '.png');
    const inputPath = join(INPUT_DIR, file);

    for (const width of SIZES) {
      const outputFile = `${name}-${width}w.webp`;
      const outputPath = join(OUTPUT_DIR, outputFile);

      const { size: inputSize } = await sharp(inputPath).metadata().then(async () => {
        const { data, info } = await sharp(inputPath)
          .resize(width, null, { withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toBuffer({ resolveWithObject: true });

        await sharp(data).toFile(outputPath);
        return { size: data.length };
      });

      totalOutputKB += inputSize / 1024;

      const percent = ((inputSize / 1024) / 100).toFixed(0);
      console.log(`  ${outputFile} — ${(inputSize / 1024).toFixed(0)} KB`);
    }

    // Mede o original
    const { data: origData } = await sharp(inputPath).toBuffer({ resolveWithObject: true });
    totalOriginalKB += origData.length / 1024;
  }

  console.log(`\nOriginal total: ${(totalOriginalKB / 1024).toFixed(1)} MB`);
  console.log(`WebP total:     ${(totalOutputKB / 1024).toFixed(1)} MB`);
  console.log(`Redução:        ${(100 - (totalOutputKB / totalOriginalKB) * 100).toFixed(0)}%`);
  console.log('\nPronto! Atualize as referências de imagem para usar srcset com os arquivos -400w, -800w e -1200w.');
}

convertImages().catch(err => {
  console.error('Erro na conversão:', err.message);
  process.exit(1);
});
