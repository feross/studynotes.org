APP_SERVER = studynotes.org
APP_DIR = /home/feross/www/studynotes.org

.PHONY : default
default:
	ssh -L 27017:localhost:27017 -N feross@athena &
	DEBUG=studynotes nodemon index.js

# Upload secret.js to server
.PHONY : upload-secret
upload-secret:
	rsync -a -O -v -e "ssh -p 44444" secret.js feross@$(APP_SERVER):/home/feross/www/studynotes.org/

# Trigger a deploy (from remote CI server)
.PHONY : trigger
trigger:
	ssh feross@future.feross.net -p 44444 make -f /home/feross/www/studynotes.org/Makefile deploy

# Update code and restart server (from app server)
.PHONY : deploy
deploy:
	cd $(APP_DIR); git pull
	cd $(APP_DIR); npm rebuild
	sudo supervisorctl reload && sleep 3 && sudo supervisorctl restart studynotes: