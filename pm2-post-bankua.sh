#!/bin/sh

# Start at 8:00 am

pm2 delete post-bankua
CRON="00 08 * * *" pm2 start post-bankua.js --name post-bankua
pm2 save