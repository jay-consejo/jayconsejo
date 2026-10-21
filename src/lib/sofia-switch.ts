/**
 * Sofia's call on the site. While false, the contact section shows an email card, the
 * floating mic button is hidden, and /api/sofia/sign refuses every request.
 */
export const SOFIA_ONLINE = false;

/** The line under "Need something like this?" on /work and the case-study side box. */
export const BOOK_CALL_LINE = SOFIA_ONLINE
  ? "Book a short call. My assistant Sofia takes the first one."
  : "Book a short call. Email me and I'll reply within 24 hours.";

/** How the first call happens, in the Process section's Discover step. */
export const FIRST_CALL_LINE = SOFIA_ONLINE ? "My AI Assistant runs the initial call." : "We start with a short call.";
