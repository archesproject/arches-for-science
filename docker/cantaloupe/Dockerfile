FROM uclalibrary/cantaloupe:5.0.3-0 as base 
USER root

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install

# Wrap things up with the entrypoint and command that the container runs
WORKDIR /home/cantaloupe
ENTRYPOINT [ "docker-entrypoint.sh" ]
CMD [ "sh", "-c", "exec /usr/local/bin/run_cantaloupe.sh" ]