import { Message, User } from 'node-telegram-bot-api';
import { i18n } from './i18n';
import { Attendee } from './models';

export function shortenDescriptionIfTooLong(description: string): string {
  const MAX_LENGTH = 3500;
  if (description.length > MAX_LENGTH) {
    return description.substring(0, 3500) + '...';
  } else {
    return description;
  }
}

export function removeBotCommand(text: string): string {
  return text.replace(/^\/(E|e)vent( |\n)?/, '');
}

export function addEventAuthor(text: string, author: User): string {
  return `${text}\n\n_${i18n.message_content.created_by} ${getFullNameString(author)}_`;
}

export function createEventIDFromMessage(msg: Message): string {
  return `${msg.chat.id}_${msg.message_id}`;
}

export function getEventTextWithAttendees(description: string, attendees: Attendee[]): string {
  return `${description}\n\n*${i18n.message_content.rsvps}:*${attendees.reduce(
    (attendeesString, attendeeRow) =>
      `${attendeesString}\n${attendeeRow.full_name}`,
    '',
  )}`;
}

export function sanitize(original: string): string {
  if (!original) {
    return;
  }
  const unwantedCharacters = ['_', '*', '[', ']'];
  return unwantedCharacters.reduce((original, character) => {
    return removeOddNumberOfCertainCharacter(original, character);
  }, original);
}

function removeOddNumberOfCertainCharacter(original: string, unwantedCharacter: string) {
  // make sure the string doesn't contain an uneven number of "_"
  // An even number can be correctly parsed as markdown
  const replaceBy = ' ';
  if (isOdd(numberOfOccurrences(original, unwantedCharacter))) {
    return original.replace(unwantedCharacter, replaceBy);
  }

  return original;
}

function numberOfOccurrences(string: string, key: string) {
  const escapedKey = '\\' + key;
  const matchingResults = string.match(new RegExp(escapedKey, 'g'));
  if (!matchingResults) {
    return 0;
  }
  return matchingResults.length;
}

function isOdd(number: number): boolean {
  return number % 2 === 1;
}

export function getFullNameString(user: User): string {
  if (!user.first_name && !user.last_name) {
    return sanitize(user.username);
  }
  return [sanitize(user.first_name), sanitize(user.last_name)]
    .filter(namePart => namePartIsPresent(namePart))
    .join(' ');
}

function namePartIsPresent(namePart: string) {
  return !!namePart;
}