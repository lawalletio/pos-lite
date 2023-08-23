import Head from "next/head";
import { useMenu } from "~/contexts/Menu";
import QRCode from "react-qr-code";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useNostr } from "~/contexts/Nostr";
import type { Event } from "nostr-tools";

export default function Home() {
  const { invoice, total, totalSats } = useMenu();

  const { subscribeZap } = useNostr();

  const {
    query: { eventId },
  } = useRouter();

  const onZap = (event: Event) => {
    console.info("Zappeada!!");
    console.dir(event);
  };

  useEffect(() => {
    if (!eventId) {
      return;
    }
    console.info("eventId", eventId);

    console.info("START");
    const sub = subscribeZap!(eventId as string, onZap);

    return () => {
      sub.unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);
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
