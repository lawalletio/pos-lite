import CircleButton from "./CircleButton";

export interface MenuItemProps {
  name: string;
  price: number;
  quantity: number;
  onChange: (count: number) => void;
}

const MenuItem = ({ name, price, quantity, onChange }: MenuItemProps) => {
  return (
    <div className="flex flex-row justify-between gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20">
      <div className="flex flex-col">
        <h3 className="text-2xl font-bold">{name}</h3>
        <div className="text-lg">$ {price}</div>
      </div>
      <div className="flex flex-col items-center">
        <div className="flex flex-row content-center items-center justify-center gap-2">
          {quantity > 0 ? (
            <>
              <CircleButton onClick={() => onChange(quantity - 1)}>
                -
              </CircleButton>
              <div>{quantity}</div>
            </>
          ) : (
            ""
          )}

          <CircleButton onClick={() => onChange(quantity + 1)}>+</CircleButton>
        </div>
        {quantity > 0 ? <div>$ {quantity * price}</div> : ""}
      </div>
    </div>
  );
};

export default MenuItem;
