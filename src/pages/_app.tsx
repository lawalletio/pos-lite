import { type AppType } from "next/dist/shared/lib/utils";
import { MenuProvider } from "~/contexts/Menu";
import "~/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <MenuProvider>
      <Component {...pageProps} />
    </MenuProvider>
  );
};

export default MyApp;
