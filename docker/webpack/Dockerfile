FROM ubuntu:20.04 as base 
USER root
ENV WEB_ROOT=/web_root
ENV ARCHES_ROOT=${WEB_ROOT}/arches
ENV APP_ROOT=${WEB_ROOT}/afs
RUN mkdir -p ${APP_ROOT}/arches_for_science/webpack

RUN apt-get update && apt-get install -y make software-properties-common
RUN set -ex \
  && apt-get update -y \
  && RUN_DEPS=" \
  build-essential \
  python3.8-dev \
  mime-support \
  libgdal-dev \
  python3-venv \
  python3.8 \
  python3.8-distutils \
  python3.8-venv \
  dos2unix \
  git \
  " \
  && apt-get install -y --no-install-recommends curl \
  && apt-get install -y --no-install-recommends $RUN_DEPS \
  && curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py \
  && apt install python3-pip -y

COPY ./arches ${ARCHES_ROOT}
RUN apt-get update && apt-get -y install curl \
  && curl -sL https://deb.nodesource.com/setup_16.x | bash - \
  && apt-get install nodejs && npm install -g yarn && apt install wait-for-it
WORKDIR ${ARCHES_ROOT}
RUN pip install -e . --user --no-use-pep517  
RUN pip install -r arches/install/requirements.txt 
RUN pip install -r arches/install/requirements_dev.txt
COPY /afs/docker/webpack/entrypoint.sh ${WEB_ROOT}/entrypoint.sh
RUN chmod -R 700 ${WEB_ROOT}/entrypoint.sh
WORKDIR ${WEB_ROOT}
ENTRYPOINT [ "./entrypoint.sh" ]
CMD ["run_webpack"]
EXPOSE 8021
