import Head from "next/head";
import { useMenu } from "~/contexts/Menu";
import QRCode from "react-qr-code";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useNostr } from "~/contexts/Nostr";
import { type Event, validateEvent } from "nostr-tools";
import bolt11 from "bolt11";
import { useLN } from "~/contexts/LN";
import { useOrder } from "~/contexts/Order";
import { parseZapInvoice } from "~/lib/utils";
import { Progress } from "react-sweet-progress";
import "react-sweet-progress/lib/style.css";
import type { NDKEvent } from "@nostr-dev-kit/ndk";

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
    totalPaid,
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
      setOrderEvent!(event as Event);
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryOrderId]);

  // Subscribe for zaps
  useEffect(() => {
    if (!orderId || !recipientPubkey) {
      return;
    }
    console.info(`Subscribing for ${orderId}...`);
    const sub = subscribeZap!(orderId);

    sub.addListener("event", onZap);

    return () => {
      sub.removeAllListeners();
      sub.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, recipientPubkey]);

  const onZap = (event: NDKEvent) => {
    if (event.pubkey !== recipientPubkey) {
      throw new Error("Invalid Recipient Pubkey");
    }

    if (!validateEvent(event)) {
      throw new Error("Invalid event");
    }

    const paidInvoice = event.tags.find((tag) => tag[0] === "bolt11")?.[1];
    const decodedPaidInvoice = bolt11.decode(paidInvoice!);

    if (invoice !== paidInvoice) {
      console.info("Zap received");
    }

    addZapEvent!(event as Event);
    console.info("Amount paid : " + decodedPaidInvoice.millisatoshis);
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
              <div className="bg-white px-4 py-12 text-5xl text-black md:px-24">
                {pendingAmount <= 0 ? (
                  <div>Pagado</div>
                ) : (
                  <a href={`lightning://${invoice}`}>
                    <QRCode width={"200%"} value={invoice ?? "nothing"} />
                  </a>
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

              <div className="flex w-full flex-col justify-center">
                <Progress
                  type="circle"
                  percent={((totalPaid / amount) * 100).toFixed(2)}
                  status={totalPaid >= amount ? "success" : "active"}
                />
              </div>
              <div>
                {zapEvents.length < 1 ? (
                  <div>Sin pagos</div>
                ) : (
                  <h2>Zaps recibidos</h2>
                )}
                <div>
                  {zapEvents.map((event, k) => {
                    const invoice = parseZapInvoice(event);
                    const previousEvent = JSON.parse(
                      event.tags.find((tag) => tag[0] === "description")![1]!
                    ) as NDKEvent;
                    return (
                      <div key={k} className="border-2 border-solid p-4">
                        <div>{previousEvent.pubkey}</div>
                        <div>
                          {parseInt(invoice.millisatoshis!) / 1000} sats
                        </div>
                        <div>Timestamp: {invoice.timestamp}</div>
                        <div>{previousEvent.content}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <a target="_blank" href={`https://primal.net/e/${orderId}`}>
                  Ver post
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
