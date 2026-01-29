# Rambu Database Management System

This is the GitHub Pages version of the ESP32 Rambu Database Management System.

## Features:
- Edit rambu data (add, edit, delete)
- Filter and search rambu
- Live map with rambu locations
- Device monitoring (static demo)
- Import/Export data as CSV
- Version control

## How to Use:
1. Edit rambu data in the "Rambu Data" tab
2. Save changes to GitHub automatically
3. ESP32 devices will fetch updated data

## GitHub Token Setup:
1. Go to GitHub Settings -> Developer Settings -> Personal Access Tokens
2. Generate a new token with `repo` permissions
3. Replace `ghp_xxx` in `assets/app.js` with your token

## ESP32 Integration:
ESP32 devices can fetch data from: