APP_DIR = /home/feross/www/studynotes.org

# Run the server in development mode
# (this is the default task if `make` is invoked without args)
.PHONY : default
default:
	ssh -L 27017:localhost:27017 -N feross@athena &
	nodemon .


# Run the server
.PHONY : run
run:
	node server.js


# Trigger a deploy
# (from remote CI server)
# Note: When updating this, manually "git pull" on the CI server so it will see the newest Makefile
.PHONY : trigger
trigger:
	ssh feross@future.feross.net -p 44444 make -f /home/feross/www/studynotes.org/Makefile deploy


# Update code and restart server
# (from app server)
.PHONY : deploy
deploy:
	cd $(APP_DIR); git pull
	cd $(APP_DIR); npm rebuild
	sudo supervisorctl restart studynotes: