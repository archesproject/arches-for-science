#!/bin/bash

# APP and YARN folder locations
# ${WEB_ROOT} and ${ARCHES_ROOT} is defined in the Dockerfile, ${ARCHES_PROJECT} in env_file.env
if [[ -z ${ARCHES_PROJECT} ]]; then
	APP_FOLDER=${ARCHES_ROOT}
	PACKAGE_JSON_FOLDER=${ARCHES_ROOT}
else
	APP_FOLDER=${WEB_ROOT}/${ARCHES_PROJECT}
	PACKAGE_JSON_FOLDER=${ARCHES_ROOT}
fi

YARN_MODULES_FOLDER=${PACKAGE_JSON_FOLDER}/$(awk \
	-F '--install.modules-folder' '{print $2}' ${PACKAGE_JSON_FOLDER}/.yarnrc \
	| awk '{print $1}' \
	| tr -d $'\r' \
	| tr -d '"' \
	| sed -e "s/^\.\///g")

# Environmental Variables
export DJANGO_PORT=${DJANGO_PORT:-8000}
COUCHDB_URL="http://$COUCHDB_USER:$COUCHDB_PASS@$COUCHDB_HOST:$COUCHDB_PORT"

#Utility functions that check db status
wait_for_db() {
	echo "Testing if database server is up..."
	while [[ ! ${return_code} == 0 ]]
	do
        psql --host=${PGHOST} --port=${PGPORT} --user=${PGUSERNAME} --dbname=postgres -c "select 1" >&/dev/null
		return_code=$?
		sleep 1
	done
	echo "Database server is up"

    echo "Testing if Elasticsearch is up..."
    while [[ ! ${return_code} == 0 ]]
    do
        curl -s "http://${ESHOST}:${ESPORT}/_cluster/health?wait_for_status=green&timeout=60s" >&/dev/null
        return_code=$?
        sleep 1
    done
    echo "Elasticsearch is up"
}

db_exists() {
	echo "Checking if database "${PGDBNAME}" exists..."
	count=`psql --host=${PGHOST} --port=${PGPORT} --user=${PGUSERNAME} --dbname=postgres -Atc "SELECT COUNT(*) FROM pg_catalog.pg_database WHERE datname='${PGDBNAME}'"`

	# Check if returned value is a number and not some error message
	re='^[0-9]+$'
	if ! [[ ${count} =~ $re ]] ; then
	   echo "Error: Something went wrong when checking if database "${PGDBNAME}" exists..." >&2;
	   echo "Exiting..."
	   exit 1
	fi

	# Return 0 (= true) if database exists
	if [[ ${count} > 0 ]]; then
		return 0
	else
		return 1
	fi
}

#### Install
init_arches() {
	echo "Checking if Arches project "${ARCHES_PROJECT}" exists..."
	if [[ ! -d ${APP_FOLDER} ]] || [[ ! "$(ls ${APP_FOLDER})" ]]; then
		echo ""
		echo "----- Custom Arches project '${ARCHES_PROJECT}' does not exist. -----"
		echo "----- Creating '${ARCHES_PROJECT}'... -----"
		echo ""

		cd ${WEB_ROOT}

		arches-project create ${ARCHES_PROJECT}
		run_setup_db
		setup_couchdb

		exit_code=$?
		if [[ ${exit_code} != 0 ]]; then
			echo "Something went wrong when creating your Arches project: ${ARCHES_PROJECT}."
			echo "Exiting..."
			exit ${exit_code}
		fi
	else
		echo "Custom Arches project '${ARCHES_PROJECT}' exists."
		wait_for_db
		if db_exists; then
			echo "Database ${PGDBNAME} already exists."
			echo "Skipping Package Loading"
		else
			echo "Database ${PGDBNAME} does not exists yet."
			run_load_package #change to run_load_package if preferred 
			setup_couchdb
		fi
	fi
}

# Setup Couchdb (when should this happen?)
setup_couchdb() {
    echo "Running: Creating couchdb system databases"
    curl -X PUT ${COUCHDB_URL}/_users
    curl -X PUT ${COUCHDB_URL}/_global_changes
    curl -X PUT ${COUCHDB_URL}/_replicator
}

# Yarn
install_yarn_components() {
	if [[ ! -d ${YARN_MODULES_FOLDER} ]] || [[ ! "$(ls ${YARN_MODULES_FOLDER})" ]]; then
		echo "Yarn modules do not exist, installing..."
		cd ${PACKAGE_JSON_FOLDER}
		yarn install
	fi
}

#### Misc
copy_settings_local() {
	# The settings_local.py in ${ARCHES_ROOT}/arches/ gets ignored if running manage.py from a custom Arches project instead of Arches core app
	echo "Copying ${APP_FOLDER}/docker/settings_docker.py to ${APP_FOLDER}/${ARCHES_PROJECT}/settings_docker.py..."
	cp ${APP_FOLDER}/docker/settings_docker.py ${APP_FOLDER}/${ARCHES_PROJECT}/settings_docker.py
	
	# Copy settings_local if it does not exist
	cp -n ${APP_FOLDER}/docker/settings_local.py ${APP_FOLDER}/${ARCHES_PROJECT}/settings_local.py
}

#### Run commands

start_celery_supervisor() {
	cd ${APP_FOLDER}
	supervisord -c docker/afs-supervisor.conf
}

run_migrations() {
	echo ""
	echo "----- RUNNING DATABASE MIGRATIONS -----"
	echo ""
	cd ${APP_FOLDER}
	python3 manage.py migrate
}

run_setup_db() {
	echo ""
	echo "----- RUNNING SETUP_DB -----"
	echo ""
	cd ${APP_FOLDER}
	python3 manage.py setup_db --force
}

run_load_package() {
	echo ""
	echo "----- *** LOADING PACKAGE: ${ARCHES_PROJECT} *** -----"
	echo ""
	cd ${APP_FOLDER}
	python3 manage.py packages -o load_package -s ${ARCHES_PROJECT}/pkg -db -dev -y
}

# "exec" means that it will finish building???
run_django_server() {
	echo ""
	echo "----- *** RUNNING DJANGO DEVELOPMENT SERVER *** -----"
	echo ""
	cd ${APP_FOLDER}
    echo "Running Django"
	exec sh -c "pip install debugpy -t /tmp && python3 /tmp/debugpy --listen 0.0.0.0:5678 manage.py runserver 0.0.0.0:${DJANGO_PORT}"
}

run_livereload_server() {
	echo ""
	echo "----- *** RUNNING LIVERELOAD SERVER *** -----"
	echo ""
	cd ${APP_FOLDER}
    echo "Running livereload"
    exec sh -c "python3 manage.py developer livereload --livereloadhost 0.0.0.0"
}

activate_virtualenv() {
	. ${WEB_ROOT}/ENV/bin/activate
}

#### Main commands
run_arches() {
	init_arches
	install_yarn_components
	run_django_server
}

#### Main commands
run_livereload() {
	run_livereload_server
}

### Starting point ###

# trying not to use virtualenv???
# activate_virtualenv

# Use -gt 1 to consume two arguments per pass in the loop
# (e.g. each argument has a corresponding value to go with it).
# Use -gt 0 to consume one or more arguments per pass in the loop
# (e.g. some arguments don't have a corresponding value to go with it, such as --help ).

# If no arguments are supplied, assume the server needs to be run
if [[ $#  -eq 0 ]]; then
	start_celery_supervisor
	wait_for_db
	run_arches
fi

# Else, process arguments
echo "Full command: $@"
while [[ $# -gt 0 ]]
do
	key="$1"
	echo "Command: ${key}"

	case ${key} in
		run_arches)
			start_celery_supervisor
			copy_settings_local
			wait_for_db
			run_arches
		;;
		run_livereload)
			run_livereload_server
		;;
		setup_arches)
			start_celery_supervisor
			copy_settings_local
			wait_for_db
			setup_arches
		;;
		run_tests)
			copy_settings_local
			wait_for_db
			run_tests
		;;
		run_migrations)
			copy_settings_local
			wait_for_db
			run_migrations
		;;
		install_yarn_components)
			install_yarn_components
		;;
		help|-h)
			display_help
		;;
		*)
            cd ${APP_FOLDER}
			"$@"
			exit 0
		;;
	esac
	shift # next argument or value
done
