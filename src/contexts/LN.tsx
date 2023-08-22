// React
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Interface
export interface ILNContext {
  recipientPubkey?: string;
  callbackUrl?: string;
  destination?: string;
}

import { requestPayServiceParams } from "lnurl-pay";

// Context
export const LNContext = createContext<ILNContext>({});

// Component Props
interface ILNProviderProps {
  children: React.ReactNode;
}

const DESTINATION_LNURL = process.env.NEXT_PUBLIC_DESTINATION!;

export const LNProvider = ({ children }: ILNProviderProps) => {
  const [recipientPubkey, setRecipientPubkey] = useState<string>();
  const [callbackUrl, setCallbackUrl] = useState<string>();

  const fetchLNURL = useCallback(async () => {
    const lud06 = await requestPayServiceParams({
      lnUrlOrAddress: DESTINATION_LNURL,
    });

    // TODO: Check if lud06 is valid
    setRecipientPubkey(lud06.rawData.nostrPubkey as string);
    setCallbackUrl(lud06.callback);
  }, []);

  useEffect(() => {
    void fetchLNURL();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LNContext.Provider
      value={{ recipientPubkey, callbackUrl, destination: DESTINATION_LNURL }}
    >
      {children}
    </LNContext.Provider>
  );
};

// Export hook
export const useLN = () => {
  return useContext(LNContext);
};
