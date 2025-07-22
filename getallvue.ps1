# 1. KONFIGURACJA
# #############################################################################

# Nazwa pliku, w którym zostanie zapisany cały kod.
$plikWyjsciowy = "Zebrany_Kod_Projektu.txt"

# Rozszerzenia plików, które mają zostać uwzględnione w zbiorczym pliku.
# Możesz tu dodać lub usunąć rozszerzenia według potrzeb.
$uwzglednianeRozszerzenia = @(
    '.vue',
    '.js',
    '.css',
    '.html',
    '.json',
    'tailwind.config.js',
    'vite.config.js',
    'postcss.config.js'
)

# Nazwy katalogów, które mają zostać POMINIĘTE podczas skanowania.
$wykluczoneKatalogi = @('node_modules', 'dist', '.git', '.vscode', '.qodo')

# #############################################################################


# 2. GŁÓWNA LOGIKA SKRYPTU
# Pobranie ścieżki do bieżącego katalogu, w którym uruchomiono skrypt.
$katalogRoboczy = (Get-Location).Path

# Przygotowanie wyrażenia regularnego do wykluczania katalogów.
# To zapewnia, że ścieżki zawierające np. "/node_modules/" będą ignorowane.
$wzorzecWykluczenia = ($wykluczoneKatalogi | ForEach-Object { [System.Text.RegularExpressions.Regex]::Escape($_) }) -join '|'
$wzorzecWykluczenia = "([\\/])($wzorzecWykluczenia)([\\/]|$)"

Write-Host "Rozpoczynam skanowanie projektu w katalogu: $katalogRoboczy" -ForegroundColor Yellow

# Wyszukanie wszystkich pasujących plików.
$plikiDoZebrania = Get-ChildItem -Path $katalogRoboczy -Recurse -File | Where-Object {
    # Warunek 1: Sprawdź, czy nazwa pliku kończy się na jedno z uwzględnianych rozszerzeń/nazw.
    $pasujeRozszerzenie = $false
    foreach ($rozszerzenie in $uwzglednianeRozszerzenia) {
        if ($_.Name.EndsWith($rozszerzenie)) {
            $pasujeRozszerzenie = $true
            break
        }
    }

    # Warunek 2: Sprawdź, czy pełna ścieżka pliku NIE zawiera żadnego z wykluczonych katalogów.
    $pasujeRozszerzenie -and ($_.FullName -notmatch $wzorzecWykluczenia)
}

# Sprawdzenie, czy znaleziono jakiekolwiek pliki.
if ($null -eq $plikiDoZebrania) {
    Write-Host "Nie znaleziono zadnych plikow pasujacych do kryteriow." -ForegroundColor Red
    return
}

$sciezkaDoPlikuWyjsciowego = Join-Path -Path $katalogRoboczy -ChildPath $plikWyjsciowy

# Usunięcie starego pliku wyjściowego, jeśli istnieje.
if (Test-Path $sciezkaDoPlikuWyjsciowego) {
    Remove-Item $sciezkaDoPlikuWyjsciowego
}

Write-Host "Znaleziono $($plikiDoZebrania.Count) plikow. Zapisuje do '$plikWyjsciowy'..." -ForegroundColor Green

# Pętla przez wszystkie znalezione pliki i zapisywanie ich zawartości.
foreach ($plik in $plikiDoZebrania) {
    # Pobranie względnej ścieżki pliku dla lepszej czytelności w nagłówku.
    $sciezkaWzgledna = $plik.FullName.Substring($katalogRoboczy.Length + 1)

    # Utworzenie i zapisanie nagłówka dla każdego pliku.
    $naglowek = @"

================================================================================
### PLIK: $sciezkaWzgledna
================================================================================

"@
    Add-Content -Path $sciezkaDoPlikuWyjsciowego -Value $naglowek

    # Pobranie i zapisanie zawartości pliku.
    # Użycie -Raw przyspiesza operację i zachowuje oryginalne formatowanie (np. znaki nowej linii).
    Get-Content -Path $plik.FullName -Raw | Add-Content -Path $sciezkaDoPlikuWyjsciowego
}

Write-Host "Gotowe! Caly kod zostal zebrany w pliku: $sciezkaDoPlikuWyjsciowego" -ForegroundColor Cyan