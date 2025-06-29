param(
    [switch]$Clean
)

# Script pour verifier les images manquantes dans assets/items
# Compare data.json avec les fichiers presents dans assets/items

Write-Host "Verification des images manquantes..." -ForegroundColor Cyan

# Chemins
$dataJsonPath = ".\data.json"
$assetsItemsPath = ".\assets\items"

# Verifier que les fichiers/dossiers existent
if (-not (Test-Path $dataJsonPath)) {
    Write-Host "Fichier data.json introuvable!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $assetsItemsPath)) {
    Write-Host "Dossier assets/items introuvable!" -ForegroundColor Red
    exit 1
}

# Lire data.json
try {
    $jsonContent = Get-Content $dataJsonPath -Raw | ConvertFrom-Json
    Write-Host "data.json lu avec succes ($($jsonContent.Count) items)" -ForegroundColor Green
}
catch {
    Write-Host "Erreur lors de la lecture de data.json: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Obtenir la liste des fichiers dans assets/items
$existingFiles = Get-ChildItem $assetsItemsPath -Filter "*.webp" | ForEach-Object { $_.BaseName }

Write-Host "$($existingFiles.Count) fichiers .webp trouves dans assets/items" -ForegroundColor Yellow

# Variables pour le comptage
$missingItems = @()
$foundItems = 0

# Verifier chaque item de data.json
foreach ($item in $jsonContent) {    
    if ($existingFiles -contains $item) {
        $foundItems++
    }
    else {
        $missingItems += $item
    }
}

# Afficher les resultats
Write-Host "`nRESULTATS:" -ForegroundColor Magenta
Write-Host "   Images trouvees: $foundItems / $($jsonContent.Count)" -ForegroundColor Green
Write-Host "   Images manquantes: $($missingItems.Count)" -ForegroundColor Red

if ($missingItems.Count -gt 0) {
    Write-Host "`nIMAGES MANQUANTES:" -ForegroundColor Red
    
    # Grouper par ordre alphabetique pour faciliter la lecture
    $missingItems | Sort-Object | ForEach-Object {
        Write-Host "   - $_.webp" -ForegroundColor Gray
    }
    
    # Sauvegarder la liste dans un fichier
    $missingItems | Sort-Object | Out-File "missing-items.txt" -Encoding UTF8
    Write-Host "`nListe sauvegardee dans missing-items.txt" -ForegroundColor Yellow
}
else {
    Write-Host "`nToutes les images sont presentes!" -ForegroundColor Green
}

# Optionnel: Chercher des fichiers extra (presents dans assets mais pas dans data.json)
$extraFiles = $existingFiles | Where-Object { $_ -notin $jsonContent }

if ($extraFiles.Count -gt 0) {
    Write-Host "`nFICHIERS EXTRA (presents dans assets mais pas dans data.json):" -ForegroundColor Yellow
    $extraFiles | Sort-Object | ForEach-Object {
        Write-Host "   + $_.webp" -ForegroundColor Gray
    }

    if ($Clean) {
        Write-Host "`nNettoyage des fichiers extra active..." -ForegroundColor Magenta
        $deletedCount = 0
        foreach ($file in $extraFiles) {
            $filePath = Join-Path $assetsItemsPath "$file.webp"
            if (Test-Path $filePath) {
                try {
                    Remove-Item $filePath -Force -ErrorAction Stop
                    Write-Host "   - Fichier supprime : $filePath" -ForegroundColor Gray
                    $deletedCount++
                }
                catch {
                    Write-Host "   - ERREUR lors de la suppression de $filePath : $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        Write-Host "`n$deletedCount fichiers extra ont ete supprimes." -ForegroundColor Cyan
    }
    else {
        Write-Host "`nPour supprimer ces $($extraFiles.Count) fichiers, relancez le script avec le parametre -Clean." -ForegroundColor Yellow
    }
}

Write-Host "`nVerification terminee!" -ForegroundColor Cyan 