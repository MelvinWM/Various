package org.melvinwm.calculator.parsing.test

import org.specs2.mutable.Specification

import scalaz.{\/, \/-, -\/}

import org.melvinwm.calculator.ast.AST._
import org.melvinwm.calculator.parsing.ExpressionParsers

object ExpressionParserTest extends Specification {

  private[this] def parseOk(input: String) = {
    ExpressionParsers.default.parse(input) must beLike {
      case \/-(_) => ok
    }
  }

  private[this] def parseNotOk(input: String) = {
    ExpressionParsers.default.parse(input) must beLike {
      case -\/(_) => ok
    }
  }

  /* NOTE: One could potentially make a generator for ASTs using ScalaCheck,
   * write a module that generates text from AST, and then use that to generate
   * random ASTs, generate text, parse the text, and check that the randomly
   * generated AST is the same as the result of generating text and parsing
   * it again.
   */

  "The parser" should {
    "successfully parse various valid input" in {

      parseOk("0;")
      parseOk("1;")
      parseOk("00000;")
      parseOk("12421421;")
      parseOk("124124;")
      parseOk("-124124;")
      parseOk("   -   124124   ;   ")
      parseOk(
        "54*151*-54*-54/100*30/-100 + 30*540*-(545 + 54*(35) - (545*3))/35 - ---2345 - 23452354*45 - 34 + 353 ;")
    }

    "generate the correct AST for various input" in {

      ExpressionParsers.default.parse("4 + 5 * 100;") must beLike {
        case \/-(
            Add(IntLiteral(4), Multiply(IntLiteral(5), IntLiteral(100)))) =>
          ok
      }

      ExpressionParsers.default.parse("(4 + 5) * 100;") must beLike {
        case \/-(
            Multiply(Add(IntLiteral(4), IntLiteral(5)), IntLiteral(100))) =>
          ok
      }

      ExpressionParsers.default.parse("1 - 5 - 10;") must beLike {
        case \/-(
            Subtract(Subtract(IntLiteral(1), IntLiteral(5)),
                     IntLiteral(10))) =>
          ok
      }

      ExpressionParsers.default.parse("1 - (5 - 10);") must beLike {
        case \/-(
            Subtract(IntLiteral(1),
                     Subtract(IntLiteral(5), IntLiteral(10)))) =>
          ok
      }
    }

    "fail to parse various invalid input" in {

      parseNotOk("")
      parseNotOk(";")
      parseNotOk("aewifoaw9fa9fej;")
    }
  }
}
