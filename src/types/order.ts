import type { IMenuItem } from "./menu";

export interface IOrderEventContent {
  items: IMenuItem[];
  fiatAmount: number;
  fiatCurrency: string;
  amount: number;
}
