# Checkbox 复选框

## 与 Vant 的差异

| Feature | Status | Reason |
|---------|--------|--------|
| role/aria-checked/tabindex | N/A | Lynx has no ARIA or keyboard focus model |
| cursor styles | N/A | Lynx is touch-only, no cursor styling |
| ::before pseudo-element | Adapted | Icon uses `<text>` with font-family instead |
| dot shape | N/A | Requires complex CSS pseudo-element (`::before`/`::after`) |
| useCustomFieldValue | N/A | @vant/use composable not ported; Form integration uses provide/inject |
| user-select: none | N/A | Lynx has no text selection |
| overflow: hidden | Omitted | Lynx handles overflow differently |
