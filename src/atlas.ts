import * as fs from 'fs-extra';
import path from 'path';
import { getFilesFromDirectory } from './utils/file';
import { calculateImagePositions, createAtlasImage, createPositionsObject, getImagesMetadata, processImages } from './utils/images';

export type ImageMetadata = { width: number; height: number; file: string };
export type ImagePosition = [number, number, number, number];
export type AtlasData = { [key: string]: ImagePosition };

export async function generateAtlas(dirPath: string, outputImagePath: string, outputJsonPath: string): Promise<void> {
    try {
        // Créer le répertoire de sortie s'il n'existe pas
        await fs.ensureDir(path.dirname(outputImagePath));
        const imageFiles = await getFilesFromDirectory(dirPath);
        const metadata = await getImagesMetadata(imageFiles);
        const processedMetadata = await processImages(metadata);
        const positions = calculateImagePositions(processedMetadata);
        const imageBuffers = processedMetadata.map(img => img.buffer);
        const atlas = await createAtlasImage(imageBuffers, positions);
        await atlas.webp({ quality: 100 }).toFile(outputImagePath);
        const positionsObject = createPositionsObject(processedMetadata, positions);
        await fs.writeJson(outputJsonPath, positionsObject, { spaces: 2 });
        console.log('9. Atlas créé avec succès, pour:', dirPath);
    } catch (error) {
        console.error('Error generating atlas:', error);
    }
}
