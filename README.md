# WhatsApp Group Contact Exporter

This script allows you to export all contacts from a WhatsApp group into a CSV file.

## Prerequisites

- Node.js installed.
- WhatsApp account linked to your phone.

## Setup

1.  Open your terminal in this directory.
2.  Install the dependencies (already done if you followed the instructions):
    ```bash
    npm install
    ```

## Usage

1.  Run the script with the group name as an argument:
    ```bash
    node export-contacts.js "Your Group Name"
    ```
2.  A QR code will appear in your terminal if there is no saved session. Scan it using your WhatsApp mobile app (**Settings > Linked Devices > Link a Device**).
3.  The script will find the group, read all participants, and save them to a file named `Your_Group_Name_contacts.csv`.

## Features

- Exports phone number, saved name (from contacts), public name (pushname), and admin status.
- Uses **semicolon (`;`)** as the column separator for better compatibility with European Excel settings.
- All headers and values are enclosed in quotation marks.
- Handles CSV escaping for names with special characters.
- Simple CLI interface with QR code authentication.
- Persistent session: Once scanned, it will remember your login in the `.wwebjs_auth` folder.

## Troubleshooting

- If the group is not found, make sure you provide the **exact** name (including capitalization and special characters).
- The terminal prints the current phase and the progress for every contact. Operations have a timeout, so a stalled WhatsApp request cannot leave the script waiting forever.
- Contact data is read from the local WhatsApp Web cache. If no participants are loaded, open that group once in WhatsApp Web and retry.
- If WhatsApp has not resolved a participant's private `@lid` identifier to a phone number, the contact is still exported and the phone field is left blank.
