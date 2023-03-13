FROM ubuntu:22.10 as base 
USER root

## Setting default environment variables
ENV WEB_ROOT=/web_root
ENV APP_ROOT=${WEB_ROOT}/afs
# Root project folder
ENV ARCHES_ROOT=${WEB_ROOT}/arches
ENV WHEELS=/wheels
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y make software-properties-common

# Get the pre-built python wheels from the build environment
RUN mkdir ${WEB_ROOT}

# Install packages required to run Arches
# Note that the ubuntu/debian package for libgdal1-dev pulls in libgdal1i, which is built
# with everything enabled, and so, it has a huge amount of dependancies (everything that GDAL
# support, directly and indirectly pulling in mysql-common, odbc, jp2, perl! ... )
# a minimised build of GDAL could remove several hundred MB from the container layer.
RUN set -ex \
  && RUN_DEPS=" \
  build-essential \
  python3.10-dev \
  mime-support \
  libgdal-dev \
  python3-venv \
  postgresql-client-12 \
  python3.10 \
  python3.10-distutils \
  python3.10-venv \
  dos2unix \
  git \
  " \
  && apt-get install -y --no-install-recommends curl \
  && curl -sL https://deb.nodesource.com/setup_16.x | bash - \
  && curl -sL https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
  && add-apt-repository "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -sc)-pgdg main" \
  && apt-get update -y \
  && apt-get install -y --no-install-recommends $RUN_DEPS

RUN apt install python3-pip -y \
  && apt-get install -y nodejs npm \
  && node -v \
  && npm install -g yarn

WORKDIR ${WEB_ROOT}

RUN rm -rf /root/.cache/pip/*

# Install the Arches application
# FIXME: ADD from github repository instead?
COPY ./arches ${ARCHES_ROOT}

# From here, run commands from ARCHES_ROOT
WORKDIR ${ARCHES_ROOT}

RUN pip install -e . --user --no-use-pep517 && pip install -r arches/install/requirements.txt && pip install -r arches/install/requirements_dev.txt

COPY /afs/afs/install/requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY /afs/docker/entrypoint.sh ${WEB_ROOT}/entrypoint.sh
RUN chmod -R 700 ${WEB_ROOT}/entrypoint.sh &&\
  dos2unix ${WEB_ROOT}/entrypoint.sh

RUN mkdir /var/log/supervisor
RUN mkdir /var/log/celery

RUN apt-get install -y unzip less vim && curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && ./aws/install

# Set default workdir
WORKDIR ${APP_ROOT}

# # Set entrypoint
ENTRYPOINT ["../entrypoint.sh"]
CMD ["run_arches"]

# Expose port 8000
EXPOSE 8000
