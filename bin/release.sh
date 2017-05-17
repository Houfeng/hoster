#!/bin/bash

set -e

#icns converter https://iconverticons.com/online/

node ./bin/release.js

PRJ_PATH=$PWD

#install deps
cd ./release/Hoster-darwin-x64/Hoster.app/Contents/Resources/app/
cnpm prune --production
cnpm i 
cnpm prune --production

#dmg dmgCanvas http://www.araelium.com/dmgcanvas/