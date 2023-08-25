import Head from "next/head";
import { useMenu } from "~/contexts/Menu";
import QRCode from "react-qr-code";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useNostr } from "~/contexts/Nostr";
import { validateEvent, type Event } from "nostr-tools";
import bolt11 from "bolt11";
import { useLN } from "~/contexts/LN";
import { useOrder } from "~/contexts/Order";

export default function Home() {
  const { invoice } = useMenu();
  const { subscribeZap, getEvent } = useNostr();
  const { recipientPubkey } = useLN();
  const { orderId, setOrderEvent, amount, fiatAmount } = useOrder();

  const {
    query: { orderId: queryOrderId },
  } = useRouter();

  // Fetch order if not already fetched
  useEffect(() => {
    if (!queryOrderId) {
      return;
    }

    if (queryOrderId === orderId) {
      console.info("Order already fetched");
      return;
    }

    console.info("Fetching order...");
    void getEvent!(queryOrderId as string).then((event) => {
      if (!event) {
        alert("Order not found");
        return;
      }

      console.info("Setting new order");
      setOrderEvent!(event);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryOrderId]);

  // Subscribe for zaps
  useEffect(() => {
    if (!orderId) {
      return;
    }
    console.info(`Subscribing for ${orderId}...`);
    const sub = subscribeZap!(orderId, onZap);

    return () => {
      sub.unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const onZap = (event: Event) => {
    if (event.pubkey !== recipientPubkey) {
      throw new Error("Invalid Recipient Pubkey");
    }

    if (!validateEvent(event)) {
      throw new Error("Invalid event");
    }

    const paidInvoice = event.tags.find((tag) => tag[0] === "bolt11")?.[1];
    const decodedPaidInvoice = bolt11.decode(paidInvoice!);
    const decodedInvoice = bolt11.decode(invoice!);

    if (invoice !== paidInvoice) {
      console.dir(invoice);
      console.dir(paidInvoice);
      alert("Invoices don't match!");
      return;
    }
    console.info("invoice: ");
    console.dir(decodedInvoice);

    console.info("paidInvoice: ");
    console.dir(decodedPaidInvoice);

    alert("Amount paid:" + decodedPaidInvoice.millisatoshis);
  };
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
          <div className="text-4xl text-white">{amount} sats</div>
          <div className="text-3xl text-white">ARS {fiatAmount}</div>
        </div>
      </main>
    </>
  );
}
