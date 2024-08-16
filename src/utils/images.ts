import sharp from 'sharp';
import { AtlasData, ImageMetadata, ImagePosition } from '../atlas';
import path from 'path';

/**
 * Get the width and height of an image
 * @param imagePath Path to the image
 * @returns  Image width and height
 */
export async function getImagesMetadata(imageFiles: string[]): Promise<ImageMetadata[]> {
    return Promise.all(imageFiles.map(async file => {
        const { width, height } = await sharp(file).metadata();
        return { width: width!, height: height!, file };
    }));
}

/**
 * Calculate the positions of images in an atlas
 * @param imageMetadata  Array of image metadata (width and height)
 * @returns  Array of image positions (x, y, width, height)
 */
export function calculateImagePositions(metadata: ImageMetadata[]): ImagePosition[] {
    const positions: ImagePosition[] = [];
    let atlasWidth = 0;
    let atlasHeight = 0;
    let currentX = 0;
    let currentY = 0;
    let rowHeight = 0;

    const totalArea = metadata.reduce((sum, img) => sum + img.width * img.height, 0);
    const estimatedWidth = Math.ceil(Math.sqrt(totalArea));

    for (const image of metadata) {
        if (currentX + image.width > estimatedWidth) {
            currentX = 0;
            currentY += rowHeight;
            rowHeight = 0;
        }

        positions.push([currentX, currentY, image.width, image.height]);

        currentX += image.width;
        rowHeight = Math.max(rowHeight, image.height);
        atlasWidth = Math.max(atlasWidth, currentX);
        atlasHeight = Math.max(atlasHeight, currentY + rowHeight);
    }

    console.log(`Taille de l'atlas : ${atlasWidth}x${atlasHeight}`);
    return positions;
}

/**
 * Create an atlas image from a list of image files and their positions
 * @param imageFiles  Array of image file paths
 * @param positions  Array of image positions (x, y)
 * @returns  Sharp object representing the atlas image
 */
export async function createAtlasImage(imageBuffers: Buffer[], positions: ImagePosition[]): Promise<sharp.Sharp> {
    const atlasWidth = Math.max(...positions.map(pos => pos[0] + pos[2]));
    const atlasHeight = Math.max(...positions.map(pos => pos[1] + pos[3]));

    const atlas = sharp({
        create: {
            width: atlasWidth,
            height: atlasHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    });

    const composites = positions.map((pos, i) => {
        const [x, y] = pos;
        return { input: imageBuffers[i], top: y, left: x };
    });

    return atlas.composite(composites);
}
/**
 * Create an object with image file names as keys and their positions as values
 * @param metadata  Array of image metadata
 * @param positions  Array of image positions
 * @returns  Object with image file names as keys and their positions as values
 */
export function createPositionsObject(metadata: ImageMetadata[], positions: ImagePosition[]): AtlasData {
    return metadata.reduce((acc, img, index) => {
        const fileName = path.basename(img.file, path.extname(img.file));
        acc[fileName] = positions[index];
        return acc;
    }, {} as AtlasData);
}

export interface ProcessedImageMetadata {
    width: number;
    height: number;
    file: string;
    buffer: Buffer;
}

/**
 * Resize images to a maximum size of 128x128
 * @param metadata  Array of image metadata
 * @returns  Array of resized image metadata
 */
export async function processImages(metadata: ImageMetadata[]): Promise<ProcessedImageMetadata[]> {
    // Traiter chaque image pour redimensionner si nécessaire
    const processedImages = await Promise.all(metadata.map(async img => {
        let newWidth = img.width;
        let newHeight = img.height;

        // Redimensionner l'image pour qu'elle ne dépasse pas 128x128
        while (newWidth > 128 && newHeight > 128) {
            newWidth = Math.floor(newWidth / 2);
            newHeight = Math.floor(newHeight / 2);
        }

        // Si les dimensions ont changé, redimensionner l'image et créer un buffer
        if (newWidth !== img.width || newHeight !== img.height) {
            const resizedBuffer = await sharp(img.file)
                .resize(newWidth, newHeight)
                .toBuffer();

            return { width: newWidth, height: newHeight, file: img.file, buffer: resizedBuffer };
        }

        // Sinon, créer un buffer à partir de l'image originale
        const originalBuffer = await sharp(img.file).toBuffer();

        return { width: img.width, height: img.height, file: img.file, buffer: originalBuffer };
    }));

    // Trier les images traitées par hauteur (en ordre décroissant)
    return processedImages.sort((a, b) => b.height - a.height);
}