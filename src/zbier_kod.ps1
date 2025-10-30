# 1. KONFIGURACJA
# #############################################################################

# Nazwa pliku, w którym zostanie zapisany cały kod.
$plikWyjsciowy = "frontend.txt"

# Rozszerzenia plików i konkretne nazwy plików, które mają zostać uwzględnione.
# Ta lista jest dostosowana do projektu Maven - pominięto pliki Gradle.
# Pliki .yml są ignorowane, zgodnie z wcześniejszą prośbą.
$uwzglednianeRozszerzenia = @(
    '.java',      # Pliki źródłowe Java
    '.kt',        # Pliki źródłowe Kotlin (jeśli używasz)
    '.xml',       # Pliki konfiguracyjne i budowania (np. pom.xml)
    '.properties',# Pliki właściwości (np. application.properties)
    '.sql',       # Skrypty SQL
    '.html',      # Pliki HTML (np. Thymeleaf)
    '.css',       # Arkusze stylów
    '.js',        # Skrypty JavaScript
    '.vue',
    '.ts'
)

# Nazwy katalogów, które mają zostać POMINIĘTE podczas skanowania.
# Usunięto katalogi specyficzne dla Gradle ('build', '.gradle').
$wykluczoneKatalogi = @(
    'target',     # Katalog budowania Maven
    '.mvn',       # Pliki wrappera Maven
    '.git',       # Repozytorium Git
    '.idea',      # Pliki IDE (IntelliJ)
    '.vscode'     # Pliki IDE (Visual Studio Code)
)

# #############################################################################


# 2. GŁÓWNA LOGIKA SKRYPTU (pozostaje bez zmian)
# Pobranie ścieżki do bieżącego katalogu, w którym uruchomiono skrypt.
$katalogRoboczy = (Get-Location).Path

# Przygotowanie wyrażenia regularnego do wykluczania katalogów.
$wzorzecWykluczenia = ($wykluczoneKatalogi | ForEach-Object { [System.Text.RegularExpressions.Regex]::Escape($_) }) -join '|'
$wzorzecWykluczenia = "([\\/])($wzorzecWykluczenia)([\\/]|$)"

Write-Host "Rozpoczynam skanowanie projektu Maven w katalogu: $katalogRoboczy" -ForegroundColor Yellow

# Wyszukanie wszystkich pasujących plików.
$plikiDoZebrania = Get-ChildItem -Path $katalogRoboczy -Recurse -File | Where-Object {
    $pasujeRozszerzenie = $false
    foreach ($rozszerzenie in $uwzglednianeRozszerzenia) {
        if ($_.Name.EndsWith($rozszerzenie)) {
            $pasujeRozszerzenie = $true
            break
        }
    }
    $pasujeRozszerzenie -and ($_.FullName -notmatch $wzorzecWykluczenia)
}

if ($null -eq $plikiDoZebrania) {
    Write-Host "Nie znaleziono zadnych plikow pasujacych do kryteriow." -ForegroundColor Red
    return
}

$sciezkaDoPlikuWyjsciowego = Join-Path -Path $katalogRoboczy -ChildPath $plikWyjsciowy

if (Test-Path $sciezkaDoPlikuWyjsciowego) {
    Remove-Item $sciezkaDoPlikuWyjsciowego
}

Write-Host "Znaleziono $($plikiDoZebrania.Count) plikow. Zapisuje do '$plikWyjsciowy'..." -ForegroundColor Green

foreach ($plik in $plikiDoZebrania) {
    $sciezkaWzgledna = $plik.FullName.Substring($katalogRoboczy.Length + 1)
    $naglowek = @"

================================================================================
### PLIK: $sciezkaWzgledna
================================================================================

"@
    Add-Content -Path $sciezkaDoPlikuWyjsciowego -Value $naglowek
    Get-Content -Path $plik.FullName -Raw | Add-Content -Path $sciezkaDoPlikuWyjsciowego
}

Write-Host "Gotowe! Caly kod zostal zebrany w pliku: $sciezkaDoPlikuWyjsciowego" -ForegroundColor Cyan