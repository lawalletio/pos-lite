import { type AppType } from "next/dist/shared/lib/utils";
import { LNProvider } from "~/contexts/LN";
import { MenuProvider } from "~/contexts/Menu";
import { NostrProvider } from "~/contexts/Nostr";
import "~/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <LNProvider>
      <NostrProvider>
        <MenuProvider>
          <Component {...pageProps} />
        </MenuProvider>
      </NostrProvider>
    </LNProvider>
  );
};

export default MyApp;
