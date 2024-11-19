import sharp, { type Blend } from "sharp";
import type { AtlasData, ImageMetadata, ImagePosition } from "../atlas";
import path from "node:path";
import {
	COMPRESSION_LEVEL,
	FORCE,
	PALETTE,
	COLOR,
	EFFORT,
	DITHER,
	QUALITY,
} from "./conifg";

/**
 * Get the width and height of an image
 * @param imagePath Path to the image
 * @returns  Image width and height
 */
export async function getImagesMetadata(
	imageFiles: string[],
): Promise<ImageMetadata[]> {
	return Promise.all(
		imageFiles.map(async (file) => {
			const metadata = await sharp(file).metadata();
			if (!metadata.width || !metadata.height) {
				throw new Error(`Could not get dimensions for image: ${file}`);
			}
			return { width: metadata.width, height: metadata.height, file };
		}),
	);
}

/**
 * Calculate the positions of images in an atlas
 * @param imageMetadata  Array of image metadata (width and height)
 * @returns  Array of image positions (x, y, width, height)
 */
export function calculateImagePositions(
	metadata: ImageMetadata[],
): ImagePosition[] {
	const positions: ImagePosition[] = [];
	let atlasWidth = 0;
	let atlasHeight = 0;
	let currentX = 0;
	let currentY = 0;
	let rowHeight = 0;

	const totalArea = metadata.reduce(
		(sum, img) => sum + img.width * img.height,
		0,
	);
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
export async function createAtlasImage(
	imageBuffers: Buffer[],
	positions: ImagePosition[],
): Promise<sharp.Sharp> {
	const atlasWidth = Math.max(...positions.map((pos) => pos[0] + pos[2]));
	const atlasHeight = Math.max(...positions.map((pos) => pos[1] + pos[3]));

	const atlas = sharp({
		create: {
			width: atlasWidth,
			height: atlasHeight,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	});

	const composites = positions.map((pos, i) => ({
		input: imageBuffers[i],
		top: pos[1],
		left: pos[0],
		blend: "over" as Blend,
		premultiplied: true,
	}));

	return atlas.composite(composites).ensureAlpha().png({
		quality: QUALITY,
		force: FORCE,
		palette: PALETTE,
		colors: COLOR,
		effort: EFFORT,
		dither: DITHER,
		adaptiveFiltering: false,
		compressionLevel: 9,
	});
}
/**
 * Create an object with image file names as keys and their positions as values
 * @param metadata  Array of image metadata
 * @param positions  Array of image positions
 * @returns  Object with image file names as keys and their positions as values
 */
export function createPositionsObject(
	metadata: ImageMetadata[],
	positions: ImagePosition[],
): AtlasData {
	return metadata.reduce((acc, img, index) => {
		const fileName = path.basename(img.file, path.extname(img.file));
		acc[`minecraft:${fileName}`] = positions[index];
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
export async function processImages(
	metadata: ImageMetadata[],
): Promise<ProcessedImageMetadata[]> {
	const pngOptions = {
		quality: QUALITY,
		compressionLevel: COMPRESSION_LEVEL,
		force: FORCE,
		palette: PALETTE,
		colors: COLOR,
		effort: EFFORT,
		dither: DITHER,
	};

	const size = 37;

	const processedImages = await Promise.all(
		metadata.map(async (img) => {
			if (img.width > size || img.height > size) {
				const resizedBuffer = await sharp(img.file)
					.resize(size, size, {
						fit: "contain",
						withoutEnlargement: true,
						kernel: "nearest",
						position: "center",
						background: { r: 0, g: 0, b: 0, alpha: 0 },
					})
					.ensureAlpha()
					.png({
						...pngOptions,
						adaptiveFiltering: false,
						compressionLevel: 9,
					})
					.toBuffer();
				return {
					width: size,
					height: size,
					file: img.file,
					buffer: resizedBuffer,
				};
			}

			const originalBuffer = await sharp(img.file)
				.ensureAlpha()
				.png({
					...pngOptions,
					adaptiveFiltering: false,
					compressionLevel: 9,
				})
				.toBuffer();
			return {
				width: img.width,
				height: img.height,
				file: img.file,
				buffer: originalBuffer,
			};
		}),
	);

	return processedImages.sort((a, b) => b.height - a.height);
}
