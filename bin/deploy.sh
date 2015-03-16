#!/bin/sh
# Update code and restart server (run from app server)
set -e
sudo supervisorctl reload
sleep 3
sudo supervisorctl stop studynotes-site
sudo supervisorctl stop studynotes-liveupdater
cd /home/feross/www/studynotes.org && git pull
cd /home/feross/www/studynotes.org && rm -rf node_modules
cd /home/feross/www/studynotes.org && npm install --quiet
cd /home/feross/www/studynotes.org && npm run build
sudo supervisorctl start studynotes-site
sudo supervisorctl start studynotes-liveupdater
