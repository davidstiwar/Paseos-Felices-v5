const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const input = path.join(__dirname, '..', 'public', 'img', 'gato.png');
const outDir = path.join(__dirname, '..', 'public', 'img');

if (!fs.existsSync(input)) {
  console.error('Archivo fuente no encontrado:', input);
  process.exit(1);
}

const sizes = [320, 480, 720, 1024];

async function build() {
  await Promise.all(sizes.map(async (w) => {
    const base = `gato-${w}`;
    const resized = sharp(input).resize({ width: w }).withMetadata();
    await resized.clone().avif({ quality: 60 }).toFile(path.join(outDir, `${base}.avif`));
    await resized.clone().webp({ quality: 80 }).toFile(path.join(outDir, `${base}.webp`));
    await resized.clone().png({ compressionLevel: 9 }).toFile(path.join(outDir, `${base}.png`));
    console.log('Generado:', `${base}.avif`, `${base}.webp`, `${base}.png`);
  }));
  console.log('Optimización completada. Archivos en:', outDir);
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
