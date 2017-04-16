package org.melvinwm.calculator.evaluation.test

import scala.util.{Try, Success, Failure}

import org.specs2.mutable.Specification

import scalaz.{\/, \/-, -\/}

import org.melvinwm.calculator.evaluation.Interpreters
import org.melvinwm.calculator.parsing.ExpressionParsers

object InterpreterTest extends Specification {

  def testEval(parser: ExpressionParsers.ExpressionParser,
               interpreter: Interpreters.Interpreter,
               expressionInput: String) = {
    parser.parse(expressionInput) match {
      case \/-(expr) => interpreter.evaluate(expr).get
      case -\/(a) =>
        throw new IllegalStateException(s"Failed to parse in test: $a.")
    }
  }

  "The interpreter" should {

    "successfully evaluate various valid expressions with the correct result" in {

      val p = ExpressionParsers.default
      val i = Interpreters.default

      testEval(p, i, "4 + 5;") === 9
      testEval(p, i, "4 + 5 * 100;") === 504
      testEval(p, i, "4 + (5 * 100);") === 504
      testEval(p, i, "(4 + 5) * 100;") === 900
      testEval(p, i, "4 + 5 - 5 - 1000;") === -996
      testEval(p, i, "4 + 5 - (5 - 1000);") === 1004
      testEval(p, i, "1 - 2 - 2 - 2 + 2 - 2 + 2 - 2 + 2 + 2 - 2 - 2 - 2 - 2;") === -9
      testEval(p, i, "---------4;") === -4
      testEval(p, i, "----------4;") === 4
      testEval(p, i, "10 / 2;") === 5
    }

    "fail as it should when input is invalid (such as division by zero)" in {

      val p = ExpressionParsers.default
      val i = Interpreters.default

      p.parse("5 / (6 - 6);").map(expr => i.evaluate(expr)) must beLike {
        case \/-(Failure(_)) => ok
      }
    }
  }
}
