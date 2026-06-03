import { IS_GATEWAY_SITE } from "@/lib/site-variant";
import { GatewayHomePage } from "@/components/home/GatewayHomePage";
import { MarketingHomePage } from "@/components/home/MarketingHomePage";

export default function HomePage() {
  return IS_GATEWAY_SITE ? <GatewayHomePage /> : <MarketingHomePage />;
}
