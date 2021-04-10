/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Message, User } from 'node-telegram-bot-api';
import { Attendee } from './models';

export function createEventDescription(message: Message, i18n: any): string {
  if (message.text === undefined || message.from === undefined) {
    throw new Error(`Tried to create an event with an empty message-text. Message: ${message}`);
  }
  const event_description = removeBotCommand(message.text);
  const event_description_valid_length = shortenDescriptionIfTooLong(event_description);
  const event_description_with_author = addEventAuthor(event_description_valid_length, message.from, i18n);
  const sanitized_event_description_with_author = sanitize(event_description_with_author);
  return sanitized_event_description_with_author;
}

function shortenDescriptionIfTooLong(description: string): string {
  const MAX_LENGTH = 3500;
  if (description.length > MAX_LENGTH) {
    return description.substring(0, 3500) + '...';
  } else {
    return description;
  }
}

function removeBotCommand(text: string): string {
  return text.replace(/^\/(E|e)vent( |\n)?/, '');
}

function addEventAuthor(text: string, author: User, i18n: any): string {
  return `${text}\n\n_${i18n.message_content.created_by} ${getFullNameString(author)}_`;
}

export function sanitize(original: string): string {
  const RESERVED_CHARACTERS = ['.', '(', ')', '{', '}', '!', '#', '+', '-', '=', '>', '|'];
  const MARKDOWN_CHARACTERS = ['_', '*', '__', '~', '`', '```', '[', ']'];
  if (original === '') {
    return '';
  }
  let sanitized = original;
  for (const char of RESERVED_CHARACTERS) {
    sanitized = escapeReservedCharacters(sanitized, char);
  }
  for (const char of MARKDOWN_CHARACTERS) {
    sanitized = escapeIfOddNumberOfThisCharacter(sanitized, char);
  }
  return sanitized;
}

function escapeReservedCharacters(original: string, reservedCharacter: string): string {
  const REGEX = new RegExp(`\\${reservedCharacter}`, 'g');
  return original.replace(REGEX, `\\${reservedCharacter}`);
}

function allCharactersEscaped(original: string): string {
  return original.split('').map((char: string) => `\\${char}`).join('');
}

function escapeIfOddNumberOfThisCharacter(original: string, markdownCharacters: string) {
  // make sure the string doesn't contain an uneven number of the markdown characters
  // An even number can be correctly parsed as markdown
  if (isOdd(numberOfOccurrences(original, markdownCharacters))) {
    const REGEX = new RegExp(`\\${markdownCharacters}`, 'g');
    const replacement = allCharactersEscaped(markdownCharacters);
    return original.replace(REGEX, replacement);
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
    if (user.username === undefined) {
      throw new Error(`User doesn't have a first_name, last_name or username: ${user}`);
    }
    return sanitize(user.username);
  }
  if (user.last_name === undefined) {
    return sanitize(user.first_name);
  }
  return `${sanitize(user.first_name)} ${sanitize(user.last_name)}`;
}

export function createEventIDFromMessage(message: Message): string {
  return `${message.chat.id}_${message.message_id}`;
}

export function getEventTextWithAttendees(description: string, attendees: Attendee[], attendees_label: string): string {
  return `${description}\n\n*${attendees_label}:*${attendees.reduce(
    (attendeesString, attendeeRow) =>
      `${attendeesString}\n${attendeeRow.name}`,
    '',
  )}`;
}