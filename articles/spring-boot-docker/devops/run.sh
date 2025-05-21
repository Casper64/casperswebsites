#!/bin/bash

# stop any previously running containers
docker compose --env-file .env -f devops/compose.prod.yml down
# build the images
docker compose --env-file .env -f devops/compose.prod.yml build
# start the containers
docker compose --env-file .env -f devops/compose.prod.yml up -d