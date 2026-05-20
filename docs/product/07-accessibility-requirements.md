# Accessibility Requirements

## Purpose
Define the accessibility expectations for both the kiosk customer experience and the admin area.

## Accessibility Target
- `NFR-A11Y-001`: The project should be designed with WCAG 2.2 AA-oriented accessibility goals in mind.
- `NFR-A11Y-002`: Accessibility should be treated as an important product quality goal from the start, even if some improvements are refined later.

## Kiosk Interaction
- `NFR-A11Y-003`: The kiosk experience shall be designed as a clickable, touch-friendly web interface.
- `NFR-A11Y-004`: The interface shall also support keyboard navigation for accessibility and testing purposes.
- `NFR-A11Y-005`: Interactive elements such as buttons, controls, and item cards should provide tap-friendly target sizes.

## Visual Accessibility
- `NFR-A11Y-006`: The product shall support both light mode and dark mode.
- `NFR-A11Y-007`: The product should provide a contrast-oriented display option where practical.
- `NFR-A11Y-008`: The product shall support a larger text mode or similar text-scaling-friendly presentation.
- `NFR-A11Y-009`: Important statuses, selections, and errors should not rely on color alone whenever practical.
- `NFR-A11Y-010`: Visible focus states should be preserved for supported navigation flows.

## Content And Feedback
- `NFR-A11Y-011`: Customer-facing error messages shall use clear, non-technical language.
- `NFR-A11Y-012`: Instructions on kiosk screens shall be short and easy to understand.
- `NFR-A11Y-013`: Checkout and payment status messaging shall be especially clear to reduce confusion.
- `NFR-A11Y-014`: Important user actions should be clearly confirmed through visible feedback.

## Forms And Inputs
- `NFR-A11Y-015`: Admin login and registration forms shall use clear labels.
- `NFR-A11Y-016`: Validation messages shall explain what the user needs to fix.
- `NFR-A11Y-017`: Required fields shall be clearly marked.

## Navigation
- `NFR-A11Y-018`: Customers shall be able to return to a previous step before payment completion where this does not break order integrity.
- `NFR-A11Y-019`: The current step in the ordering flow should be clear to the user.
- `NFR-A11Y-020`: The basket summary should remain easy to access during ordering.

## Motion And Loading
- `NFR-A11Y-021`: Heavy or distracting animations should be avoided.
- `NFR-A11Y-022`: Loading and waiting states should provide feedback when needed for user understanding.

## Admin Area
- `NFR-A11Y-023`: The admin area should follow the same accessibility direction as the kiosk experience.
- `NFR-A11Y-024`: The admin area shall be designed for web usage and should remain usable on common modern screens.

## MVP Accessibility Scope
- `NFR-A11Y-025`: For the MVP, the core accessible flow shall support menu browsing, adding items to the basket, and reviewing the order summary before checkout.
- `NFR-A11Y-026`: Accessibility enhancements such as advanced contrast controls, theme customization, larger text improvements, and broader WCAG refinements may be expanded after the first MVP.

## Notes
- Requirements `NFR-A11Y-009` and `NFR-A11Y-010` are included as recommended baseline accessibility assumptions because they align with good WCAG-oriented practice.
- Stripe payment support is a functional/payment concern and should not be treated as an accessibility feature, even though its UI states must remain accessible.
