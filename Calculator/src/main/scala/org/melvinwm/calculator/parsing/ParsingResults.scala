package org.melvinwm.calculator.parsing

import scala.util.parsing.input.Position

object ParsingResults {

  /**
    * Contains information regarding the causes for the failure of the parsing.
    *
    * @param errorMessage Error message.
    * @param errorPointInformation Information regarding the point in the input where parsing failed.
    */
  case class ParsingError(errorMessage: String,
                          errorPointInformation: ParsingPointInformation)

  /**
    * Describes information at a point in parsing some input.
    *
    * @param tokenMessage The token message for the token at the given point.
    * @param position The position in the input.
    */
  case class ParsingPointInformation(tokenMessage: String, position: Position)
}
