import { createAnimationFromImages } from './animation';
import { generateAtlas } from './atlas';
import { getSubdirectoriesFromDirectory } from './utils/file';

// generateAtlas('./items', './output/items/atlas.png', './output/items/atlas.json');
// generateAtlas('./entity', './output/entity/atlas.png', './output/entity/atlas.json');
generateAtlas('./mob_effect', './output/mob_effect/atlas.png', './output/mob_effect/atlas.json');

for (const particle of getSubdirectoriesFromDirectory('./particle')) {
    createAnimationFromImages(`./particle/${particle}`, `./output/particle/${particle}.gif`);
}