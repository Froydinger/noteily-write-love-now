

## Plan: Enable Arc AI to Create Checklists

Arc currently can only create regular notes via the `onCreateNote` callback. When a user asks Arc to make a checklist, it should create a checklist note and populate it with checklist items in the database.

### Changes

#### 1. Update `ArcPanel` props and `applyToNote` logic
**File: `src/components/notes/ArcPanel.tsx`**

- Add a new prop: `onCreateChecklist?: (title: string, items: string[]) => void`
- Update the AI system prompt to instruct Arc that when the user asks for a checklist, it should format the response as a special markdown checklist using `- [ ]` syntax
- Add a detection function `isChecklistResponse(content: string)` that checks if the AI response contains checklist items (lines starting with `- [ ]` or `- [x]`)
- Update `applyToNote` to detect checklist responses: if checklist format is detected, call `onCreateChecklist` instead of `onCreateNote`
- Add a second "Apply" button variant for checklist responses (e.g., "Create as Checklist")

#### 2. Update AI system prompt to support checklists
**File: `supabase/functions/ai-assist/index.ts`**

Add to the system prompt instructions like:
- When asked to create a checklist, todo list, or task list, format items using markdown checklist syntax: `- [ ] Item text`
- Start with a title on the first line, then list items

#### 3. Wire up checklist creation in Index page
**File: `src/pages/Index.tsx`**

- Pass `onCreateChecklist` to `ArcPanel` that:
  1. Calls `addNote("checklist")` to create a checklist note
  2. Inserts checklist items into the `checklist_items` table via Supabase
  3. Navigates to the new note

#### 4. Wire up checklist creation in NotePage
**File: `src/pages/NotePage.tsx`**

- Pass `onCreateChecklist` to `ArcPanel` similarly (creates a new checklist note even when viewing an existing note)

### Technical Detail

The checklist detection parses the AI response for lines matching `- [ ]` or `- [x]` patterns. Each matched line becomes a row in `checklist_items` with `note_id`, `content`, `completed` (based on `[x]`), and `position` (sequential index). The title is extracted from the first non-checklist line or the user's prompt.

