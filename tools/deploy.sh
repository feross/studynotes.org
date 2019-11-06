#!/bin/sh
# Update code and restart server (run on server)
set -e

if [ -d "/home/feross/www/build-studynotes.org" ]; then
  echo "ERROR: Build folder already exists. Is another build in progress?"
  exit 1
fi

if [ -d "/home/feross/www/old-studynotes.org" ]; then
  echo "ERROR: Old folder exists. Did a previous build crash?"
  exit 1
fi

cp -R /home/feross/www/studynotes.org /home/feross/www/build-studynotes.org

cd /home/feross/www/build-studynotes.org && git pull
cd /home/feross/www/build-studynotes.org && rm -rf node_modules
cd /home/feross/www/build-studynotes.org && npm install --no-progress
cd /home/feross/www/build-studynotes.org && npm run build
cd /home/feross/www/build-studynotes.org && npm prune --production --no-progress

sudo supervisorctl stop studynotes-site:
sudo supervisorctl stop studynotes-liveupdater

cd /home/feross/www && mv studynotes.org old-studynotes.org
cd /home/feross/www && mv build-studynotes.org studynotes.org

sudo supervisorctl start studynotes-site:
sudo supervisorctl start studynotes-liveupdater

cd /home/feross/www && rm -rf old-studynotes.org
