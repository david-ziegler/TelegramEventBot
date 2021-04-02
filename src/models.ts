export interface Attendee {
  id: number;
  event_id: number;
  user_id: string;
  name: string;
}

export interface Event {
  id: number;
  chat_id: number;
  message_id: number;
  description: string;
}
