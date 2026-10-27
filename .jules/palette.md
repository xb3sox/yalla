## 2026-10-27 - Accessible ARIA Labels and Focus Ring for Social Share Actions
**Learning:** Micro-action buttons inside dialogs (e.g. truncated social share options like 'Wh', 'Tw', 'Em') lack screen reader labels and focus-visible rings if created as raw text placeholders. Adding descriptive bilingual `aria-label`s and `focus-visible:outline-*` ensures full accessibility for screen reader and keyboard users.
**Action:** Always provide full `aria-label`s and `focus-visible` ring classes on icon or abbreviated action buttons within modal dialogs.
