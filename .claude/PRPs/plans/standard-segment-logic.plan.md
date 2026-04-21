# Plan: Standard Segment Logic

## Summary
Add four standard segment category options (Attributes, Events, Device Attributes, Location) to the segment creation flow. When creating a dynamic segment, users pick a category first, which filters the available rule fields in SegmentRuleBuilder. This extends the existing rule system with new fields from `contactDevices`, `contactAttributes` (custom), and `contactEvents` (dynamic from DB), plus location fields already on contacts.

## User Story
As a marketer, I want to create segments by choosing a targeting category (Attributes, Events, Device Attributes, Location), so that I can quickly build rules relevant to my targeting intent without sifting through all available fields.

## Problem -> Solution
**Current:** Dynamic segments show a flat list of hardcoded fields (contact props + 5 events). No device targeting, no custom attributes, no dynamic event types from DB. Fields are static in the component.
**Desired:** User picks a standard segment category -> sees only relevant fields for that category. Attributes and Events load dynamically from `/api/attributes` and `/api/event-types`. Device fields come from known `contactDevices` columns. Location uses existing contact location fields.

## Metadata
- **Complexity**: Medium
- **Source PRD**: `docs/standard_segment-road_map.md`
- **PRD Phase**: Standard Segment Logic (first implementation)
- **Estimated Files**: 8-10

---

## UX Design

### Before
```
Create Segment
+-----------------------------+
| Name: [___________]        |
| Type: [Static] [Dynamic]   |
|                             |
| (Dynamic selected)          |
| Rules:                      |
|  Quick Templates grid       |
|  -- or build custom --      |
|  [Add Rule]                 |
|  Field dropdown (flat list) |
+-----------------------------+
```

### After
```
Create Segment
+-------------------------------+
| Name: [___________]          |
| Type: [Static] [Dynamic]     |
|                               |
| (Dynamic selected)            |
| Standard Segment Category:    |
| +-------------+-------------+ |
| | Attributes  | Events      | |
| | user props  | performed   | |
| +-------------+-------------+ |
| | Device Attr | Location    | |
| | model, OS   | IP/city     | |
| +-------------+-------------+ |
|                               |
| Rules:                        |
|  Quick Templates (filtered)   |
|  -- or build custom --        |
|  [Add Rule]                   |
|  Field dropdown (category-    |
|  filtered fields only)        |
+-------------------------------+
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Dynamic type selected | Shows SegmentRuleBuilder immediately with all fields | Shows category picker first, then SegmentRuleBuilder with filtered fields | Category picker uses same grid pattern as JourneyCreateModal trigger selector |
| Field dropdown in RuleRow | Flat list of ~17 hardcoded fields | Filtered by category. Attributes/Events fetched from API | Contact props + custom attrs for "Attributes"; event types from DB for "Events" |
| Quick Templates | Always show same 5 templates | Filter templates by selected category | Only show relevant templates per category |
| Switching categories | N/A | Resets rules (with confirmation if rules exist) | Prevents invalid cross-category rules |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `app/pages/audiences/segments/create.vue` | all | Page being modified |
| P0 | `app/components/segment/SegmentRuleBuilder.vue` | all | Core component - needs category-aware field filtering |
| P0 | `app/components/segment/SegmentRuleRow.vue` | 1-30, 111-118 | RuleField interface + fieldItems computed |
| P1 | `app/components/journey/JourneyCreateModal.vue` | 16-101 | Grid selector UI pattern to mirror |
| P1 | `shared/types/contact.ts` | 105-141, 225-245 | Segment types + Zod schemas |
| P1 | `server/api/attributes/index.get.ts` | all | Attributes API (fetch for dynamic fields) |
| P1 | `server/api/event-types/index.get.ts` | all | Event types API (fetch for dynamic fields) |
| P2 | `app/components/segment/SegmentRuleDisplay.vue` | 1-26 | FIELD_LABELS map - needs updating |
| P2 | `server/database/schema.ts` | 63-93, 100-141 | contacts + contactDevices + attributes + events tables |
| P2 | `app/composables/useSegments.ts` | all | Composable pattern reference |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Nuxt UI USelect | Nuxt UI docs | Supports grouped items via nested arrays |
| Nuxt useFetch | Nuxt docs | Reactive fetching with query watchers |

---

## Patterns to Mirror

### CATEGORY_SELECTOR_GRID
```vue
// SOURCE: app/components/journey/JourneyCreateModal.vue:78-101
<div class="grid grid-cols-2 gap-2">
  <button
    v-for="trigger in triggerOptions"
    :key="trigger.value"
    type="button"
    class="flex items-start gap-3 p-3 rounded-lg border text-left text-sm transition-all"
    :class="form.triggerType === trigger.value
      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'"
    @click="form.triggerType = trigger.value as typeof form.triggerType"
  >
    <UIcon :name="trigger.icon" class="w-5 h-5 mt-0.5 text-indigo-500 shrink-0" />
    <div>
      <div class="font-medium text-zinc-900 dark:text-white">{{ trigger.label }}</div>
      <div class="text-xs text-zinc-500 mt-0.5">{{ trigger.description }}</div>
    </div>
  </button>
</div>
```

### LABEL_PATTERN
```vue
// SOURCE: app/pages/audiences/segments/create.vue:54
<label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Name *</label>
```

### CARD_SECTION
```vue
// SOURCE: app/pages/audiences/segments/create.vue:47
<div class="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-6 space-y-5">
  <h2 class="text-lg font-semibold text-zinc-900 dark:text-white">Section Title</h2>
  ...
</div>
```

### FIELDS_DEFINITION
```typescript
// SOURCE: app/components/segment/SegmentRuleBuilder.vue:7-30
const FIELDS: RuleField[] = [
  { value: 'contact.email', label: 'Email', type: 'string', category: 'Contact Properties' },
  ...
]
```

### TEMPLATE_STRUCTURE
```typescript
// SOURCE: app/components/segment/SegmentRuleBuilder.vue:39-96
const TEMPLATES: Template[] = [
  { label: '...', description: '...', icon: '...', rules: { logic: 'and', rules: [...] } }
]
```

### API_FETCH_PATTERN
```typescript
// SOURCE: app/composables/useSegments.ts:21-24
const { data, status, refresh } = useFetch<ResponseType>('/api/endpoint', {
  query,
  watch: [query]
})
```

### RULE_ROW_FIELD_ITEMS
```typescript
// SOURCE: app/components/segment/SegmentRuleRow.vue:111-118
const fieldItems = computed(() => {
  const grouped = new Map<string, { label: string, value: string }[]>()
  for (const f of props.fields) {
    if (!grouped.has(f.category)) grouped.set(f.category, [])
    grouped.get(f.category)!.push({ label: f.label, value: f.value })
  }
  return Array.from(grouped.values())
})
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `shared/types/contact.ts` | UPDATE | Add `StandardSegmentCategory` type, update `SegmentRule` to optionally store category |
| `app/pages/audiences/segments/create.vue` | UPDATE | Add category picker UI before SegmentRuleBuilder, pass category prop |
| `app/components/segment/SegmentRuleBuilder.vue` | UPDATE | Accept `category` prop, filter FIELDS by category, fetch dynamic fields from API |
| `app/components/segment/SegmentRuleRow.vue` | NO CHANGE | Already generic - receives fields via props |
| `app/components/segment/SegmentRuleDisplay.vue` | UPDATE | Expand FIELD_LABELS to cover device + dynamic attribute/event fields |
| `app/components/segment/SegmentCategoryPicker.vue` | CREATE | Standalone category grid picker component |
| `app/pages/audiences/segments/[id].vue` | UPDATE | Pass category to SegmentRuleBuilder on edit (derive from existing rules) |
| `shared/types/contact.ts` | UPDATE | Add `standardSegmentCategory` to `createSegmentSchema` |
| `server/api/segments/index.post.ts` | NO CHANGE | Already stores rules as JSONB, category stored in rules or segment |

## NOT Building

- Backend segment evaluation engine (applying rules to filter contacts)
- Custom attribute creation from segment builder
- IP-to-location resolution service
- Device push notification targeting
- Cross-category rule mixing (one category per segment for now)
- Segment preview / estimated contact count

---

## Step-by-Step Tasks

### Task 1: Add StandardSegmentCategory type
- **ACTION**: Add type to `shared/types/contact.ts`
- **IMPLEMENT**:
  ```typescript
  export type StandardSegmentCategory = 'attributes' | 'events' | 'device' | 'location'
  ```
  Update `createSegmentSchema` to include optional `category`:
  ```typescript
  category: z.enum(['attributes', 'events', 'device', 'location']).optional(),
  ```
  Update `Segment` interface to include `category`:
  ```typescript
  category: StandardSegmentCategory | null
  ```
- **MIRROR**: Existing type patterns in `shared/types/contact.ts`
- **IMPORTS**: None needed (same file)
- **GOTCHA**: `updateSegmentSchema` derives from `createSegmentSchema.partial()` so it auto-inherits
- **VALIDATE**: `npx nuxi typecheck` passes

### Task 2: Add category column to segments table
- **ACTION**: Add `category` column to segments schema
- **IMPLEMENT**: In `server/database/schema.ts`, add to segments table:
  ```typescript
  category: varchar('category', { length: 50 }),
  ```
  Keep nullable - static segments and legacy dynamic segments won't have it.
- **MIRROR**: Schema patterns in `server/database/schema.ts`
- **IMPORTS**: None new
- **GOTCHA**: Need to generate + run migration after. Use `npx drizzle-kit generate` then `npx drizzle-kit push`
- **VALIDATE**: Migration generates clean, `npx drizzle-kit push` succeeds

### Task 3: Create SegmentCategoryPicker component
- **ACTION**: Create `app/components/segment/SegmentCategoryPicker.vue`
- **IMPLEMENT**:
  ```vue
  <script setup lang="ts">
  import type { StandardSegmentCategory } from '~~/shared/types/contact'

  const model = defineModel<StandardSegmentCategory | null>({ default: null })

  const categories = [
    { value: 'attributes' as const, label: 'Attributes', description: 'Target users based on their attributes', icon: 'i-lucide-user' },
    { value: 'events' as const, label: 'Events', description: 'Target users based on performed events', icon: 'i-lucide-zap' },
    { value: 'device' as const, label: 'Device Attributes', description: 'Target by device model, OS, app version', icon: 'i-lucide-smartphone' },
    { value: 'location' as const, label: 'Location', description: 'Target by IP address location', icon: 'i-lucide-map-pin' }
  ]
  </script>
  ```
  Template uses CATEGORY_SELECTOR_GRID pattern (2x2 grid with icon + label + description).
- **MIRROR**: CATEGORY_SELECTOR_GRID from JourneyCreateModal
- **IMPORTS**: `StandardSegmentCategory` from shared types
- **GOTCHA**: Use `v-model` pattern (`defineModel`) matching SegmentRuleBuilder convention
- **VALIDATE**: Component renders, clicking selects category

### Task 4: Update SegmentRuleBuilder to accept category + fetch dynamic fields
- **ACTION**: Modify `app/components/segment/SegmentRuleBuilder.vue`
- **IMPLEMENT**:
  1. Add `category` prop:
     ```typescript
     const props = defineProps<{ category?: StandardSegmentCategory | null }>()
     ```
  2. Define static fields per category:
     ```typescript
     const ATTRIBUTE_FIELDS: RuleField[] = [
       // Core contact properties
       { value: 'contact.email', label: 'Email', type: 'string', category: 'Contact Properties' },
       { value: 'contact.firstName', label: 'First Name', type: 'string', category: 'Contact Properties' },
       { value: 'contact.lastName', label: 'Last Name', type: 'string', category: 'Contact Properties' },
       { value: 'contact.phone', label: 'Phone', type: 'string', category: 'Contact Properties' },
       { value: 'contact.gender', label: 'Gender', type: 'string', category: 'Contact Properties' },
       { value: 'contact.language', label: 'Language', type: 'string', category: 'Contact Properties' },
       { value: 'contact.birthday', label: 'Birthday', type: 'date', category: 'Contact Properties' },
       { value: 'contact.tags', label: 'Tags', type: 'string', category: 'Contact Properties' },
     ]

     const DEVICE_FIELDS: RuleField[] = [
       { value: 'device.platform', label: 'Platform', type: 'string', category: 'Device' },
       { value: 'device.osVersion', label: 'OS Version', type: 'string', category: 'Device' },
       { value: 'device.appVersion', label: 'App Version', type: 'string', category: 'Device' },
       { value: 'device.deviceModel', label: 'Device Model', type: 'string', category: 'Device' },
       { value: 'device.lastActiveAt', label: 'Last Active', type: 'date', category: 'Device' },
     ]

     const LOCATION_FIELDS: RuleField[] = [
       { value: 'contact.city', label: 'City', type: 'string', category: 'Location' },
       { value: 'contact.province', label: 'Province', type: 'string', category: 'Location' },
       { value: 'contact.country', label: 'Country', type: 'string', category: 'Location' },
     ]
     ```
  3. Fetch dynamic fields for `attributes` and `events` categories:
     ```typescript
     const { data: attributesData } = useFetch<{ attributes: ContactAttribute[] }>('/api/attributes', {
       query: { limit: 100 },
       immediate: false
     })
     const { data: eventTypesData } = useFetch<{ eventTypes: EventType[] }>('/api/event-types', {
       query: { limit: 100 },
       immediate: false
     })
     ```
     Trigger fetch when category changes via `watch`.
  4. Build `computedFields` from category:
     ```typescript
     const computedFields = computed<RuleField[]>(() => {
       switch (props.category) {
         case 'attributes': {
           const customFields = (attributesData.value?.attributes || []).map(a => ({
             value: `attribute.${a.key}`,
             label: a.label,
             type: a.type === 'boolean' ? 'string' : a.type as RuleField['type'],
             category: a.category || 'Custom Attributes'
           }))
           return [...ATTRIBUTE_FIELDS, ...customFields]
         }
         case 'events': {
           const eventFields = (eventTypesData.value?.eventTypes || []).map(e => ({
             value: `event.${e.key}.count`,
             label: e.label,
             type: 'event_count' as const,
             category: e.category || 'Events'
           }))
           return eventFields.length ? eventFields : FALLBACK_EVENT_FIELDS
         }
         case 'device': return DEVICE_FIELDS
         case 'location': return LOCATION_FIELDS
         default: return FIELDS // fallback to all fields
       }
     })
     ```
  5. Pass `computedFields` to SegmentRuleRow instead of `FIELDS`
  6. Filter TEMPLATES by category
- **MIRROR**: FIELDS_DEFINITION, API_FETCH_PATTERN
- **IMPORTS**: `StandardSegmentCategory`, `ContactAttribute`, `EventType` from shared types
- **GOTCHA**: Keep backward compatibility - when no category prop passed (edit page legacy), use all FIELDS. `immediate: false` on fetches to avoid unnecessary requests.
- **VALIDATE**: Dev server - select each category, verify field dropdown shows correct fields

### Task 5: Update create.vue with category picker
- **ACTION**: Modify `app/pages/audiences/segments/create.vue`
- **IMPLEMENT**:
  1. Add `category` to form state:
     ```typescript
     const category = ref<StandardSegmentCategory | null>(null)
     ```
  2. Add category picker section between type toggle and rules:
     ```vue
     <div v-if="form.type === 'dynamic'">
       <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
         Segment Category
       </label>
       <SegmentCategoryPicker v-model="category" />
     </div>
     ```
  3. Show SegmentRuleBuilder only after category selected:
     ```vue
     <div v-if="form.type === 'dynamic' && category">
       <label ...>Rules</label>
       <SegmentRuleBuilder v-model="rules" :category="category" />
     </div>
     ```
  4. Include category in POST body:
     ```typescript
     body: {
       ...form,
       tags: ...,
       category: form.type === 'dynamic' ? category.value : undefined,
       ...(form.type === 'dynamic' && rules.value ? { rules: rules.value } : {})
     }
     ```
  5. Reset rules when category changes:
     ```typescript
     watch(category, () => { rules.value = null })
     ```
- **MIRROR**: LABEL_PATTERN, CARD_SECTION from create.vue
- **IMPORTS**: `StandardSegmentCategory` from shared types
- **GOTCHA**: Reset rules when category changes to prevent cross-category invalid rules
- **VALIDATE**: Dev server - full create flow: name -> dynamic -> pick category -> add rules -> create

### Task 6: Update SegmentRuleDisplay for new field labels
- **ACTION**: Expand FIELD_LABELS in `app/components/segment/SegmentRuleDisplay.vue`
- **IMPLEMENT**: Add device and location labels:
  ```typescript
  // Device
  'device.platform': 'Platform',
  'device.osVersion': 'OS Version',
  'device.appVersion': 'App Version',
  'device.deviceModel': 'Device Model',
  'device.lastActiveAt': 'Last Active',
  ```
  For dynamic attribute/event fields not in the map, use a fallback:
  ```typescript
  function getFieldLabel(field: string): string {
    if (FIELD_LABELS[field]) return FIELD_LABELS[field]
    // attribute.some_key -> Some Key
    if (field.startsWith('attribute.')) {
      return field.replace('attribute.', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    // event.some_event.count -> Some Event
    if (field.startsWith('event.') && field.endsWith('.count')) {
      return field.slice(6, -6).replace(/[_.]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    return field
  }
  ```
- **MIRROR**: Existing FIELD_LABELS pattern
- **IMPORTS**: None new
- **GOTCHA**: Dynamic fields from DB won't be in static map - fallback formatting needed
- **VALIDATE**: View existing dynamic segment detail - labels render correctly

### Task 7: Update segment detail page for category
- **ACTION**: Modify `app/pages/audiences/segments/[id].vue`
- **IMPLEMENT**:
  1. Show category badge on segment detail if present
  2. Pass `category` prop to SegmentRuleBuilder in edit mode
  3. Derive category from segment data: `segment.value?.category`
  4. For legacy segments without category, SegmentRuleBuilder falls back to showing all fields
- **MIRROR**: Existing detail page patterns
- **IMPORTS**: `StandardSegmentCategory`
- **GOTCHA**: Legacy segments won't have category - handle gracefully with fallback
- **VALIDATE**: View/edit segment with category, verify fields filter correctly

### Task 8: Generate and apply DB migration
- **ACTION**: Generate Drizzle migration for new `category` column
- **IMPLEMENT**:
  ```bash
  npx drizzle-kit generate
  npx drizzle-kit push
  ```
- **MIRROR**: Existing migration patterns in `server/database/migrations/`
- **IMPORTS**: N/A
- **GOTCHA**: Column is nullable - no data migration needed for existing rows
- **VALIDATE**: Migration runs clean, existing segments unaffected

---

## Testing Strategy

### Unit Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| Category type validation | Invalid category string | Zod rejects | Yes |
| Category type validation | 'attributes' | Zod accepts | No |
| Field filtering - attributes | category='attributes' | Returns contact props + custom attrs | No |
| Field filtering - events | category='events' | Returns event type fields | No |
| Field filtering - device | category='device' | Returns device fields only | No |
| Field filtering - location | category='location' | Returns city/province/country | No |
| Field filtering - null category | category=null | Returns all fields (backward compat) | Yes |
| Dynamic field label fallback | 'attribute.custom_field' | 'Custom Field' | Yes |

### Edge Cases Checklist
- [x] No category selected (dynamic type) - rules hidden, must pick category first
- [x] Category switch with existing rules - reset rules
- [x] Legacy segments without category - fallback to all fields
- [x] Empty attributes API response - show core contact fields only
- [x] Empty event types API response - show fallback hardcoded events
- [x] Static segment type - no category picker shown

---

## Validation Commands

### Type Check
```bash
npx nuxi typecheck
```
EXPECT: Zero type errors

### Dev Server
```bash
pnpm dev
```
EXPECT: No build errors, HMR working

### Database
```bash
npx drizzle-kit push
```
EXPECT: Schema synced, no errors

### Browser Validation
```
http://localhost:3000/audiences/segments/create
```
EXPECT:
1. Select Dynamic -> category picker appears (2x2 grid)
2. Pick "Attributes" -> rule builder shows contact + custom attribute fields
3. Pick "Events" -> rule builder shows event types from DB
4. Pick "Device Attributes" -> rule builder shows platform/OS/model fields
5. Pick "Location" -> rule builder shows city/province/country fields
6. Switch category -> rules reset
7. Create segment -> saves with category field
8. View segment detail -> shows category badge + correct fields in editor

### Manual Validation
- [ ] Dynamic segment: all 4 categories show correct fields
- [ ] Static segment: no category picker shown
- [ ] Category switch resets rules
- [ ] Legacy segments (no category) still work
- [ ] SegmentRuleDisplay handles new field names
- [ ] Dark mode renders correctly on category picker

---

## Acceptance Criteria
- [ ] All 4 standard segment categories selectable on create page
- [ ] Category picker uses grid selector pattern (matching JourneyCreateModal)
- [ ] Each category filters rule fields to relevant subset
- [ ] Attributes category loads custom attributes from API
- [ ] Events category loads event types from API
- [ ] Device category shows device model/OS/version fields
- [ ] Location category shows city/province/country fields
- [ ] Category persisted to segment record
- [ ] Edit page respects saved category
- [ ] Legacy segments without category work unchanged
- [ ] All validation commands pass

## Completion Checklist
- [ ] Code follows discovered patterns (grid selector, label styling, card sections)
- [ ] Error handling matches codebase style (no try/catch needed - useFetch handles)
- [ ] Dark mode styling on all new UI
- [ ] SegmentRuleDisplay updated for new fields
- [ ] No hardcoded values (field definitions use constants)
- [ ] No unnecessary scope additions
- [ ] Self-contained - no questions needed during implementation

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Large attributes/events list overwhelms dropdown | Medium | Low | Limit fetch to 100, add search to USelect if needed |
| Category change loses user rules | Low | Medium | Confirm dialog before reset (or just reset since user just started) |
| Legacy segments break | Low | High | Null category = show all fields (backward compat) |

## Notes
- `contactDevices` schema already exists with platform, osVersion, appVersion, deviceModel, lastActiveAt
- Location fields (city, province, country) already exist on contacts table - no new schema needed
- Custom attributes and event types already have CRUD APIs (`/api/attributes`, `/api/event-types`)
- SegmentRuleRow is already generic (receives fields via props) - no changes needed there
- Backend rule evaluation engine (actually filtering contacts by rules) is NOT part of this plan - that's a separate feature
