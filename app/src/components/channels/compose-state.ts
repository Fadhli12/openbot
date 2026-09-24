/**
 * The rules a compose screen follows before there is a channel to hold them.
 *
 * Pure helpers so recipient-cap and sendability behavior stay testable without rendering.
 */

export type Recipient = {
  id: string;
  name: string;
};

/**
 * One or more coworkers per channel.
 */
export const MAX_RECIPIENTS = 20;

/** Add a coworker, replacing the oldest once the channel recipient cap is reached. */
export function addRecipient(
  current: readonly Recipient[],
  next: Recipient,
): Recipient[] {
  if (current.some((recipient) => recipient.id === next.id)) {
    return [...current];
  }
  return [...current, next].slice(-MAX_RECIPIENTS);
}

export function removeRecipient(
  current: readonly Recipient[],
  id: string,
): Recipient[] {
  return current.filter((recipient) => recipient.id !== id);
}

/** Whether this draft can start a channel. */
export function canSend(
  recipients: readonly Recipient[],
  text: string,
): boolean {
  return recipients.length > 0 && text.trim().length > 0;
}
