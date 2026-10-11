# WhatsApp Group Contact Exporter Modifications

The following modifications have been made to the script:

1.  **Removed ID column**: The internal WhatsApp serialised ID is no longer included in the CSV.
2.  **Split Name column**:
    -   `"Saved Name"`: The name as saved in your personal contacts (retrieved from `contact.name`).
    -   `"Public Name"`: The name as set by the user in their WhatsApp profile (retrieved from `contact.pushname`).
    -   `"Short Name"`: Added a new column for the user's short name (retrieved from `contact.shortName`).
3.  **Aggressive Sync**: The script now attempts to fetch the contact's "About" info and waits for a brief period if name data is initially missing to force a synchronization.
4.  **Updated Separator**: The column separator has been changed from a comma (`,`) to a **semicolon (`;`)**.
5.  **Header and Column Quoting**: Both the header row and all subsequent data rows now use double quotation marks around all fields.
6.  **Updated README**: The `README.md` has been updated to reflect these changes.

---
Date: April 4, 2026

7.  **Hang prevention**: Group discovery no longer calls `getChats()`, which can wait indefinitely while refreshing metadata for unrelated groups.
8.  **Local contact snapshot**: Contact names are read from the WhatsApp Web cache, avoiding remote profile/status calls that can remain unresolved.
9.  **Timeouts and diagnostics**: Startup phases, per-contact progress, failures, and disconnections are now printed in the terminal.
10. **Progressive CSV output**: The CSV is created before processing rows and written one contact at a time, preserving partial results if a later error occurs.

---
Date: September 23, 2026
