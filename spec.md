# Specification

## Summary
**Goal:** Add delete functionality for food entries, a persistent per-day calorie limit with a remaining calories display and exceeded-limit warning, and a 7-day calorie consumption chart to the Calorie Tracker app.

**Planned changes:**
- Add `deleteFoodEntry(id, date)` backend function that removes a food entry from stable storage and returns a success/failure result
- Add `setCalorieLimit(date, limit)` and `getCalorieLimit(date)` backend functions to persist a per-day calorie limit across sessions
- Add a trash icon delete button to each food entry card on the Daily Dashboard; clicking it calls the backend, then refreshes calories consumed and net balance immediately
- Add a calorie limit input control on the Daily Dashboard that loads the stored limit, allows editing/saving, and shows a live "calories remaining" counter
- Show a prominent warning banner on the Daily Dashboard when calories consumed exceed the set limit; hide it when consumption drops back below the limit
- Add a 7-day bar or line chart on the Daily Dashboard showing daily calories consumed for the past 7 days, with a horizontal reference line at the current day's calorie limit; chart updates live when entries are added or deleted

**User-visible outcome:** Users can delete individual food entries from their daily log, set and persist a daily calorie limit, see how many calories remain for the day, receive a visual warning when they exceed their limit, and view a 7-day calorie consumption chart with their limit as a reference line.
