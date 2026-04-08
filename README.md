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
2.  A QR code will appear in your terminal. Scan it using your WhatsApp mobile app (**Settings > Linked Devices > Link a Device**).
3.  The script will find the group, fetch all participants, and save them to a file named `Your_Group_Name_contacts.csv`.

## Features

- Exports phone number, saved name (from contacts), public name (pushname), and admin status.
- Uses **semicolon (`;`)** as the column separator for better compatibility with European Excel settings.
- All headers and values are enclosed in quotation marks.
- Handles CSV escaping for names with special characters.
- Simple CLI interface with QR code authentication.
- Persistent session: Once scanned, it will remember your login in the `.wwebjs_auth` folder.

## Troubleshooting

- If the group is not found, make sure you provide the **exact** name (including capitalization and special characters).
- If you have many chats, it might take a few seconds to load them all.
