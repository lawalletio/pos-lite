import Head from "next/head";
import { useRouter } from "next/router";
import MenuItem from "~/components/MenuItem";
import { useMenu } from "~/contexts/Menu";

export default function Home() {
  const { menuItems, total, setMenuItems, checkOut } = useMenu();

  const router = useRouter();

  const setQuantity = (menuIndex: number, quantity: number) => {
    setMenuItems!((items) => {
      items[menuIndex]!.quantity = quantity;
      return [...items];
    });
  };

  const nextStep = async () => {
    const { invoice, eventId } = await checkOut!();

    console.dir(invoice);
    // alert(invoice.invoice);
    void router.push(`/checkout/${eventId}`);
  };

  return (
    <>
      <Head>
        <title>La Crypta - POS Light</title>
        <meta name="description" content="La Crypta POS" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-6 px-4 py-6 ">
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-[3rem]">
            La Crypta POS
          </h1>
          <div className="flex w-full flex-col gap-4">
            {menuItems.map((item, k) => (
              <MenuItem
                key={k}
                name={item.name}
                price={item.price}
                quantity={item.quantity}
                onChange={setQuantity.bind(null, k)}
              />
            ))}
          </div>
          {total > 0 ? (
            <div className="absolute bottom-5 w-full p-5 text-white">
              <button
                onClick={() => void nextStep()}
                className="w-full rounded-xl bg-slate-300/20 p-5"
              >
                Pagar ARS {total}
              </button>
            </div>
          ) : (
            ""
          )}
        </div>
      </main>
    </>
  );
}
