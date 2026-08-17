import type { Numeric } from '../../utils';

export type ContactListItem = {
  id: Numeric;
  tel: Numeric;
  name: string;
  isDefault?: boolean;
};

export type ContactListThemeVars = {
  contactListPadding?: string;
  contactListEditIconSize?: string;
  contactListAddButtonZIndex?: number | string;
  contactListRadioColor?: string;
  contactListItemPadding?: string;
};
