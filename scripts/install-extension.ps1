# Script PowerShell para instalar a extensão tag-validator

$sourcePath = Join-Path $PSScriptRoot "..\extensions\tag-validator-extension"
$userDataPath = [System.Environment]::GetFolderPath('ApplicationData')
$extensionsPath = Join-Path $userDataPath "MyIDE\extensions"
$destPath = Join-Path $extensionsPath "tag-validator-extension"

Write-Host "Instalando extensão..." -ForegroundColor Cyan
Write-Host "Origem: $sourcePath"
Write-Host "Destino: $destPath"

# Criar diretório se não existir
if (-not (Test-Path $extensionsPath)) {
    New-Item -ItemType Directory -Force -Path $extensionsPath | Out-Null
    Write-Host "Criado diretório: $extensionsPath" -ForegroundColor Green
}

# Verificar se a extensão existe
if (-not (Test-Path $sourcePath)) {
    Write-Host "❌ Extensão não encontrada em: $sourcePath" -ForegroundColor Red
    exit 1
}

# Remover destino se existir
if (Test-Path $destPath) {
    Remove-Item -Recurse -Force $destPath
    Write-Host "Removido instalação anterior" -ForegroundColor Yellow
}

# Copiar extensão (excluindo node_modules)
$items = Get-ChildItem -Path $sourcePath -Exclude node_modules
foreach ($item in $items) {
    $destItem = Join-Path $destPath $item.Name
    Copy-Item -Path $item.FullName -Destination $destItem -Recurse -Force
}

Write-Host "✅ Extensão instalada com sucesso em: $destPath" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Reinicie a IDE"
Write-Host "2. Abra o gerenciador de extensões (Activity Bar > Extensões)"
Write-Host "3. Verifique se a extensão está listada e ativa"

