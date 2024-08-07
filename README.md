# Trusted Traveler Notifier

**Find the earliest appointment available for Global Entry, TSA PreCheck, and NEXUS.**

## Overview

The Trusted Traveler Notifier project consists of two main components: a Python CLI application and a Chromium extension. Both components work together to help users find the earliest available appointments for Global Entry, TSA PreCheck, and NEXUS programs.

## Why This Exists

Booking appointments for trusted traveler programs can be challenging due to limited availability and high demand. This project aims to simplify the process by automatically checking for available slots and notifying users as soon as new slots become available. This ensures that users can secure appointments at the earliest possible dates, saving time and reducing the hassle of manual checks.

## Components

### Python CLI Application

The Python CLI application is designed to run on a server or local machine. It periodically checks for available appointment slots and plays a sound notification when slots are found.

#### Key Features

- Periodically checks for available slots.
- Plays a sound notification when slots are found.
- Logs the status and results of each check.

#### Usage

1. Install the required dependencies:
    ```sh
    pip install -r cli/requirements.txt
    ```

2. Run the application:
    ```sh
    python cli/bot.py
    ```

#### Configuration

- `--sleep-duration` or `-s`: Number of seconds to sleep between checks (default: 5 seconds).

### Chromium Extension

The Chromium extension provides a user-friendly interface to manually check for available slots and receive notifications directly in the browser.

#### Key Features

- Manual slot checking via a popup interface.
- Notifications for available slots.
- Plays a sound notification when slots are found.
- Background checks and cookie refresh.

#### Installation

1. Load the extension in Chromium-based browsers:
    - Open `chrome://extensions/`.
    - Enable "Developer mode".
    - Click "Load unpacked" and select the `extension` directory.

2. Use the extension:
    - Click the extension icon in the browser toolbar.
    - Click "Check Now" to manually check for available slots.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.
