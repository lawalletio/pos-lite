import type { IMenuItem } from "~/types/menu";
import menuJSONFile from "../constants/menu.json";

type MenuItemType = { id: string; name: string; price: number };

const menuJSON = menuJSONFile as unknown as MenuItemType[];

export const fetchMenuItems = (): IMenuItem[] => {
  console.dir(menuJSON);
  return menuJSON.map((item) => {
    return { ...item, quantity: 0 };
  });
};

export const calcTotal = (items: IMenuItem[]) => {
  return items.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);
};
