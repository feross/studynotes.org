.PHONY : download-db
download-db:
	rsync -a -O -v --exclude "sessions.bson" --exclude "sessions.metadata.json" -e "ssh -p 44444" feross@athena.feross.net:"/home/feross/backups/mongo/daily/studynotes/" tmp/db
	mongorestore --db studynotes --drop tmp/db
