
/**
 * Application program, is not designed to be used elsewhere.
 * 
 * <p>
 * Some policies follow below, though this is in general overkill for a toy
 * application such as this, and is mostly included for experimental and
 * learning reasons.
 * 
 * <p>
 * <b>Nullability:</b> All fields that may be null must have this documented in
 * their Javadoc documentation. All parameters that may be null must be of type
 * "Optional".
 * 
 * <p>
 * <b>Ownership and life-times of resources:</b> Only document when useful.
 *
 * <p>
 * <b>Concurrency policies:</b>
 * <ul>
 * <li>Blocking/non-blocking: Methods when meaningful (mostly 'public' methods
 * as well as some 'private' ones) must define which of the following states
 * they are in regarding blocking, namely "yes", "no", and "unknown". This done
 * by a single line, like so:
 * 
 * <p>
 * "Blocking: Yes."
 * 
 * <p>
 * The reasoning behind this is to make it much easier to always be able to
 * reason about whether a call can be blocking or not. Imagine that you have a
 * public method that is called something like this:
 * 
 * <p>
 * <code>public Track getTrack()</code>
 * 
 * <p>
 * At first glance, this method might be viewed as non-blocking in the sense
 * that it will return immediately. But what if it turns out that it is
 * blocking, either because it has to make a network call, some other IO or is
 * surprisingly computationally heavy? By documenting somehow that it is
 * blocking this can be discovered simply by checking the documentation of the
 * method.
 * 
 * <p>
 * Other approaches to this in actual, non-toy applications/APIs are as far as
 * this author (github.com/melvinwm, 2017-12-16) can tell is to either include
 * it as part of the general policy of the library/language (for instance, in
 * Erlang, all IO is as such non-blocking as long as no native calls are made),
 * naming (like in Node.js's IO functions which have 'Sync' appended if they are
 * blocking, see https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/ and
 * the somewhat related naming convention with 'Async' in C#) and types (in
 * Scala, the type 'scala.concurrent.Future' being used as a return type for a
 * function or method can indicate that it is non-blocking, and in Haskell it is
 * not possible to do IO without it being visible in the types (unless
 * shenanigans like with 'unsafePerformIO' is used)).
 * 
 * <li>Immutability and referential transparency is as such preferred.
 * 
 * <li>Thread-safety must be documented for each class, whether it is
 * thread-safe or not, unless it is trivial to see that it is not applicable.
 * This includes documenting from which thread or threads a class may be used if
 * applicable, for instance whether it may only be used on the JavaFX
 * application thread.
 * </ul>
 */
package org.melvinwm.circlefractal.javafx;
