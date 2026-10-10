import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ReferralBanner } from "@/components/ReferralBanner";
import { getSettings, getReps } from "@/lib/data";
import { settingsFromRows, waLink } from "@/lib/site";

export default async function SiteLayout({ children }) {
  const [settingsRows, reps] = await Promise.all([getSettings(), getReps()]);
  const settings = settingsFromRows(settingsRows);
  const waHref = waLink(settings, null);

  return (
    <>
      <Navbar brandName={settings.brand_name} brandAccent={settings.brand_accent} waHref={waHref} />
      <ReferralBanner reps={reps} />
      <main>{children}</main>
      <Footer text={settings.footer_text} />
    </>
  );
}
