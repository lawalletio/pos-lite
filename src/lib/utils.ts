// Constants
import menuJSONFile from "../constants/menu.json";

// Libs
import bolt11 from "bolt11";

// Types
import type { IOrderEventContent } from "~/types/order";
import type { Event } from "nostr-tools";
import type { IMenuItem, MenuItemType } from "~/types/menu";

const menuJSON = menuJSONFile as unknown as MenuItemType[];

export const fetchMenuItems = (): IMenuItem[] => {
  return menuJSON.map((item) => {
    return { ...item, quantity: 0 };
  });
};

export const calcTotal = (items: IMenuItem[]) => {
  return items.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);
};

export const generateEventContent = ({
  amount,
  fiatAmount,
  fiatCurrency,
  items,
}: IOrderEventContent) => {
  return (
    "New order: \n<br />" +
    JSON.stringify({
      items,
      fiatAmount,
      fiatCurrency,
      amount,
    })
  );
};

export const parseOrderDescription = (event: Event): IOrderEventContent => {
  return JSON.parse(
    event.tags.find((tag) => tag[0] === "description")![1]!
  ) as IOrderEventContent;
};

export const parseZapInvoice = (event: Event): bolt11.PaymentRequestObject => {
  const paidInvoice = event.tags.find((tag) => tag[0] === "bolt11")?.[1];
  return bolt11.decode(paidInvoice!);
};
