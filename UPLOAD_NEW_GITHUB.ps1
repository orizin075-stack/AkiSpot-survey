# AkiSpot r9.1: create a NEW, public GitHub repository and publish its static files.
# Run only inside this extracted project folder, in Windows PowerShell 5.1+ or PowerShell 7+.
# Requirements: Git for Windows, GitHub CLI (gh), authenticated GitHub account.
# Does NOT configure the Google Apps Script submission URL; survey submission remains disabled until configured.

param([string]$RepositoryName = 'AkiSpot-survey')
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Test-Path 'index.html') -or -not (Test-Path 'backend/Code.gs') -or -not (Test-Path 'config.js')) {
  throw 'ZIPを展開し、そのフォルダー内のUPLOAD_NEW_GITHUB.ps1を実行してください。'
}
if ($RepositoryName -notmatch '^[A-Za-z0-9_.-]+$') { throw 'リポジトリ名が不正です。' }
foreach ($command in @('gh', 'git')) {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
    throw "$command が見つかりません。先にGitHub CLIとGit for Windowsをインストールしてください。"
  }
}
& gh auth status -h github.com
if ($LASTEXITCODE -ne 0) { throw 'GitHub CLIにログインしてください: gh auth login' }
$login = (& gh api user --jq '.login').Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($login)) { throw 'GitHubログインを確認できません。' }
if ($login -ne 'orizin075-stack') {
  throw "想定と異なるGitHubアカウントです: $login（想定: orizin075-stack）。別アカウントへの誤公開を防ぐため停止しました。"
}
$full = "$login/$RepositoryName"
& gh repo view $full --json name --jq '.name' 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) { throw "既に $full が存在します。既存の内容を上書きしないため停止しました。" }
if (Test-Path '.git') { throw '既に.gitフォルダーがあります。誤上書きを防ぐため停止しました。' }
if ($null -eq (git config user.name) -or $null -eq (git config user.email)) {
  throw 'Gitのユーザー名とメールが未設定です。git config --global user.name と git config --global user.email を設定してください。'
}
Write-Host "新しい公開リポジトリを作成します: $full" -ForegroundColor Cyan
& git init -b main
if ($LASTEXITCODE -ne 0) { throw 'git init に失敗しました。' }
& git add .
if ($LASTEXITCODE -ne 0) { throw 'git add に失敗しました。' }
& git commit -m 'Initial AkiSpot survey Pages release r9.1'
if ($LASTEXITCODE -ne 0) { throw 'git commit に失敗しました。' }
& gh repo create $full --public --source . --remote origin --push --description 'AkiSpot university research survey (GitHub Pages frontend, Apps Script backend)'
if ($LASTEXITCODE -ne 0) { throw 'リポジトリ作成またはアップロードに失敗しました。GitHub上の状態を確認してください。' }
$repoUrl = (& gh repo view $full --json url --jq '.url').Trim()
Write-Host "GitHubへのアップロード完了: $repoUrl" -ForegroundColor Green
Write-Host 'GitHub Pagesを有効にします。'
& gh api -X POST "repos/$full/pages" -f 'source[branch]=main' -f 'source[path]=/' 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Warning 'Pagesの自動設定は完了しませんでした。GitHubのSettings > Pagesでmain / (root)を指定してください。'
} else {
  $siteUrl = (& gh api "repos/$full/pages" --jq '.html_url').Trim()
  if ($LASTEXITCODE -eq 0 -and $siteUrl) { Write-Host "Pagesサイト: $siteUrl" -ForegroundColor Green }
}
Write-Warning 'まだ回答を収集できません。先にGoogle Apps Scriptを設定し、config.jsのAKISPOT_SUBMISSION_URLを更新・pushしてください。'
Write-Warning '実際の回答送信と管理シートの反映を確認するまで、回答者にURLを配布しないでください。'
