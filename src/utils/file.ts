import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Récupère la liste des fichiers dans un répertoire
 * @param dirPath  Chemin du répertoire
 * @returns  Liste des fichiers
 */
export async function getFilesFromDirectory(dirPath: string): Promise<string[]> {
    const files = await fs.readdir(dirPath);
    const imageFiles: string[] = [];

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
            imageFiles.push(filePath);
        }
    }

    return imageFiles;
}


/**
 * Get all subdirectories from a given directory.
 * @param dirPath The directory path to search.
 * @returns Array of subdirectory names.
 */
export function getSubdirectoriesFromDirectory(dirPath: string): string[] {
    return fs.readdirSync(dirPath)
        .filter(file => fs.statSync(path.join(dirPath, file)).isDirectory());
}