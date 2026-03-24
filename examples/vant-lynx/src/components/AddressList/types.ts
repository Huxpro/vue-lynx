type Numeric = string | number;

export type AddressListAddress = {
  id: Numeric;
  tel: Numeric;
  name: string;
  address: string;
  isDefault?: boolean;
};

export type AddressListModelValue = Numeric | Numeric[];

export type AddressListThemeVars = {
  addressListPadding?: string;
  addressListDisabledTextColor?: string;
  addressListDisabledTextPadding?: string;
  addressListDisabledTextFontSize?: string;
  addressListDisabledTextLineHeight?: number | string;
  addressListAddButtonZIndex?: number | string;
  addressListItemPadding?: string;
  addressListItemTextColor?: string;
  addressListItemDisabledTextColor?: string;
  addressListItemFontSize?: string;
  addressListItemLineHeight?: number | string;
  addressListRadioColor?: string;
  addressListEditIconSize?: string;
};
