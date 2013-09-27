APP_SERVER = studynotes.org
APP_DIR = /home/feross/www/studynotes.org

.PHONY : default
default:
	ssh -L 27017:localhost:27017 -N feross@athena &
	node ./node_modules/nagger/index.js
	DEBUG="studynotes:*" nodemon index.js

.PHONY : offline
offline:
	mongod &
	DEBUG="studynotes:*" nodemon index.js --offline

# Upload secret.js to server
.PHONY : upload-secret
upload-secret:
	rsync -a -O -v -e "ssh -p 44444" secret.js feross@$(APP_SERVER):/home/feross/www/studynotes.org/

# Upload secret.js to server
.PHONY : download-secret
download-secret:
	rsync -a -O -v -e "ssh -p 44444" feross@$(APP_SERVER):"$(APP_DIR)/secret.js" .

# Trigger a deploy (from remote CI server)
.PHONY : trigger
trigger:
	ssh feross@future.feross.net -p 44444 make -f /home/feross/www/studynotes.org/Makefile deploy

# Update code and restart server (from app server)
.PHONY : deploy
deploy:
	cd $(APP_DIR) && git pull
	cd $(APP_DIR) && npm rebuild
	sudo supervisorctl reload && sleep 3 && sudo supervisorctl restart studynotes:
	cd $(APP_DIR) && sleep 20 && node purge-netdna.js