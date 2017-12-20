
# About

Variant of a circle-fractal drawing program, written in the Java
programming language and using the JavaFX GUI framework.

# Requirements

- Java 8 or later.
- JRE that supports JavaFX, for instance Oracle's JRE.

# Building and running

Building:

    mvn clean verify

Generating documentation and running FindBugs:

    mvn site

Running:

    mvn exec:java

Running the generated JAR-file:

    java -Dlog4j.configurationFile=basic_jar_log_configuration.txt -jar target/circle-fractal-javafx-1.0-SNAPSHOT.jar

