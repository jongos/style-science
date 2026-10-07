# Landing Page Validation

Checked 7 October 2026 in Chromium with Playwright 1.63.0 and axe-core 4.13.0.

- Viewport widths: 320, 390, 768 and 1440 pixels. No horizontal document overflow; eight commitments present; local Inter font loaded; anchor destinations present; no browser errors or missing assets.
- Range control: keyboard increment changed the value from 24 to 25 and the first circle from x=208 to x=205. Maximum interval placed the last circle at x=448, within the drawing area.
- Automated WCAG A/AA checks: zero violations at each width. One incomplete contrast result concerned the decorative downward arrow because it is a non-text character. Manual review confirmed ink on paper, 13.33:1. The arrow is hidden from assistive technology; its link has descriptive text.
- Exact sRGB contrast calculations using the GDC engine: ink/paper 13.33:1; secondary text/paper 5.77:1; red/paper 5.41:1; secondary text/dark panel 9.00:1; signal/dark panel 13.10:1. Ratios here are rounded only for reporting.
- Dazzler heading audit: all 12 headings passed. GDC core: all four conformance test groups passed.
- Rendered desktop, narrow-screen reading flow and interactive panel visually inspected. Mobile navigation was refined after the first render.

These checks establish selected delivery properties. They do not establish complete accessibility conformance, cultural universality or a human-rated improvement in design quality.
