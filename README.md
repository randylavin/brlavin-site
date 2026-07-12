# Family Homepage - Future Cloud Upgrades

## The Goal
Transform this static homepage into a frictionless, multi-user web application that automatically synchronizes shortcuts across all global devices for Randy, Rob, and Bev, completely free of charge.

## Feature Architecture
1. **Cloud Database Backbone:** Migrate data away from purely isolated `localStorage` to a free-tier cloud database (like Supabase or Firebase).
2. **Anonymous Client-Side Authentication:** Secure the database connection using a public-facing `anon` key paired with strict Row-Level Security (RLS) rules, eliminating the need for user passwords or PINs.
3. **Dynamic User Profiles:** Implement a clean header dropdown menu allowing users to toggle between profiles (`Randy`, `Rob`, `Bev`, `Blank`). 
4. **Persistent Session Memory:** Use `localStorage` purely to remember the *active user string* on a specific device so the page loads their board automatically on return.
5. **Cross-Board Cloning Feature:** Build an "Add to my board" action button, enabling family members to instantly copy an interesting shortcut from someone else's layout onto their own.
