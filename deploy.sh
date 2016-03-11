#!/bin/bash
set -e

./build.sh

cd docs

git init

git add .
git commit -m "Deploy to GitHub Pages"

echo '[credential]' >> .git/config
echo '  helper = store' >> .git/config

git push --force --quiet https://github.com/zlsa/indoc.git master:gh-pages #> /dev/null 2>&1
