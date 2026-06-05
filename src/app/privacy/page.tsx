export const metadata = {
  title: "Privacy Policy — Perseo Social Publisher",
};

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif", color: "#1a1a1a", lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: "#666", marginBottom: 40 }}>Perseo Social Publisher &mdash; Last updated: June 4, 2026</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>1. Overview</h2>
        <p>Perseo Social Publisher (&ldquo;the App&rdquo;) is a tool developed by Perseo Agency to help businesses manage and publish content on Facebook and Instagram. This policy explains what data we access and how we use it.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>2. Data We Access</h2>
        <p>To provide its services, the App requests the following Facebook permissions:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li><strong>ads_read</strong> &mdash; Read ad performance and competitor research from the Meta Ads Library.</li>
          <li><strong>pages_manage_posts</strong> &mdash; Publish and schedule posts on Pages you manage.</li>
          <li><strong>pages_read_engagement</strong> &mdash; Read engagement data from Pages you manage.</li>
          <li><strong>pages_show_list</strong> &mdash; List the Pages associated with your account.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>3. How We Use Your Data</h2>
        <p>Data accessed through the Meta API is used exclusively to:</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Publish and schedule social media content on your behalf.</li>
          <li>Analyze ad performance for strategic reporting.</li>
          <li>Research public competitor ads in the Meta Ads Library.</li>
        </ul>
        <p style={{ marginTop: 12 }}>We do not sell, share, or transfer your data to third parties.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>4. Data Storage</h2>
        <p>Access tokens and account identifiers are stored securely and used only during active sessions. We do not store personal messages, private user data, or financial information.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>5. Data Deletion</h2>
        <p>You may request deletion of your data at any time by contacting us at <a href="mailto:perseo.agency.suporte@gmail.com" style={{ color: "#0066cc" }}>perseo.agency.suporte@gmail.com</a>. Upon request, we will remove all data associated with your account within 30 days.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>6. Contact</h2>
        <p>For questions about this policy, contact us at:<br />
        <a href="mailto:perseo.agency.suporte@gmail.com" style={{ color: "#0066cc" }}>perseo.agency.suporte@gmail.com</a></p>
      </section>

      <hr style={{ borderColor: "#eee", marginTop: 48, marginBottom: 24 }} />
      <p style={{ color: "#999", fontSize: 13 }}>&copy; 2026 Perseo Agency. All rights reserved.</p>
    </main>
  );
}
