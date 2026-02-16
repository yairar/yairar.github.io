# Strava Activity Search - Chrome Extension

A simple Chrome extension that adds search functionality to Strava activity pages, allowing you to filter activities by name.

This extension was created to solve a simple problem: Strava doesn't provide a built-in way to search activities by name. 
While limited to searching the current page, it's still useful for quickly finding specific activities.

## 🎯 Features

- **Search by Activity Name**: Instantly filter activities as you type
- **Visual Highlighting**: Matching activities are highlighted with an orange accent
- **Auto-Scroll to Results**: Automatically scrolls to the first match
- **Navigate Between Matches**: Use arrow buttons or keyboard shortcuts to jump between results
- **Live Counter**: Shows current match position (e.g., "2/5 matches")
- **Clean UI**: Integrates seamlessly with Strava's design
- **Keyboard Shortcuts**: 
  - `Ctrl+K` (or `Cmd+K` on Mac) to focus the search box
  - `Enter` to jump to next match
  - `Shift+Enter` to jump to previous match
- **Clear Button**: Quickly reset your search

## 📸 What It Does

When you visit any athlete's profile page on Strava (including your own), this extension adds a search box above the activities feed. Type any part of an activity name, and it will:
- Hide non-matching activities
- Show only activities that match your search
- Display a count of visible vs total activities

## ⚠️ Limitations

- Only searches the activities currently visible on the page
- To search more activities, scroll down to load more (if infinite scroll is enabled) or navigate to other pages
- Does not search across all activities at once

## 🎮 Usage

1. **Navigate to Any Athlete Profile**
   - Go to your Strava profile or someone else's
   - The main profile page should show a feed of activities
   - URL will look like: `strava.com/athletes/12345678`

2. **Use the Search Box**
   - The search box appears automatically above the activities
   - Type any part of an activity name (e.g., "Morning Run", "Bike", "5k")
   - Activities update instantly as you type
   - The page automatically scrolls to the first match
   - Matching activities are highlighted with an orange accent

3. **Navigate Between Matches**
   - Click the **↑** button to go to previous match
   - Click the **↓** button to go to next match
   - Or use keyboard: `Enter` for next, `Shift+Enter` for previous
   - The counter shows your position (e.g., "3/8 matches")

4. **Keyboard Shortcuts**
   - `Ctrl+K` (Windows/Linux) or `Cmd+K` (Mac): Focus the search box
   - `Enter`: Jump to next match
   - `Shift+Enter`: Jump to previous match
   - `Escape`: Clear the search (when focused on search box)

5. **Clear Search**
   - Click the ✕ button next to the search box
   - Or delete all text in the search box

## 🔧 Troubleshooting

### Search box doesn't appear
- **Check the URL**: Make sure you're on an athlete profile page (URL should be `/athletes/[number]` or `/pros/[number]`)
- **Refresh the page**: Try refreshing after a few seconds

### Activities aren't filtered
- **Check spelling**: Search is case-insensitive but must match exactly
- **Verify activities loaded**: Make sure the page has fully loaded
- **Try refreshing**: Sometimes Strava's dynamic loading can cause issues

## 🐛 Known Issues

- Search only works on currently loaded activities (scroll down to load more)
- May not work if Strava updates their HTML structure
- Doesn't persist search when navigating between pages
- Works best on desktop; mobile experience may vary

## 📄 License

This is a simple open-source tool. Use and modify as you wish!

**Version**: 1.0.0  
**Last Updated**: February 2026
