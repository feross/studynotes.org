app_dir = /home/feross/www/studynotes.org

# Run the server in development mode
# (this is the default task if `make` is invoked without args)
all:
	ssh -L 27017:localhost:27017 -N feross@athena &
	nodemon --delay 0.4 server.js


# Run the server
run:
	coffee server.coffee


# Trigger a deploy
# (from remote CI server)
# Note: When updating this, manually "git pull" on the CI server so it will see the newest Makefile
trigger:
	ssh feross@future.feross.net -p 44444 make -f /home/feross/www/studynotes.org/Makefile deploy


# Update code and restart server
# (from app server)
deploy:
	cd $(app_dir); git pull
	cd $(app_dir); npm install
	sudo supervisorctl restart studynotes: