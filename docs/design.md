Here is a comprehensive Design System documentation file. You can save this as **`DESIGN_SYSTEM.md`** in your project repository.

It defines the **"Organic Tech"** philosophy (based on the Batchboard design) to ensure consistency across your Mysore Mess Menus application.

***

# 🎨 Mysore Mess Menus - Design System

**Version:** 2.0 (Organic Tech Redesign)
**Philosophy:** "Calm Efficiency."
**Core Concept:** The interface should feel like a wellness tool, not a spreadsheet. We use earthy tones, heavy rounded corners, and floating elements to reduce visual stress for hungry, busy students.

---

## 1. Design Tokens (CSS Variables)

Copy these directly into your root CSS file or Streamlit configuration.

```css
:root {
  /* ---------------- COLORS ---------------- */
  /* Backgrounds */
  --bg-body:       #FDFDE8; /* Cream - The canvas */
  --bg-card:       #FFFFFF; /* White - The content surface */
  --bg-subtle:     #F2F4F2; /* Light Grey/Green - Secondary backgrounds */

  /* Brand Colors */
  --primary-dark:  #2C3E2E; /* Forest Green - Text, Icons, Active States */
  --primary-light: #4A5D4C; /* Sage - Secondary Text */
  --accent-lime:   #DCEB66; /* Lime - CTAs, Highlights, Active Tabs */
  
  /* Text Colors */
  --text-main:     #1F291F; /* Near Black */
  --text-muted:    #889287; /* Greyed Green */
  --text-on-dark:  #FFFFFF; /* White text on Forest Green */
  --text-on-lime:  #2C3E2E; /* Dark Green text on Lime (Contrast compliance) */

  /* Feedback */
  --status-success: #4CAF50; /* Green Dot */
  --status-error:   #FF8A80; /* Soft Red */
  --status-warn:    #FFCC80; /* Soft Orange */

  /* ---------------- SHAPES ---------------- */
  /* Border Radius - "Super Round" */
  --radius-sm:     12px;    /* Tags, Badges */
  --radius-md:     20px;    /* Inner cards, Inputs */
  --radius-lg:     28px;    /* Main Cards */
  --radius-xl:     32px;    /* Floating Nav, Hero Sections */
  --radius-pill:   999px;   /* Buttons, Status Pills */

  /* ---------------- SHADOWS ---------------- */
  /* Soft, colored shadows instead of harsh black */
  --shadow-sm:     0 4px 12px rgba(44, 62, 46, 0.05);
  --shadow-md:     0 8px 24px rgba(44, 62, 46, 0.08);
  --shadow-float:  0 10px 30px rgba(44, 62, 46, 0.25); /* Floating Nav */
}
```

---

## 2. Typography

We use **DM Sans** (Geometric Sans-Serif) to maintain a modern, clean, and friendly aesthetic.

*   **Primary Font:** `DM Sans`, sans-serif.
*   **Headings:**
    *   **H1 (Page Title):** 28px / 700 Bold / Color: `--primary-dark`
    *   **H2 (Card Titles):** 18px / 700 Bold / Color: `--primary-dark`
    *   **H3 (Section Headers):** 16px / 700 Bold / Color: `--text-muted` (Uppercase, tracking wide)
*   **Body:**
    *   **Body Main:** 15px / 400 Regular / Color: `--text-main`
    *   **Caption:** 13px / 500 Medium / Color: `--text-muted`
*   **Labels/Buttons:**
    *   **CTA:** 16px / 600 SemiBold / Color: `--text-on-lime`

---

## 3. Component Library

### A. Buttons

Buttons should never have sharp corners. They are fully rounded (Pill shape).

1.  **Primary Action (CTA)**
    *   *Usage:* Upload Menu, Login, Confirm.
    *   *Style:* Background `--accent-lime`, Text `--text-on-lime`.
    *   *Shape:* Pill (`border-radius: 999px`).
    *   *Shadow:* `--shadow-md`.
2.  **Secondary Action**
    *   *Usage:* View Details, Filter.
    *   *Style:* Background `--bg-subtle` or Transparent, Text `--primary-dark`.
    *   *Icon:* Often circle-enclosed.
3.  **Floating Action Button (FAB)**
    *   *Usage:* The center "Add" button in the nav.
    *   *Style:* Square with rounded corners (`20px`), Border 4px solid `--bg-body` to create a "cutout" effect.

### B. Cards (The "Soft Card")

The card is the primary container for information.

*   **Background:** White (`#FFFFFF`).
*   **Border Radius:** `28px` (Crucial for the Organic feel).
*   **Padding:** `16px` internal padding.
*   **Shadow:** `--shadow-sm`.
*   **Behavior:**
    *   *Pressed State:* Scale down to `0.98` opacity `1.0`.
    *   *Layout:* Flex row. Image on left (80x80px), Content middle, Action right.

### C. Status Pills

Small badges to indicate menu availability.

*   **Shape:** Pill (`border-radius: 20px`).
*   **Padding:** `4px 12px`.
*   **Typography:** 12px Bold.
*   **Variants:**
    *   *Available:* Bg `rgba(76, 175, 80, 0.1)`, Text `--status-success`.
    *   *Missing:* Bg `rgba(255, 138, 128, 0.1)`, Text `--status-error`.

### D. Navigation (The "Floating Dock")

We do not use a standard tab bar attached to the bottom. We use a **Dock**.

*   **Position:** Fixed, Bottom `24px`.
*   **Width:** 90% of viewport (max 400px).
*   **Background:** `--primary-dark`.
*   **Border Radius:** `32px`.
*   **Icons:** `24px` size. Unselected opacity `0.5`, Selected color `--accent-lime`.

---

## 4. Iconography

Use consistent stroke-width icons.
*   **Library:** Remix Icons (ri-) or Feather Icons.
*   **Style:** Rounded endpoints.
*   **Usage:**
    *   `ri-home-4-fill` (Home)
    *   `ri-camera-fill` (Upload)
    *   `ri-user-smile-fill` (Profile)
    *   `ri-restaurant-2-line` (Food)

---

## 5. Layout & Spacing Rules

1.  **The "Thumb Zone":**
    *   Interactive elements (Navigation, Primary Buttons) must be in the bottom 40% of the screen.
    *   Top 20% is for "Read Only" headers and stats.
2.  **Whitespace:**
    *   Use generous margins. Do not cluster food courts.
    *   Gap between cards: `20px`.
3.  **Horizontal Scrolling:**
    *   Filters (Nearest, Veg, Etc) should be in a horizontal scroll container to save vertical space. Hide the scrollbar styling.

---

## 6. Accessibility & Usability Checklist

*   [ ] **Contrast:** Ensure text on `--accent-lime` is DARK (`#2C3E2E`), not White. White on Lime fails WCAG.
*   [ ] **Touch Targets:** All clickable buttons/icons must have a padded hit area of at least 44x44px.
*   [ ] **Contextual Upload:** Do not hide "Upload" in a menu. If a food court has no menu, place a Camera button directly on the card.
*   [ ] **Feedback:** When a file is uploading, show a progress bar in `--primary-dark`.

---

## 7. Implementation Guide (HTML Structure)

When building components, follow this hierarchy:

```html
<!-- CARD STRUCTURE -->
<div class="card">
  <!-- 1. Visual Anchor -->
  <div class="card-image"></div>
  
  <!-- 2. Content Stack -->
  <div class="card-content">
    <div class="row-between">
      <h3>Title</h3>
      <span class="badge">Distance</span>
    </div>
    <p class="subtitle">Location</p>
    <div class="status-indicator">...</div>
  </div>

  <!-- 3. Action Trigger -->
  <button class="icon-btn"></button>
</div>
```