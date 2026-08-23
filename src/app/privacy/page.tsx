import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | NF3D Auto Bot",
  description: "Privacy policy for the NF3D Auto Bot social publishing service.",
};

export default function PrivacyPage() {
  return (
    <main className="policy-page">
      <article className="policy-card">
        <p className="policy-label">NF3D AUTO BOT</p>
        <h1>Privacy Policy</h1>
        <p>Last updated: 23 August 2026</p>

        <h2>About this service</h2>
        <p>
          NF3D Auto Bot is a private publishing tool operated by NewForest3D. It uses product information from the public NewForest3D Etsy shop to prepare and publish authorised social-media content.
        </p>

        <h2>Information processed</h2>
        <p>
          The service processes public Etsy listing details and the account identifiers, access tokens and publishing responses required to connect to authorised social-media accounts. It does not sell personal information or use connected-account data for advertising profiles.
        </p>

        <h2>How information is used</h2>
        <p>
          Connected-account information is used only to authenticate the service, identify the selected publishing destination, create authorised posts and record publication results.
        </p>

        <h2>Storage and security</h2>
        <p>
          Access credentials are stored as protected server-side environment variables and are not included in the public website code. Operational records may contain product URLs, publication status and social post URLs.
        </p>

        <h2>Sharing and retention</h2>
        <p>
          Information is shared only with Etsy, Pinterest and other connected platforms as needed to perform the requested publishing activity. Credentials and operational records are retained only while required to operate the service or meet legal obligations.
        </p>

        <h2>Your choices</h2>
        <p>
          Access can be revoked through the relevant social platform at any time. Connected credentials can also be removed from the service, which stops future automated publishing to that platform.
        </p>

        <h2>Contact</h2>
        <p>
          Privacy enquiries can be made through the public <a href="https://www.etsy.com/uk/shop/NewForest3D">NewForest3D Etsy shop</a>.
        </p>

        <a className="policy-back" href="/">Back to NF3D Auto Bot</a>
      </article>
    </main>
  );
}
