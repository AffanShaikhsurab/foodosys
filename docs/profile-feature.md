# User Profile Feature

This document describes the user profile feature that has been added to the Foodosys application.

## Overview

The user profile feature allows users to:
- View their profile information including avatar, name, and role
- Track their karma points and level progression
- View their statistics (uploads, helps, rank)
- See earned badges
- Access account settings

## Implementation

### Files Created/Modified

1. **Profile Page** (`/src/app/settings/page.tsx`)
   - Main profile component that displays user information
   - Fetches data from Supabase backend
   - Handles authentication state
   - Implements dynamic level and progress calculations

2. **Authentication Helper** (`/src/lib/auth.ts`)
   - Provides authentication functions (sign in, sign up, sign out)
   - Handles profile creation for new users
   - Manages user session state

3. **Profile API** (`/src/app/api/profile/route.ts`)
   - RESTful API for profile management
   - Handles profile creation and retrieval
   - Integrates with Supabase database

4. **Authentication Page** (`/src/app/auth/page.tsx`)
   - Sign in and sign up interface
   - Form validation and error handling
   - Redirects to profile after successful authentication

5. **Global Styles** (`/src/app/globals.css`)
   - Added profile-specific CSS styles
   - Matches the design from the reference HTML

### Database Integration

The profile feature connects to the following Supabase tables:
- `user_profiles` - Stores user profile information
- `daily_contributions` - Tracks user contributions
- `leaderboard` - Manages user rankings
- `user_badges` - Stores earned badges

### Navigation

The profile is accessible through the settings tab in the bottom navigation. When users are not authenticated, they are redirected to the authentication page.

## Usage

1. Navigate to `/settings` or click the settings icon in the bottom navigation
2. If not authenticated, you'll be redirected to the sign-in/sign-up page
3. After authentication, your profile will be displayed
4. New users will have a profile automatically created with default values

## Features

### Profile Display
- User avatar with level badge
- Display name and role
- Karma points with progress bar
- Statistics grid (uploads, helps, rank)
- Badges carousel
- Settings menu

### Dynamic Calculations
- Level progression based on karma points
- Progress percentage to next level
- Points needed to reach next level
- Level icons and names

### Authentication
- Sign in with email and password
- Sign up with email, password, and display name
- Automatic profile creation for new users
- Sign out functionality

## Design

The profile page follows the design specifications from the reference HTML file, including:
- Color scheme and typography
- Layout and spacing
- Interactive elements
- Responsive design

## Future Enhancements

Potential improvements to consider:
- Profile editing functionality
- Badge achievements system
- Social features (following other users)
- Profile customization options
- Advanced statistics and analytics