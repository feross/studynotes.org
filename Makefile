APP_SERVER = studynotes.org
DB_SERVER = athena.feross.net
APP_DIR = /home/feross/www/studynotes.org

.PHONY : update-deps
update-deps:
	git subtree pull --prefix lib/select2 git@github.com:ivaynberg/select2.git master --squash

.PHONY : upload-secret
upload-secret:
	rsync -a -O -v -e "ssh -p 44444" secret.js feross@$(APP_SERVER):/home/feross/www/studynotes.org/

.PHONY : download-secret
download-secret:
	rsync -a -O -v -e "ssh -p 44444" feross@$(APP_SERVER):"$(APP_DIR)/secret.js" .

.PHONY : download-db
download-db:
	rsync -a -O -v --exclude "sessions.bson" --exclude "sessions.metadata.json" -e "ssh -p 44444" feross@$(DB_SERVER):"/home/feross/backups/mongo/daily/studynotes/" tmp/db
	mongorestore --db studynotes --drop tmp/db

# Trigger a deploy (from remote CI server)
.PHONY : trigger
trigger:
	ssh feross@future.feross.net -p 44444 make -f /home/feross/www/studynotes.org/Makefile deploy

.PHONY : install-linux-deps
install-linux-deps:
	sudo aptitude update
	sudo aptitude install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++

.PHONY : install-osx-deps
install-osx-deps:
	brew update
	brew install cairo pixman
	# Also, ensure "export PKG_CONFIG_PATH=/opt/X11/lib/pkgconfig" is in .zshrc
	# See issue: https://github.com/Homebrew/homebrew/issues/14123

# Update code and restart server (from app server)
.PHONY : deploy
deploy:
	cd $(APP_DIR) && git pull
	cd $(APP_DIR) && npm update --quiet
	cd $(APP_DIR) && npm run build
	sudo supervisorctl reload && sleep 3 && sudo supervisorctl restart studynotes-site && sudo supervisorctl restart studynotes-liveupdater
	cd $(APP_DIR) && sleep 10 && node bin/purge-netdna.js