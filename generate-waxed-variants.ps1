# Script pour dupliquer les images non-cirées (non-waxed) et créer les versions cirées (waxed) manquantes.

Write-Host "Génération des images 'waxed' manquantes..." -ForegroundColor Cyan

# Chemins
$assetsItemsPath = ".\assets\items"
$missingItemsFile = ".\missing-items.txt"

# Vérifier que les fichiers/dossiers existent
if (-not (Test-Path $missingItemsFile)) {
    Write-Host "Fichier missing-items.txt introuvable! Lancez d'abord le script de vérification." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $assetsItemsPath)) {
    Write-Host "Dossier assets/items introuvable!" -ForegroundColor Red
    exit 1
}

# Lire la liste des items manquants
$missingItems = Get-Content $missingItemsFile

# Filtrer pour ne garder que les items 'waxed'
$waxedItems = $missingItems | Where-Object { $_.StartsWith("waxed_") }

if ($waxedItems.Count -eq 0) {
    Write-Host "Aucune image 'waxed' manquante à générer." -ForegroundColor Green
    exit 0
}

Write-Host "$($waxedItems.Count) images 'waxed' à générer." -ForegroundColor Yellow

$createdCount = 0
$notFoundCount = 0

# Traiter chaque item 'waxed' manquant
foreach ($waxedItem in $waxedItems) {
    # Déduire le nom de l'item source (non-waxed)
    $sourceItem = $waxedItem.Substring(6) # Enlève "waxed_"
    
    $sourcePath = Join-Path $assetsItemsPath "$sourceItem.webp"
    $destPath = Join-Path $assetsItemsPath "$waxedItem.webp"
    
    if (Test-Path $sourcePath) {
        if (-not (Test-Path $destPath)) {
            try {
                Copy-Item -Path $sourcePath -Destination $destPath -ErrorAction Stop
                Write-Host "   [CREE] '$($waxedItem).webp' a partir de '$($sourceItem).webp'" -ForegroundColor Green
                $createdCount++
            }
            catch {
                Write-Host "   [ERREUR] Impossible de copier '$sourcePath' vers '$destPath': $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        else {
            Write-Host "   [EXISTE DEJA] '$($destPath)'" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "   [SOURCE INTROUVABLE] L'image de base '$($sourceItem).webp' n'existe pas." -ForegroundColor Red
        $notFoundCount++
    }
}

Write-Host "`nRESULTATS:" -ForegroundColor Magenta
Write-Host "   Images 'waxed' créées : $createdCount" -ForegroundColor Cyan
if ($notFoundCount -gt 0) {
    Write-Host "   Sources non trouvées : $notFoundCount" -ForegroundColor Red
}

Write-Host "`nGénération terminée!" -ForegroundColor Cyan 