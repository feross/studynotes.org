APP_SERVER = studynotes.org
DB_SERVER = athena.feross.net
APP_DIR = /home/feross/www/studynotes.org

.PHONY : update-deps
update-deps:
	git subtree pull --prefix lib/select2 git@github.com:ivaynberg/select2.git master --squash

.PHONY : download-db
download-db:
	rsync -a -O -v --exclude "sessions.bson" --exclude "sessions.metadata.json" -e "ssh -p 44444" feross@$(DB_SERVER):"/home/feross/backups/mongo/daily/studynotes/" tmp/db
	mongorestore --db studynotes --drop tmp/db
