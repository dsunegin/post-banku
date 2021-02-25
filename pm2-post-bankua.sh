#!/bin/sh

# Start at 7 am, 22 pm

pm2 delete post-bankua
pm2 start post-bankua.js --name post-bankua --cron "00 7,22 * * *"
pm2 save