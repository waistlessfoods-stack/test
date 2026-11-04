import { PNG } from 'pngjs';

export function signatureImage(blank = false) {
  const image = new PNG({ width: 300, height: 90 });
  image.data.fill(255);
  if (!blank) for (let x = 20; x < 280; x++) {
    const y = Math.round(45 + 20 * Math.sin(x / 17));
    for (let offset = 0; offset < 4; offset++) {
      const index = ((y + offset) * 300 + x) * 4;
      image.data[index] = 23; image.data[index + 1] = 61; image.data[index + 2] = 64;
    }
  }
  return `data:image/png;base64,${PNG.sync.write(image).toString('base64')}`;
}
