CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id serial PRIMARY KEY,
  issue_id integer NOT NULL UNIQUE REFERENCES newsletter_issues(id),
  issue_version integer NOT NULL,
  snapshot jsonb NOT NULL,
  mailing_address text NOT NULL,
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('ready','paused','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS newsletter_deliveries (
  id serial PRIMARY KEY,
  campaign_id integer NOT NULL REFERENCES newsletter_campaigns(id),
  subscriber_id integer NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','accepted','uncertain','skipped')),
  attempted_at timestamptz,
  message_id text,
  UNIQUE (campaign_id, email)
);
CREATE INDEX IF NOT EXISTS newsletter_deliveries_queue_idx ON newsletter_deliveries(campaign_id, status, id);
CREATE INDEX IF NOT EXISTS newsletter_deliveries_attempt_idx ON newsletter_deliveries(attempted_at);
-- A shared lock serializes reservations across tabs, instances, and campaigns.
CREATE TABLE IF NOT EXISTS newsletter_dispatch_lock (
  id integer PRIMARY KEY CHECK (id = 1),
  next_at timestamptz NOT NULL DEFAULT now(),
  busy_until timestamptz NOT NULL DEFAULT now()
);
INSERT INTO newsletter_dispatch_lock(id) VALUES (1) ON CONFLICT DO NOTHING;
