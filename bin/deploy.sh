#!/bin/sh
# Update code and restart server (run from app server)
set -e

if [ -d "/home/feross/www/studynotes.org-build" ]; then
  echo "ERROR: Build folder already exists. Is another build in progress?"
  exit 1
fi

cp -R /home/feross/www/studynotes.org /home/feross/www/studynotes.org-build

cd /home/feross/www/studynotes.org-build && git pull
cd /home/feross/www/studynotes.org-build && rm -rf node_modules
cd /home/feross/www/studynotes.org-build && npm install --quiet
cd /home/feross/www/studynotes.org-build && npm run build

sudo supervisorctl stop studynotes-site
sudo supervisorctl stop studynotes-liveupdater

cd /home/feross/www && rm -rf studynotes.org
cd /home/feross/www && mv studynotes.org-build studynotes.org

sudo supervisorctl start studynotes-site
sudo supervisorctl start studynotes-liveupdater

cd /home/feross/www/studynotes.org && ./bin/purge-maxcdn.js
