app_dir = /home/feross/www/studynotes.org

deploy:
	cd $(app_dir)
	git pull
	sudo supervisorctl restart studynotes: