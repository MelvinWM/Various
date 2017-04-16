package org.melvinwm.calculator.ast

object AST {

  /*
   * If adding more operators, a more scalable approach in regards to
   * the number of types would be to have cases like "BinaryOperator"
   * and "UnaryOperator".
   * If adding even more, or even having user-defined functions
   * (which would begin to move towards a full-fledged programming language),
   * stuff like one type for functions with a length for number of parameters
   * (maybe with maximum limit, maybe not), or higher-order functions and
   * then do ML-like handling of multiple parameters, like "a => a => a",
   * might make sense.
   */

  /** Expression. */
  sealed trait Expr

  // Side-note: Using BigInt might make for a more user-friendly experience.
  case class IntLiteral(value: Int) extends Expr
  case class Add(expr1: Expr, expr2: Expr) extends Expr
  case class Multiply(expr1: Expr, expr2: Expr) extends Expr
  case class Subtract(expr1: Expr, expr2: Expr) extends Expr
  case class Divide(expr1: Expr, expr2: Expr) extends Expr
  case class Negation(expr: Expr) extends Expr
}
