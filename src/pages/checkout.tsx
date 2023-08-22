import Head from "next/head";
import { useMenu } from "~/contexts/Menu";
import QRCode from "react-qr-code";

export default function Home() {
  const { invoice, total, totalSats } = useMenu();

  // console.dir("decode:");
  // console.dir(decode(invoice!));
  return (
    <>
      <Head>
        <title>La Crypta - Checkout</title>
        <meta name="description" content="La Crypta POS - Checkout" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-6 px-4 py-6 ">
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-[3rem]">
            La Crypta POS
          </h1>
          <div className="bg-white p-2">
            <QRCode value={invoice ?? "nothing"} />
          </div>
          <div className="text-4xl text-white">{totalSats} sats</div>
          <div className="text-3xl text-white">ARS {total}</div>
        </div>
      </main>
    </>
  );
}
