package org.melvinwm.calculator.parsing.impl

import scalaz.{\/, \/-, -\/}

import scala.util.parsing.combinator.PackratParsers
import scala.util.parsing.combinator.syntactical.StandardTokenParsers

import org.melvinwm.calculator.ast.AST._
import org.melvinwm.calculator.parsing.ExpressionParsers
import org.melvinwm.calculator.parsing.ExpressionParsers.ExpressionParser
import org.melvinwm.calculator.parsing.ParsingResults._

/**
  * Note: Parser combinators are based on PEGs, which can be read about here:
  * https://en.wikipedia.org/wiki/Parsing_expression_grammar.
  */
private[parsing] object PackratExpressionParser extends ExpressionParser {

  override def parse(input: String) = {
    (new MyParsers).parse(input)
  }

  private[this] class MyParsers
      extends StandardTokenParsers
      with PackratParsers {

    def parse(input: String) = {

      val reader = new PackratReader(new lexical.Scanner(input))

      import lexical.ErrorToken

      def getTokenMessage(token: lexical.Token): String = token match {
        case ErrorToken(msg) => "[ErrorToken: " + msg + "]"
        case _ => "[Unexpected token: " + token + "]"
      }

      def handleNoParsingResult(msg: String, input: Input) = {
        -\/(
          ParsingError(
            msg,
            ParsingPointInformation(getTokenMessage(input.first), input.pos)))
      }

      phrase(overallExpression)(reader) match {
        case Success(tree, _) => \/-(tree)
        case Failure(msg, input) => handleNoParsingResult(msg, input)
        case Error(msg, input) => handleNoParsingResult(msg, input)
      }
    }

    // Setup.

    // Side-note: If one were to add a lot more operators with various
    // precedence rules than just plus, minus, multiplication and
    // division, it might make more sense to use something like
    // the shunting-yard algorithm.

    // Keyword-constructor map.
    // NOTE: Must be non-empty.
    private[this] val addSub = Map("+" -> ((e1, e2) => Add(e1, e2)),
                                   "-" -> ((e1, e2) => Subtract(e1, e2)))

    // Keyword-constructor map.
    // NOTE: Must be non-empty.
    private[this] val multDiv = Map("*" -> ((e1, e2) => Multiply(e1, e2)),
                                    "/" -> ((e1, e2) => Divide(e1, e2)))

    private[this] def oneOfKeywords(
        keywordConstructorMap: Map[String, (Expr, Expr) => Expr]) = {
      require(!keywordConstructorMap.isEmpty)
      keywordConstructorMap.keys.map(keyword).reduce(_ | _)
    }

    lexical.delimiters ++= (Seq("(", ")", ExpressionParsers.endingString) ++
      multDiv.keys ++
      addSub.keys)

    // Rules.

    lazy val maybeNegatedNumber: PackratParser[Expr] = {

      def isJavaInt(str: String) = {
        try {
          str.toInt
          true
        } catch {
          case e: NumberFormatException => false
        }
      }

      (keyword("-").* ~ numericLit)
        .map {
          case negs ~ nu => {
            negs match {
              case Nil => (Nil, nu)
              case ne :: nes => (nes, "-" + nu)
            }
          }
        }
        .^?(
          {
            case (negs, num) if isJavaInt(num) =>
              negs.foldLeft(IntLiteral(num.toInt): Expr)((mnn, _) =>
                Negation(mnn))
          }, {
            case (negs, num) =>
              s"The numeric literal was not a valid 32-bit signed integer: $num."
          }
        )
    }

    lazy val parenthesisExpr: PackratParser[Expr] =
      "(" ~> coreExpression <~ ")"

    lazy val maybeNegatedFactor: PackratParser[Expr] =
      keyword("-").* ~ parenthesisExpr ^^ {
        case negations ~ bf =>
          negations.foldLeft(bf)((mnf, _) => Negation(mnf))
      } |
        maybeNegatedNumber

    lazy val factors: PackratParser[Expr] =
      maybeNegatedFactor ~ (oneOfKeywords(multDiv) ~ maybeNegatedFactor).* ^^ {
        case mnf ~ mnfs => {

          mnfs.foldLeft(mnf) {
            case (resultSoFar, operator ~ currentMnf) => {

              multDiv.get(operator) match {
                case Some(constr) => constr(resultSoFar, currentMnf)
                case None =>
                  throw new IllegalStateException(
                    s"$operator, $resultSoFar, $currentMnf")
              }
            }
          }
        }
      }

    lazy val terms: PackratParser[Expr] =
      factors ~ (oneOfKeywords(addSub) ~ factors).* ^^ {
        case t ~ ts => {

          ts.foldLeft(t) {
            case (resultSoFar, operator ~ currentT) => {

              addSub.get(operator) match {
                case Some(constr) => constr(resultSoFar, currentT)
                case None =>
                  throw new IllegalStateException(
                    s"$operator, $resultSoFar, $currentT")
              }
            }
          }
        }
      }

    lazy val coreExpression: PackratParser[Expr] = terms

    lazy val overallExpression: PackratParser[Expr] = coreExpression <~ ";"
  }
}
