# Spring Boot Docker

A Spring Boot API as backend, PostgreSQL database, and Vite (Vue.js) frontend application containerized using docker compose.

This code was written for [this](https://casperswebsites.com/articles/dockerizing-spring-boot-application-with-database-and-vite-frontend) article.

## Usage

### Development

Install dependencies
```
cd backend && mvn install
cd ../frontend && npm install
```

Run the `BackendApplication` with spring boot (easiest via Intellij Idea).

Maven:
```
cd backend && mvn spring-boot:run
```

> **Note:** you might need to update the docker compose file location in `application.properties` to `../devops/compose.dev.yml`.
>
> `mvn -f backend/pom.xml` should work, but it doesn't for me.

Run the Vite dev server
```
cd frontend && npm run dev
```

### Production

Run the `devops/run.sh` file. This starts the docker compose services in prod mode.
```
chmod +x devops/run.sh && ./devops/run.sh
```