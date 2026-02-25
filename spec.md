# Specification

## Summary
**Goal:** Fix the Daily Dashboard so that the date selector always defaults to today's actual current date on load.

**Planned changes:**
- Initialize the date state in the Daily Dashboard component using the real current date (`new Date()` or equivalent) instead of any hardcoded or stale value.
- Ensure the date picker/calendar input displays today's date in the correct format on initial load.
- Ensure that navigating back to the Dashboard without a specific date parameter always resets to today's date.

**User-visible outcome:** When users open the Daily Dashboard, the date selector correctly shows today's actual date, and navigating away and returning still defaults to the current date.
