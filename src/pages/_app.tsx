import { type AppType } from "next/dist/shared/lib/utils";
import { LNProvider } from "~/contexts/LN";
import { MenuProvider } from "~/contexts/Menu";
import { NostrProvider } from "~/contexts/Nostr";
import { OrderProvider } from "~/contexts/Order";
import "~/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <LNProvider>
      <NostrProvider>
        <OrderProvider>
          <MenuProvider>
            <Component {...pageProps} />
          </MenuProvider>
        </OrderProvider>
      </NostrProvider>
    </LNProvider>
  );
};

export default MyApp;
