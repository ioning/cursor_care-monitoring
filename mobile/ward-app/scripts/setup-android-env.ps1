# Скрипт для автоматической настройки Android окружения
# Проверяет наличие Java и Android SDK, настраивает переменные окружения

Write-Host "Проверка Android окружения..." -ForegroundColor Cyan
Write-Host ""

# Проверка Java
$javaFound = $false
$javaHome = $null

if ($env:JAVA_HOME) {
    $javaHome = $env:JAVA_HOME
    $javaFound = $true
    Write-Host "JAVA_HOME установлен: $javaHome" -ForegroundColor Green
} else {
    # Поиск Java в стандартных местах
    $paths = @()
    if ($env:ProgramFiles) { $paths += "$env:ProgramFiles\Java" }
    if (${env:ProgramFiles(x86)}) { $paths += "${env:ProgramFiles(x86)}\Java" }
    $paths += "$env:LOCALAPPDATA\Programs\Android\Android Studio\jbr"
    $paths += "$env:ProgramFiles\Android\Android Studio\jbr"
    $paths += "$env:ProgramFiles\Eclipse Adoptium"
    $paths += "$env:LOCALAPPDATA\Programs\Eclipse Adoptium"
    
    foreach ($basePath in $paths) {
        if (Test-Path $basePath) {
            $jdkDirs = Get-ChildItem -Path $basePath -Directory -Filter "*jdk*" -ErrorAction SilentlyContinue
            if ($jdkDirs) {
                $sorted = $jdkDirs | Sort-Object Name -Descending
                $javaHome = $sorted[0].FullName
                $javaFound = $true
                Write-Host "Java найден: $javaHome" -ForegroundColor Green
                break
            }
        }
    }
}

if (-not $javaFound) {
    Write-Host "Java не найден!" -ForegroundColor Red
    Write-Host "   Установите JDK 11 или выше:" -ForegroundColor Yellow
    Write-Host "   - Eclipse Adoptium: https://adoptium.net/" -ForegroundColor Yellow
    Write-Host "   - Oracle JDK: https://www.oracle.com/java/technologies/downloads/" -ForegroundColor Yellow
    Write-Host "   - Или установите Android Studio (включает JDK)" -ForegroundColor Yellow
    Write-Host ""
}

# Проверка Android SDK
$sdkFound = $false
$sdkPath = $null

if ($env:ANDROID_HOME) {
    $sdkPath = $env:ANDROID_HOME
    $sdkFound = $true
    Write-Host "ANDROID_HOME установлен: $sdkPath" -ForegroundColor Green
} elseif ($env:ANDROID_SDK_ROOT) {
    $sdkPath = $env:ANDROID_SDK_ROOT
    $sdkFound = $true
    Write-Host "ANDROID_SDK_ROOT установлен: $sdkPath" -ForegroundColor Green
} else {
    # Поиск Android SDK в стандартных местах
    $sdkPaths = @(
        "$env:LOCALAPPDATA\Android\Sdk",
        "$env:USERPROFILE\AppData\Local\Android\Sdk",
        "$env:ProgramFiles\Android\Android Studio\sdk"
    )
    if (${env:ProgramFiles(x86)}) {
        $sdkPaths += "${env:ProgramFiles(x86)}\Android\android-sdk"
    }
    
    foreach ($path in $sdkPaths) {
        if (Test-Path $path) {
            $sdkPath = $path
            $sdkFound = $true
            Write-Host "Android SDK найден: $sdkPath" -ForegroundColor Green
            break
        }
    }
}

if (-not $sdkFound) {
    Write-Host "Android SDK не найден!" -ForegroundColor Red
    Write-Host "   Установите Android Studio:" -ForegroundColor Yellow
    Write-Host "   https://developer.android.com/studio" -ForegroundColor Yellow
    Write-Host "   После установки SDK обычно находится в:" -ForegroundColor Yellow
    Write-Host "   $env:LOCALAPPDATA\Android\Sdk" -ForegroundColor Yellow
    Write-Host ""
}

# Создание local.properties
if ($sdkPath) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $projectRoot = Split-Path -Parent $scriptDir
    $localPropsPath = Join-Path $projectRoot "android\local.properties"
    $localPropsDir = Split-Path $localPropsPath -Parent
    
    if (-not (Test-Path $localPropsDir)) {
        New-Item -ItemType Directory -Path $localPropsDir -Force | Out-Null
    }
    
    $sdkDir = $sdkPath -replace '\\', '/'
    "sdk.dir=$sdkDir" | Out-File -FilePath $localPropsPath -Encoding ASCII -Force
    Write-Host "Создан файл local.properties" -ForegroundColor Green
    Write-Host ""
}

# Вывод инструкций
if ($javaFound -and $sdkFound) {
    Write-Host "Все компоненты найдены! Можно собирать APK." -ForegroundColor Green
    Write-Host ""
    Write-Host "Для сборки APK выполните:" -ForegroundColor Cyan
    Write-Host "  npm run build:android:debug    # Debug версия" -ForegroundColor White
    Write-Host "  npm run build:android          # Release версия (требует keystore)" -ForegroundColor White
} else {
    Write-Host "Не все компоненты установлены. Следуйте инструкциям выше." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "После установки компонентов:" -ForegroundColor Cyan
    Write-Host "1. Установите переменные окружения (опционально):" -ForegroundColor White
    if ($javaHome) {
        Write-Host "   setx JAVA_HOME `"$javaHome`"" -ForegroundColor Gray
    }
    if ($sdkPath) {
        Write-Host "   setx ANDROID_HOME `"$sdkPath`"" -ForegroundColor Gray
    }
    Write-Host "2. Перезапустите терминал" -ForegroundColor White
    Write-Host "3. Запустите этот скрипт снова для проверки" -ForegroundColor White
}

Write-Host ""
