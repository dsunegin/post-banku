#!/bin/sh

# Start at 8:05 am

pm2 delete post-bankua
pm2 start post-bankua.js --name post-bankua --cron "5 11 * * *"
pm2 save