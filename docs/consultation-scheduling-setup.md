# Complimentary Consultation — Google Appointment Schedule Setup

The website stores the prospect's request first and then opens Chef Amber's
public Google Appointment Schedule. The prospect intentionally enters the main
event details again so they are attached to the calendar appointment as well as
the website request.

## 1. Create the appointment schedule

On a computer, open Google Calendar under the WaistLess Foods account that should
own the appointments. Select **Create → Appointment schedule** and use these
settings.

### Schedule title

```text
WaistLess Foods Complimentary Consultation
```

This title is public and also appears on Chef Amber's calendar when someone
books.

### Appointment duration

```text
30 minutes
```

### Availability and booking limits

Enter Chef Amber's real consultation hours. Recommended starting rules:

- minimum booking notice: **24 hours**;
- maximum advance booking window: **60 days**;
- buffer between appointments: **15 minutes**; and
- maximum consultations per day: **3**, if that option is available on the
  connected Google plan.

These are operational recommendations, not website requirements, and can be
adjusted later in Google Calendar.

## 2. Configure the public booking page

### Location and conferencing

Select:

```text
Google Meet video conferencing
```

Google will create the Meet link when the prospect books.

### Description — copy and paste

```text
Thank you for your interest in WaistLess Foods.

Use this complimentary 30-minute Google Meet consultation to discuss your upcoming event with Chef Amber. We will review your event vision, preferred date or dates, expected guest count, dietary needs, service options, and estimated budget.

Please complete the questions below, even if you already shared these details on the WaistLess Foods website, so the information is attached to your calendar appointment.

This consultation is an initial conversation. Scheduling a consultation does not reserve an event date, confirm service availability, or create a service booking. You will receive a Google Calendar confirmation and Google Meet link after selecting a time.
```

Google displays this description on the booking page, in confirmation emails,
and in the created calendar event. Google controls the surrounding confirmation
email and reminder wording; those messages do not have a separate custom-copy
field.

## 3. Build the booking form

Keep Google's required standard fields:

- **First name**
- **Last name**
- **Email address**

Turn on **Require email verification** to reduce incorrect addresses and spam.

Add the following three custom items and mark each one **Required**.

### Event Details

```text
Please describe your event, including the occasion, venue or city, expected guest count, service you are considering, menu vision, and any dietary restrictions or allergies.
```

### Event Date(s)

```text
What is your preferred event date? Please include any alternative dates. If the date is not yet confirmed, enter your approximate timeframe.
```

### Budget Range

```text
What estimated total budget range are you planning for your event?
```

Optional additional field:

### Phone Number

```text
What is the best phone number to reach you?
```

The website already captures a phone number, so this field only needs to be
required in Google if Chef Amber wants it repeated on the calendar appointment.

## 4. Confirmation and reminders

Recommended settings, if available on the connected Google plan:

- confirmation email: enabled;
- first reminder: **24 hours before**; and
- second reminder: **1 hour before**.

No payment should be requested for this complimentary consultation.

## 5. Connect the booking page to the website

After saving the schedule:

1. In Google Calendar, find the schedule under **Booking pages**.
2. Hover over **WaistLess Foods Complimentary Consultation**.
3. Select **Copy link** for that single booking page.
4. Open `.env` in the website project and add the complete public URL:

   ```text
   NEXT_PUBLIC_GOOGLE_BOOKING_URL=https://calendar.app.google/your-public-booking-link
   ```

5. Do not use the Google Meet URL, a private calendar URL, or a Google account
   settings URL. The value must be the public booking-page link.
6. Restart the local development server after changing `.env`. Add the same
   variable to the production hosting environment and redeploy because this is a
   browser-visible build-time setting.

`NEXT_PUBLIC_` is appropriate here because Google booking pages are intentionally
public. Google passwords, application passwords, tokens, and private calendar
links must never be used as this value.

## 6. End-to-end test

Use an email address other than the calendar owner's and verify all of the
following:

- the website consultation form saves a **Complimentary Consultation** request
  under **Admin → Booking Requests**;
- the request emails arrive;
- the browser opens the correct Google booking page;
- the three required questions appear;
- selecting a time creates an appointment on the intended calendar;
- the prospect receives a confirmation containing the Google Meet link; and
- the appointment event contains the form responses.
