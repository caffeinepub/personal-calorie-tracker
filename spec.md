# Specification

## Summary
**Goal:** Build CalorieLens, a personal calorie tracker app where users can upload food photos to log calorie intake, record daily steps to track calories burned, and view their daily and historical nutrition balance.

**Planned changes:**

### Backend (Motoko)
- Data model for food log entries (date, food name, calorie estimate, image reference) with stable storage
- `addFoodEntry`, `getFoodEntriesByDate`, and `getAllLoggedDates` functions
- Data model for daily step records (date, step count) with stable storage
- `setStepsForDate` and `getStepsForDate` functions (calories burned = steps × 0.04 kcal)
- `getDailySummary(date)` returning total calories in, total steps, calories burned, and net calories

### Frontend
- **Food Upload screen:** drag-and-drop or file picker for food photos, image preview, client-side heuristic calorie estimation (based on filename and image signals), editable food name and calorie fields, confirm to save entry
- **Daily Dashboard screen:** defaults to today, date picker to switch days, food entries list with thumbnails, step count input, totals for calories in/burned/net, motivational deficit/surplus indicator (green for deficit, amber/red for surplus)
- **History Log screen:** list of all logged dates with calories in, burned, and net per row; average daily net calories summary at top; clicking a row navigates to that date's dashboard
- **Visual theme:** white and soft green palette, warm orange accents, rounded cards, strong typography hierarchy, responsive layout for mobile and desktop
- Navigation accessible from all screens between Food Upload, Dashboard, and History

**User-visible outcome:** Users can photograph food to log calorie intake, manually record daily steps, and view a clear daily and historical breakdown of calories consumed vs. burned, supporting a fat-loss tracking routine.
