export type AddressEditSearchItem = {
  name?: string;
  address?: string;
};

export type AddressEditInfo = {
  tel: string;
  name: string;
  city: string;
  county: string;
  province: string;
  areaCode: string;
  isDefault?: boolean;
  addressDetail: string;
};

export type AddressEditExpose = {
  setAreaCode: (code?: string) => void;
  setAddressDetail: (value: string) => void;
};
