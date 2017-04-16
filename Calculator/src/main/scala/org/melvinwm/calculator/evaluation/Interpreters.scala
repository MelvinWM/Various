package org.melvinwm.calculator.evaluation

import scala.util.Try
import org.melvinwm.calculator.ast.AST._

/**
  * Contains interpreters for the expressions.
  *
  * A bit over-kill in this toy application, but could be useful
  * for more complicated calculators, such as if variables and
  * looping constructs or similar were included, and likewise if features
  * like optimization were included.
  */
object Interpreters {

  trait Interpreter {

    /**
      * Try to evaluate the given expression.
      *
      * Exceptions may occur if for instance a divide-by-zero happens.
      *
      * A wrong result may be returned if underflow, overflow
      * or divide-by-zero happens (divide-by-zero may not give an exception
      * if it is optimized away).
      *
      * @param expression An expression.
      * @return The result of evaluating the expression, or a wrong result
      * if there are errors in the input.
      */
    def evaluate(expression: Expr): Try[Int]
  }

  def default: Interpreter = MyInterpreter

  private[this] object MyInterpreter extends Interpreter {

    // WARNING: This approach can stack overflow if the input expression AST is deep enough.

    def evaluate(expr: Expr) = {
      Try(evaluate1(expr))
    }

    def evaluate1(expr: Expr): Int = {
      expr match {
        case Add(e1, e2) => evaluate1(e1) + evaluate1(e2)
        case Subtract(e1, e2) => evaluate1(e1) - evaluate1(e2)
        case Multiply(e1, e2) => evaluate1(e1) * evaluate1(e2)
        case Divide(e1, e2) => evaluate1(e1) / evaluate1(e2)
        case Negation(e) => -evaluate1(e)
        case IntLiteral(value) => value
      }
    }
  }
}
