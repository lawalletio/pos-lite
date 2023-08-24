export interface MenuItemType {
  id: string;
  name: string;
  price: number;
}
export interface IMenuItem extends MenuItemType {
  quantity: number;
}
