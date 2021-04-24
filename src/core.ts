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
  return event_description_with_author;
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
  return `${text}\n\n<i>${i18n.message_content.created_by} ${getFullNameString(author)}</i>`;
}

export function getFullNameString(user: User): string {
  if (!user.first_name && !user.last_name) {
    if (user.username === undefined) {
      throw new Error(`User doesn't have a first_name, last_name or username: ${user}`);
    }
    return user.username;
  }
  if (user.last_name === undefined) {
    return user.first_name;
  }
  return `${user.first_name} ${user.last_name}`;
}

export function createEventIDFromMessage(message: Message): string {
  return `${message.chat.id}_${message.message_id}`;
}

export function getEventTextWithAttendees(description: string, attendees: Attendee[], attendees_label: string): string {
  return `${description}\n\n<b>${attendees_label}:</b>${attendees.reduce(
    (attendeesString, attendeeRow) =>
      `${attendeesString}\n${attendeeRow.name}`,
    '',
  )}`;
}