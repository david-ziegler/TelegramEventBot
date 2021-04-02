export interface Attendee {
  event_id: string;
  user_id: string;
  full_name: string;
}

export interface Event {
  event_id: string;
  chat_id: number;
  message_id: number;
  description: string;
}
