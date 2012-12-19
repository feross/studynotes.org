app_dir = /home/feross/www/studynotes.org

# Trigger a deploy
# (from remote CI server)
# Note: When updating this, manually "git pull" on the CI server so it will see the newest Makefile
trigger:
	ssh feross@future.feross.net -p 44444 make -f /home/feross/www/studynotes.org/Makefile deploy

# Update code and restart server
# (from app server)
deploy:
	cd $(app_dir); rm -rf builtAssets
	cd $(app_dir); git pull
	sudo supervisorctl restart studynotes: