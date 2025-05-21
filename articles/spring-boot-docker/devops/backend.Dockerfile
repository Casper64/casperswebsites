FROM maven:3.9-amazoncorretto-21-alpine AS build-stage

WORKDIR /app

# copy source files
COPY pom.xml ./
COPY src ./src

# build the jar
RUN mvn package spring-boot:repackage

FROM amazoncorretto:21-alpine-jdk AS production-stage

# copy the build jar
COPY --from=build-stage /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]