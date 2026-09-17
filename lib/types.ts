export type Participant = {
  id: string;
  name: string;
  origin: string | null;
  qr_token: string;
  created_at: string;
};

export type Attendance = {
  id: string;
  participant_id: string;
  scanned_at: string;
  status: string;
  participants?: Participant;
};
