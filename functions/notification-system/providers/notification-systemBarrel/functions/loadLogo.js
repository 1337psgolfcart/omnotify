import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { clog, terminate } from '../../../../functionsBarrel/barrel.js';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadImage() {
    const imageFileLocation = '../../../../../customizations/logo.png';
    const filePath = path.join(__dirname, imageFileLocation);
    
    try {
        const imageBuffer = await fs.readFile(filePath);
        const imageCompressed = await sharp(imageBuffer).resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }}).png({ quality: 80, compressionLevel: 9}).toBuffer();
        const imageUncompressed = await sharp(imageBuffer).png({quality: 100, compressionLevel: 3}).toBuffer();
        const imageUncompressedBase64 = imageUncompressed.toString('base64');
        const imageCompressedBase64 = imageCompressed.toString('base64');

        const image = {
            compressed: {
                base64: imageCompressedBase64,
                plain: imageCompressed || '',
            },
            uncompressed: {
                base64: imageUncompressedBase64,
                plain: imageUncompressed || '',
            }
        }

        return Object.freeze(image);
    } catch (error) {
        clog.terminate(`Error loading Logo:| ${error.message}`);
        terminate(7);
    }
}

export const logo = await loadImage();
