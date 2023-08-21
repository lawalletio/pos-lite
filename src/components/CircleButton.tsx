export const CircleButton = ({
  children,
  onClick,
}: React.HTMLProps<HTMLButtonElement>) => {
  return (
    <button
      onClick={onClick}
      className="flex h-10  w-10 cursor-pointer flex-col items-center justify-center rounded-full bg-white/10 p-0 p-0 text-2xl hover:bg-white/20"
    >
      {children}
    </button>
  );
};

export default CircleButton;
