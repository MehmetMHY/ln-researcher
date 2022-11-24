FROM postgres

ENV POSTGRES_PASSWORD password
COPY config/dbConfig.sql /docker-entrypoint-initdb.d/
RUN chown -R postgres:postgres /docker-entrypoint-initdb.d/

RUN apt update -y
RUN apt install curl -y
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash
RUN apt-get install nodejs -y
RUN apt install vim -y
RUN apt install htop -y

RUN npm install --global yarn
RUN npm install --global near-cli
RUN npm install --global pino-pretty
RUN npm install --global nodemon

COPY . /opt/
WORKDIR /opt

RUN yarn
RUN yarn --cwd middlewares/smart_contract/contracts/

EXPOSE 3000

