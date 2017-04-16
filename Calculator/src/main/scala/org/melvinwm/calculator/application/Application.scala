package org.melvinwm.calculator.application

import scala.annotation.tailrec
import scala.util.{Try, Success, Failure}

import scalaz.{\/, \/-, -\/}

import java.io.Closeable
import java.io.Reader
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.PrintWriter
import java.io.OutputStreamWriter

import org.melvinwm.calculator.parsing.ExpressionParsers
import org.melvinwm.calculator.evaluation.Interpreters

object Application {

  val errorHeaderString = "Error"

  private[this] val endingCharacter: Char = {

    require(ExpressionParsers.endingString.length == 1)

    ExpressionParsers.endingString.head
  }

  def main(args: Array[String]) = {
    println("Starting.")

    // Note: Do not close the specific streams since we do not own them.
    repl(new BufferedReader(new InputStreamReader(System.in)),
         new PrintWriter(System.out))

    println("Ending.")
  }

  /*
   * Note: This way of doing a REPL is not so nice in regards to testing -
   * sending and receiving strings requires parsing, and there is blocking
   * involved as well (since the REPL will block on the input reader).
   * A possible alternative that might enable testing could be something like
   * IOAction, as seen in Haskell ("IO") or scalaz, since representing the
   * different IO actions as data instead of performing them directly (leaving
   * the actual IO effect up to the caller) could be much more amenable to
   * testing.
   */
  private[application] def repl(inputReader: BufferedReader,
                                outputWriter: PrintWriter): Unit = {

    def replPrint(str: String) = {
      outputWriter.println()
      outputWriter.println(s"$str")
      outputWriter.flush()
    }

    def replPrintPrompt() = {
      outputWriter.println()
      outputWriter.print(">>> ")
      outputWriter.flush()
    }

    val parser = ExpressionParsers.default
    val interpreter = Interpreters.default

    @tailrec
    def loop(currentInputLines: Vector[String]): Unit = {

      // Read in from input as long as the input line does not contain the ending character.

      val currentLineO = Option(inputReader.readLine())

      currentLineO match {
        case Some(line) => {
          if (line.contains(":quit")) {
            replPrint("Got the quit command, ending.")
          } else if (line.contains(endingCharacter.toString)) {

            // Parse the input as an arithmetic expression,
            // evaluate and print the result (or parsing error).

            // NOTE: Ignoring everything after the ending character.

            val preparedLine = line.takeWhile(_ != endingCharacter) + endingCharacter

            val input =
              (currentInputLines :+ preparedLine).reduce(_ + "\n" + _)

            parser.parse(input) match {
              case \/-(expression) => {

                val result = interpreter.evaluate(expression)

                result match {
                  case Success(value) => {

                    replPrint(value.toString)
                    replPrintPrompt()
                  }
                  case Failure(exception) => {

                    exception match {
                      case e: ArithmeticException => {
                        replPrint(s"$errorHeaderString: ${e.getMessage}.")
                        replPrintPrompt()
                      }
                      case e => throw e
                    }
                  }
                }
              }
              case -\/(error) => {

                val pos = error.errorPointInformation.position

                replPrint(
                  s"$errorHeaderString: ${error.errorMessage} at line ${pos.line}, column ${pos.column}:")
                replPrintPrompt()
              }
            }

            loop(Vector.empty)
          } else {
            loop(currentInputLines :+ line)
          }
        }
        case None => {
          // End of the stream.
          replPrint("No more input, ending.")
        }
      }
    }

    replPrint(
      """Very basic calculator. Enter basic arithmetic expression (+, -, *, /, parenthesis)
and end with ";" (arithmetic input after ";" is ignored).
Use ":quit" for quitting the calculator.
Note: Wrong results may occur if (sub-)expressions overflow 32-bit
signed integers. Deeply nested sub-expressions might also cause issues
in regards to stuff like stack overflow.

Example usage: 4 + 5 * (35435 + 35 - 10);""")
    replPrintPrompt()
    loop(Vector.empty)
  }
}
