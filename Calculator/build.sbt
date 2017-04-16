import Dependencies._

lazy val root = (project in file(".")).settings(
  inThisBuild(
    List(
      organization := "org.melvinwm",
      scalaVersion := "2.12.1",
      version := "0.1.0-SNAPSHOT"
    )),
  name := "Calculator",
  libraryDependencies ++= Seq(
    scalaParserCombinators,
    scalaz,
    specs2 % Test
  ),
  scalacOptions ++= Seq(
    "-Yrangepos",
    "-feature",
    "-unchecked",
    "-deprecation",
    "-Dscalac.patmat.analysisBudget=off",
    "-Xfatal-warnings",
    "-Xlint"
  )
)
