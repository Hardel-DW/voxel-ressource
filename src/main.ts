import { createAnimationFromImages } from "./animation";
import { generateAtlas } from "./atlas";
import { getSubdirectoriesFromDirectory } from "./utils/file";
import { ASSETS_PATH, ENABLE_ATLAS, ENABLE_ANIMATION, OUTPUT_PATH } from "./utils/config";

/**
 * Generate atlas for enabled types
 */
for (const atlasType of ENABLE_ATLAS) {
	generateAtlas(
		`${ASSETS_PATH}/${atlasType}`,
		`${OUTPUT_PATH}/${atlasType}/atlas.webp`,
		`${OUTPUT_PATH}/${atlasType}/data.json`,
	);
}

/**
 * Generate animations for enabled types
 */
for (const animationType of ENABLE_ANIMATION) {
	for (const subdirectory of getSubdirectoriesFromDirectory(`${ASSETS_PATH}/${animationType}`)) {
		createAnimationFromImages(
			`${ASSETS_PATH}/${animationType}/${subdirectory}`,
			`${OUTPUT_PATH}/${animationType}/${subdirectory}.gif`,
		);
	}
}
