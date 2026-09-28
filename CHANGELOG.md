# Changelog

All notable changes to the Yalla MVP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Search Functionality**: Full-text search across experiences with real-time filtering
- **Keyboard Shortcuts**: Power user navigation with `1`, `2`, `3` for tabs, `Esc` for back, `?` for help
- **Keyboard Shortcuts Help Modal**: Floating button and modal showing all available shortcuts
- **Page Transitions**: Smooth fade and slide animations between views
- **Back to Top Button**: Appears after scrolling 500px, smooth scroll to top
- **Progress Bar Component**: Reusable progress indicator with multiple colors and sizes
- **Capacity Indicator**: Visual progress bar showing booking capacity on experience details
- **Low Availability Warning**: Highlights when only 3 or fewer spots remain

### Enhanced
- **Explore Page**: Added search bar with clear button and result count
- **Experience Details**: Added capacity progress bar with color-coded availability
- **Navigation**: Added keyboard shortcut support for all main tabs
- **User Experience**: Smoother transitions between all views

## [1.2.0] - 2026-01-XX

### Added
- **Toast Notification System**: Global toast notifications with success, error, and info types
- **Error Boundary**: Global error handling with user-friendly error screen
- **Loading Skeletons**: Professional loading states for all major pages
- **Avatar Component**: Dynamic user avatars with initials and consistent colors
- **Confirm Dialog**: Reusable confirmation dialog with danger, warning, and info variants
- **Image Integration**: AI-generated images for all experiences and states
- **Scroll Restoration**: Automatic scroll-to-top on navigation
- **Accessibility Improvements**: Enhanced ARIA labels and keyboard navigation

### Enhanced
- **Booking Flow**: Animated success and waitlist states with ping/pulse effects
- **Profile Page**: Avatar integration in header
- **Arrival Mode**: Toast notifications for all action submissions
- **Feedback Flow**: Toast notifications and improved success state
- **Support Flow**: Toast notifications for all submission types
- **My Plans**: ConfirmDialog for cancellation, toast for reconfirmation
- **Experience Details**: Real images instead of gradients, better visual hierarchy

### Fixed
- Invalid Tailwind classes (`w-4.5 h-4.5` → `w-5 h-5`)
- Type safety issues in Feedback page
- Missing scroll restoration on navigation
- Unused imports and variables

## [1.1.0] - 2026-01-XX

### Added
- **Design System Overhaul**: New semantic token architecture
- **Component Library**: 20+ reusable components
- **RTL Support**: Full Arabic language support with RTL layout
- **Responsive Design**: Mobile-first approach with tablet and desktop optimizations
- **Accessibility**: WCAG 2.2 AA compliance
- **State Management**: React Context + useReducer with type-safe actions
- **Mock Data**: Comprehensive synthetic data for all entities

### Enhanced
- **Navigation**: Simplified from 4 tabs to 3 tabs
- **Status Panel**: Direct answers instead of Q&A format
- **Experience Cards**: Real images with gradient overlays
- **Dialogs**: Focus trap, escape handling, scroll lock
- **Forms**: Consistent styling and validation
- **Buttons**: Clear hierarchy with primary, secondary, ghost, and danger variants

### Changed
- Color palette to semantic tokens (surface, text-primary/secondary/tertiary, border, brand, accent)
- Radius system to 6/8/12/16px
- Elevation system to xs/sm/md/lg
- Motion tokens with ease-out and ease-spring curves

## [1.0.0] - 2026-01-XX

### Added
- Initial MVP release
- Experience discovery with 3 curated experiences
- Booking flow with synthetic payments
- Waitlist management
- Reconfirmation system
- Arrival mode with protected venue access
- Post-experience feedback
- Profile management with data privacy controls
- Support and reporting system
- Staff operations dashboard
- Bilingual support (English and Arabic)
- Mock data for all entities
- Basic responsive design

---

## Legend

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
- **Enhanced**: Improvements to existing features

---

## Version History

### Version Numbering

- **Major** (X.0.0): Breaking changes, major new features
- **Minor** (0.X.0): New features, enhancements (backwards compatible)
- **Patch** (0.0.X): Bug fixes, minor improvements (backwards compatible)

### Release Cadence

- **Major releases**: Quarterly
- **Minor releases**: Monthly
- **Patch releases**: As needed

---

## Migration Guides

### 1.0.0 → 1.1.0

No breaking changes. All existing functionality preserved.

**New Design Tokens:**
- Update color references to use semantic tokens
- Update radius values to new system
- Update elevation values to new system

**Component Changes:**
- Dialog now has focus trap (automatic)
- StatusPanel uses direct answers (automatic)
- Navigation reduced to 3 tabs (automatic)

### 1.1.0 → 1.2.0

No breaking changes. All existing functionality preserved.

**New Features:**
- Toast notifications available via `useToast()` hook
- Error boundary wraps entire app (automatic)
- Loading skeletons shown on initial page load (automatic)
- Images now loaded from URLs (automatic)

**Type Changes:**
- Feedback page `lang` prop now properly typed as `'en' | 'ar'`

---

## Upcoming Features

See [ROADMAP.md](./ROADMAP.md) for planned features and timeline.

---

## Contributing

When adding new features, please update this changelog following the format above.

---

<div align="center">

**Building the future of curated experiences**

[README](./README.md) • [ROADMAP](./ROADMAP.md) • [Enhancements](./YALLA_ENHANCEMENTS.md)

</div>
