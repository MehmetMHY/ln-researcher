## Notes On Setting Up Postgres For LN-researcher

## About:
- The ln-researcher/ project uses Postgres as it's database which needs some initial setup before it can work with the rest of the code.
- (10-22-2022) The goal is to automate this using a Dockerfile. But for now, refer to these notes.

## Initial Setup:
- Ideally, do all these steps/setups on a system that runs MacOS or Linux.
- Make sure Docker is installed:
    - https://docs.docker.com/engine/install/
    - (optional) https://www.docker.com/products/docker-desktop/
- (optional) Check out Postgres's Docker Hub page:
    - https://hub.docker.com/_/postgres
- I recommend using Docker Desktop for easily starting and ending the Postgres docker container.

## Setup and get running Postgres Database For LN-Researcher:
```
# pull offiical docker image for postgres:
docker pull postgres

# install, setup, and run postgres docker container:
docker run --name ln-researcher-db -e POSTGRES_PASSWORD=password -d -p 5432:5432 postgres

# list all running docker container (grab the CONTAINER ID):
docker ps

# exec into docker container though bash:
docker exec -it 678c1fcf608b bash            

# [inside container] go into postgres terminal
psql -U postgres

# [inside postgres] create a database called "data":
postgres=# CREATE DATABASE data;

# [inside postgres] exist postgres terminal:
postgres=# \q

# [inside container] go into postgres terminal for database "data":
root@678c1fcf608b:/# psql --username postgres --dbname data

# [inside "data" postgres] create table "images" for database "data":
data=# CREATE TABLE images( data JSONB );

# [inside "data" postgres] exist "data" postgres terminal:
data=# \q

# [inside container] exist docker container terminal:
root@678c1fcf608b:/# exit
```

## Disable/Turn-Off the Postgres Database For LN-Researcher:
```
# stop running docker container:
docker stop 678c1fcf608b
```
