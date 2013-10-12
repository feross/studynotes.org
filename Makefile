APP_SERVER = studynotes.org
DB_SERVER = athena.feross.net
APP_DIR = /home/feross/www/studynotes.org

.PHONY : default
default:
	ssh -L 27017:localhost:27017 -N feross@athena &
	node ./node_modules/nagger/index.js
	DEBUG="studynotes:*" nodemon run.js

.PHONY : offline
offline:
	mongod &
	DEBUG="studynotes:*" nodemon run.js --offline

.PHONY : init
init:
	npm install --quiet
	./node_modules/.bin/bower install --quiet

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

# Update code and restart server (from app server)
.PHONY : deploy
deploy:
	cd $(APP_DIR) && git pull
	cd $(APP_DIR) && make init
	sudo supervisorctl reload && sleep 3 && sudo supervisorctl restart studynotes-site && sudo supervisorctl restart studynotes-liveupdater
	cd $(APP_DIR) && sleep 20 && node lib/purge-netdna.js