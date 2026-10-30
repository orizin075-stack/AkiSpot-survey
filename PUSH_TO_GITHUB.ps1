# GitHub上で新規の「空の」AkiSpot専用リポジトリを作成してから実行。
# 既存リポジトリへの強制pushは行いません。
param(
 [Parameter(Mandatory=$true)]
 [string]$RepositoryUrl
)
$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
if (!(Test-Path 'index.html') -or !(Test-Path 'backend/Code.gs')) { throw 'AkiSpotのプロジェクトフォルダー内で実行してください。' }
if ($RepositoryUrl -notmatch '^https://github\.com/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+(?:\.git)?/?$') { throw 'https://github.com/ユーザー名/新規リポジトリ名 を指定してください。' }
if (Test-Path '.git') { throw '既にGitリポジトリがあります。既存リポジトリは上書きしません。' }
if (!(Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git for Windows をインストールしてください。' }
$remote=$RepositoryUrl.TrimEnd('/')
if (-not $remote.EndsWith('.git')) { $remote += '.git' }
& git init -b main
if ($LASTEXITCODE -ne 0) { throw 'git init に失敗しました。' }
& git add .
if ($LASTEXITCODE -ne 0) { throw 'git add に失敗しました。' }
& git commit -m 'Initial AkiSpot survey Pages and Apps Script release r9'
if ($LASTEXITCODE -ne 0) { throw 'git commit に失敗しました。Gitのユーザー名・メール設定を確認してください。' }
& git remote add origin $remote
if ($LASTEXITCODE -ne 0) { throw 'remote登録に失敗しました。' }
& git push -u origin main
if ($LASTEXITCODE -ne 0) { throw 'push に失敗しました。GitHub認証・空のリポジトリであること・権限を確認してください。' }
Write-Host 'GitHubへの送信が完了しました。次にSettings -> Pagesで main / (root) を選択してください。'
