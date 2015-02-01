#!/bin/sh
# Trigger a deploy (run from CI server)
set -e
ssh feross@future.feross.net -p 44444 /home/feross/www/studynotes.org/bin/deploy.sh
