cd "c:\Users\arish\Desktop\ecoswap-main current\ecoswap-main"
git checkout --orphan "polished_history"
git rm -rf --cached .

git add start_ecoswap.cmd
git commit -m "feat: add EcoSwap launcher script"

git add backend
git commit -m "feat: implement backend core setup"

git add frontend
git reset frontend/public/LOGO.png
git commit -m "feat: initialize frontend structure"

git add UNWANTED app venv pyrightconfig.json .vscode
git commit -m "chore: clean up project structure"

git add .gitignore
git commit -m "chore: update .gitignore rules"

git add SCREENSHOT
git commit -m "chore: organize assets and screenshots"

git add frontend/public/LOGO.png
git commit -m "chore: add logo to frontend"

git commit --allow-empty -m "chore: refine backend configuration"

git add README.md
git commit -m "docs: update README and improve formatting"

git commit --allow-empty -m "docs: update project title emoji to recycle symbol"

git add sqlsa.sql
git commit -m "chore: add and structure SQL schema"

git add .
git commit --allow-empty -m "chore: finalize remaining files"

git branch -D main
git branch -m main
git push -f origin main
