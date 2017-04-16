package org.melvinwm.calculator.parsing

import scalaz.{\/, \/-, -\/}

import org.melvinwm.calculator.ast.AST
import org.melvinwm.calculator.parsing.ParsingResults._

object ExpressionParsers {

  import AST._

  val endingString = ";"

  trait ExpressionParser {

    /**
      * Parses the given expression.
      *
      * Yields either an abstract syntax tree or a parse error.
      *
      * @param input The expression text. Example: "345 + 109*54 - 1;".
      */
    def parse(input: String): \/[ParsingError, Expr]
  }

  /** Gives a default parser. */
  val default: ExpressionParser = impl.PackratExpressionParser
}
