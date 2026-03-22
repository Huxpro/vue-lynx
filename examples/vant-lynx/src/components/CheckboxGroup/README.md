# CheckboxGroup 复选框组

## 与 Vant 的差异

| Feature | Status | Reason |
|---------|--------|--------|
| role/aria | N/A | Lynx has no ARIA attributes |
| useChildren/useParent | Adapted | Uses manual provide/inject + registerChild pattern instead of @vant/use |
| useCustomFieldValue | N/A | @vant/use composable not ported; Form integration uses provide/inject |
| `<div>` tag | Adapted | Renders `<view>` instead (Lynx has no HTML tags) |
