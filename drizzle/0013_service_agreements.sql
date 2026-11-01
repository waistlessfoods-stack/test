CREATE TABLE IF NOT EXISTS service_agreements (
  id text PRIMARY KEY,
  booking_id integer REFERENCES bookings(id),
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','signed','void')),
  content jsonb NOT NULL,
  document_hash text,
  token_hash text UNIQUE,
  expires_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,
  signature jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'signed' OR (signed_at IS NOT NULL AND signature IS NOT NULL AND document_hash IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS service_agreements_booking_idx ON service_agreements(booking_id, created_at DESC);
CREATE INDEX IF NOT EXISTS service_agreements_email_idx ON service_agreements((content->>'email'), created_at DESC);

CREATE TABLE IF NOT EXISTS service_invoice_records (
  invoice_id text PRIMARY KEY,
  agreement_id text REFERENCES service_agreements(id),
  booking_id integer REFERENCES bookings(id),
  live boolean NOT NULL,
  status text NOT NULL,
  total integer NOT NULL,
  paid integer NOT NULL,
  remaining integer NOT NULL,
  request_key text UNIQUE,
  request_hash text,
  notification_claimed_at timestamptz,
  notified_at timestamptz,
  notification_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS service_invoice_records_agreement_idx ON service_invoice_records(agreement_id);
