#! /bin/bash

APP_FOLDER=${WEB_ROOT}/${ARCHES_PROJECT}
run_webpack() {
	echo ""
	echo "----- *** RUNNING WEBPACK DEVELOPMENT SERVER *** -----"
	echo ""
	cd ${APP_FOLDER}
    echo "Running Webpack"
	exec sh -c "cd /web_root/afs/afs && yarn install && wait-for-it afs7-2:8000 -t 1200 && yarn start"
}

run_webpack