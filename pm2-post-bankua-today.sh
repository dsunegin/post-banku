#!/bin/sh

# Start at 8 am

pm2 delete post-bankua-today
PERIOD=today pm2 start post-bankua.js --name post-bankua-today --cron "00 8 * * *"
pm2 save