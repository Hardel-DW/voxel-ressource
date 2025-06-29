# Voxel Resource Generator

Ce projet est un générateur d'atlas d'images et d'animations pour les ressources
Minecraft. Il traite automatiquement les images pour créer des atlas optimisés
et des animations GIF à partir de sprites.

## Vue d'ensemble

Le système prend des images depuis le dossier `assets/` et génère :

- **Atlas d'images** : Combine plusieurs images en une seule texture avec un
  fichier JSON de mapping
- **Animations GIF** : Crée des animations à partir de séquences d'images

## Structure des fichiers

```
src/
├── main.ts              # Point d'entrée principal
├── atlas.ts             # Génération d'atlas d'images
├── animation.ts         # Création d'animations GIF
└── utils/
    ├── conifg.ts        # Configuration globale
    ├── file.ts          # Utilitaires fichiers/dossiers
    └── images.ts        # Traitement d'images
```

## Configuration (`utils/conifg.ts`)

### Constantes de configuration

```typescript
export const COLOR = 256; // Nombre de couleurs pour la palette
export const EFFORT = 6; // Niveau d'effort pour l'optimisation PNG
export const DITHER = 0.0; // Niveau de dithering
export const QUALITY = 100; // Qualité de compression
export const COMPRESSION_LEVEL = 5; // Niveau de compression
export const FORCE = true; // Forcer le format de sortie
export const PALETTE = false; // Utiliser une palette de couleurs
export const ASSETS_PATH = "./assets"; // Chemin des ressources source
export const OUTPUT_PATH = "./output"; // Chemin de sortie
```

**Algorithme :**

1. Estime la largeur de l'atlas basée sur l'aire totale
2. Place les images ligne par ligne
3. Passe à la ligne suivante quand la largeur est dépassée
4. Crée le mapping JSON nom_fichier → position pour l'atlas.

**Format de sortie :**

```json
{
  "minecraft:nom_fichier": [x, y, width, height]
}
```

Traite et redimensionne les images pour l'atlas.

- Redimensionne à maximum 37x37 pixels
- Utilise l'algorithme "nearest" pour préserver les pixels
- Optimise la compression PNG
- Trie par hauteur décroissante pour l'algorithme de placement

## Génération d'atlas (`atlas.ts`)

Fonction principale pour générer un atlas complet.

1. Lit tous les fichiers du dossier source
2. Extrait les métadonnées des images
3. Traite et redimensionne les images
4. Calcule les positions optimales
5. Crée l'image atlas
6. Génère le fichier JSON de mapping
7. Sauvegarde les deux fichiers

## Génération d'animations (`animation.ts`)

Récupère et trie les fichiers d'images pour l'animation.

1. Lit toutes les images du dossier
2. Utilise la première image pour définir les dimensions
3. Configure l'encodeur GIF
4. Dessine chaque frame sur un canvas
5. Ajoute chaque frame à l'animation
6. Génère le fichier GIF final

**Atlas désactivés :**

- Entity atlas
- Mob effect atlas

## Structure des dossiers

```
assets/
├── items/           # Images individuelles des items
│   ├── sword.png
│   ├── pickaxe.png
│   └── ...
├── entity/          # Images des entités
├── mob_effect/      # Effets de statut
└── particle/        # Dossiers d'animations
    ├── explosion/   # Séquence d'images
    │   ├── explosion_0.png
    │   ├── explosion_1.png
    │   └── ...
    └── smoke/
        ├── smoke_0.png
        └── ...
```

## Sortie générée

```
output/
├── items/
│   ├── atlas.webp   # Atlas combiné des items
│   └── atlas.json   # Mapping des positions
└── particle/
    ├── explosion.gif
    ├── smoke.gif
    └── ...
```
