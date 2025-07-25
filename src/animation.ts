import fs from "node:fs/promises";
import { readdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import GIFEncoder from "gifencoder";
import { createWriteStream } from "fs-extra";

/**
 * Récupère la liste des fichiers d'image dans un répertoire
 * @param dirPath Chemin du répertoire
 * @returns Liste des chemins des fichiers d'image
 */
export function getImageFilesFromDirectory(dirPath: string): string[] {
    const supportedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"];

    return readdirSync(dirPath)
        .filter((file) => supportedExtensions.includes(path.extname(file).toLowerCase()))
        .sort((a, b) => {
            // Extract the numbers from the file names and sort them numerically
            const numA = Number.parseInt(a.match(/\d+/)?.[0] || "0", 10);
            const numB = Number.parseInt(b.match(/\d+/)?.[0] || "0", 10);
            return numA - numB;
        })
        .map((file) => path.join(dirPath, file));
}

/**
 * En typescript, je veux faire en sorte de prendre toutes les images d'un dossier. Et d'en faire une animation chaque images c'est une 1/20eme de seconde.
Utilise sharp, fait du clean code, split le plus possibles les choses.
La taille c'est la premiére image trouver.
Le format de sortie c'est gif.
    */
export async function createAnimationFromImages(dirPath: string, outputPath: string): Promise<void> {
    // Lazy load canvas only when needed
    const { createCanvas, loadImage } = await import("canvas");

    const files = getImageFilesFromDirectory(dirPath);
    if (files.length === 0) {
        throw new Error("No images found in the specified directory.");
    }

    const firstImage = files[0];
    const firstImageBuffer = await fs.readFile(firstImage);
    const firstImageMetadata = await sharp(firstImageBuffer).metadata();

    if (!firstImageMetadata.width || !firstImageMetadata.height) {
        throw new Error("Invalid image dimensions");
    }

    const canvas = createCanvas(firstImageMetadata.width, firstImageMetadata.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Failed to get canvas context");
    }

    const encoder = new GIFEncoder(firstImageMetadata.width, firstImageMetadata.height);
    encoder.createReadStream().pipe(createWriteStream(outputPath));

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(150);
    encoder.setTransparent(0x00000000);
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillRect(0, 0, firstImageMetadata.width, firstImageMetadata.height);

    for (const file of files) {
        const image = await loadImage(file);

        if (image.width === 0 || image.height === 0) {
            console.warn(`Skipping empty image: ${file}`);
            continue;
        }

        ctx.clearRect(0, 0, firstImageMetadata.width, firstImageMetadata.height);
        ctx.drawImage(image, 0, 0);
        encoder.addFrame(ctx as any);
    }

    encoder.finish();
}
