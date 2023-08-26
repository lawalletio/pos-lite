import Head from "next/head";
import { useMenu } from "~/contexts/Menu";
import QRCode from "react-qr-code";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useNostr } from "~/contexts/Nostr";
import { validateEvent, type Event } from "nostr-tools";
import bolt11 from "bolt11";
import { useLN } from "~/contexts/LN";
import { useOrder } from "~/contexts/Order";
import { parseZapInvoice } from "~/lib/utils";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const { invoice } = useMenu();
  const { subscribeZap, getEvent } = useNostr();
  const { recipientPubkey } = useLN();
  const {
    orderId,
    setOrderEvent,
    addZapEvent,
    zapEvents,
    amount,
    fiatAmount,
    pendingAmount,
  } = useOrder();

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
      setIsLoading(false);
      return;
    }

    console.info("Fetching order...");
    void getEvent!(queryOrderId as string).then((event) => {
      if (!event) {
        alert("Order not found");
        setIsLoading(false);
        return;
      }

      console.info("Setting new order");
      setOrderEvent!(event);
      setIsLoading(false);
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
      console.info("FROM ZAP:");
    }
    console.info("invoice: ");
    console.dir(decodedInvoice);

    console.info("paidInvoice: ");
    console.dir(decodedPaidInvoice);

    addZapEvent!(event);
    console.info("Amount paid:" + decodedPaidInvoice.millisatoshis);
  };
  return (
    <>
      <Head>
        <title>La Crypta - Checkout</title>
        <meta name="description" content="La Crypta POS - Checkout" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-6 px-4 py-6 ">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-[3rem]">
            La Crypta POS
          </h1>
          {isLoading ? (
            <div>Cargando...</div>
          ) : (
            <div>
              <div className="bg-white px-24 py-12 text-5xl text-black">
                {pendingAmount <= 0 ? (
                  <div>Pagado</div>
                ) : (
                  <QRCode width={"200%"} value={invoice ?? "nothing"} />
                )}
              </div>
              <div className="text-3xl">ARS {fiatAmount}</div>
              <div className="text-4xl">{amount} sats</div>
              {pendingAmount > 0 ? (
                <div className="text-3xl">Pendiente {pendingAmount} sats</div>
              ) : (
                ""
              )}
              {pendingAmount < 0 ? (
                <div className="text-3xl text-green-500">
                  Propina +{-pendingAmount} sats
                </div>
              ) : (
                ""
              )}

              <div>
                <h2>Pagos</h2>
                <div>
                  {zapEvents.map((event, k) => {
                    const invoice = parseZapInvoice(event);
                    const previousEvent = JSON.parse(
                      event.tags.find((tag) => tag[0] === "description")![1]!
                    ) as Event;

                    console.info("event: ");
                    console.dir(event);
                    console.info("previousEvent: ");
                    console.dir(previousEvent);
                    console.info("invoice: ");
                    console.dir(invoice);
                    return (
                      <div key={k}>
                        <div>
                          {parseInt(invoice.millisatoshis!) / 1000} sats
                        </div>
                        <div>{invoice.timestamp}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
