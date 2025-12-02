"use client";
import { useState } from "react";
type Status = "idle" | "loading" | "success" | "error";
export default function IntegrationsPage() {
  // WhatsApp form state
const [waPhoneNumber, setWaPhoneNumber] = useState("");
const [waPhoneNumberId, setWaPhoneNumberId] = useState("");
const [waBusinessId, setWaBusinessId] = useState("");
const [waStatus, setWaStatus] = useState<Status>("idle");
const [waAccessToken, setWaAccessToken] = useState("");
// Instagram form state
const [igBusinessId, setIgBusinessId] = useState("");
const [waMessage, setWaMessage] = useState("");
const [igPageId, setIgPageId] = useState("");
const [igAccessToken, setIgAccessToken] = useState("");
const [igStatus, setIgStatus] = useState<Status>("idle");
const [igMessage, setIgMessage] = useState("");
const handleWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaStatus("loading");
    setWaMessage("");
    try {
    const res = await fetch("/api/integrations/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        phoneNumber: waPhoneNumber,
        phoneNumberId: waPhoneNumberId,
        businessId: waBusinessId,
        accessToken: waAccessToken,
        }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to save WhatsApp integration");
    }
    setWaStatus("success");
    setWaMessage("WhatsApp integration saved successfully.");
    } catch (err: any) {
    setWaStatus("error");
    setWaMessage(err.message || "Something went wrong.");
    }
};
const handleInstagramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIgStatus("loading");
    setIgMessage("");
    try {
    const res = await fetch("/api/integrations/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        instagramBusinessId: igBusinessId,
        pageId: igPageId,
        accessToken: igAccessToken,
        }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to save Instagram integration");
    }
    setIgStatus("success");
    setIgMessage("Instagram integration saved successfully.");
    } catch (err: any) {
    setIgStatus("error");
    setIgMessage(err.message || "Something went wrong.");
    }
};
return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 p-6">
    <header>
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
        Connect WhatsApp and Instagram so your AI agent can reply on those channels.
        </p>
    </header>
      {/* WhatsApp Card */}
    <section className="rounded-xl border bg-background p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Connect WhatsApp</h2>
        <p className="mt-1 text-sm text-muted-foreground">
        Use WhatsApp Cloud API. Copy these values from your Meta Developer app (WhatsApp).
        </p>
        <form onSubmit={handleWhatsAppSubmit} className="mt-4 space-y-4">
        <div>
            <label className="block text-sm font-medium">
            Business WhatsApp Number
            </label>
            <input
            type="text"
            value={waPhoneNumber}
            onChange={(e) => setWaPhoneNumber(e.target.value)}
            placeholder="+91XXXXXXXXXX"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
            The number your customers will message on WhatsApp.
            </p>
        </div>
        <div>
            <label className="block text-sm font-medium">
            Phone Number ID
            </label>
            <input
            type="text"
            value={waPhoneNumberId}
            onChange={(e) => setWaPhoneNumberId(e.target.value)}
            placeholder="WhatsApp phone_number_id from Cloud API"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring"
            />
        </div>
        <div>
            <label className="block text-sm font-medium">
            WhatsApp Business Account ID
            </label>
            <input
            type="text"
            value={waBusinessId}
            onChange={(e) => setWaBusinessId(e.target.value)}
            placeholder="WhatsApp business account ID"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring"
            />
        </div>
        <div>
            <label className="block text-sm font-medium">
            Permanent Access Token
            </label>
            <input
            type="password"
            value={waAccessToken}
            onChange={(e) => setWaAccessToken(e.target.value)}
            placeholder="EAAGx... (Meta access token)"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
            Store this securely. This lets AutoSupport send replies through your WhatsApp number.
            </p>
        </div>
        {waMessage && (
            <p
            className={`text-sm ${
                waStatus === "success" ? "text-green-600" : "text-red-600"
            }`}
            >
            {waMessage}
            </p>
        )}
        <button
            type="submit"
            disabled={waStatus === "loading"}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
            {waStatus === "loading" ? "Saving..." : "Save WhatsApp Integration"}
        </button>
        </form>
    </section>
      {/* Instagram Card */}
    <section className="rounded-xl border bg-background p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Connect Instagram</h2>
        <p className="mt-1 text-sm text-muted-foreground">
        Connect your Instagram Business account using Meta&apos;s Messenger API for Instagram.
        </p>
        <form onSubmit={handleInstagramSubmit} className="mt-4 space-y-4">
        <div>
            <label className="block text-sm font-medium">
            Instagram Business Account ID
            </label>
            <input
            type="text"
            value={igBusinessId}
            onChange={(e) => setIgBusinessId(e.target.value)}
            placeholder="IG Business ID from Meta"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring"
            />
        </div>
        <div>
            <label className="block text-sm font-medium">
            Facebook Page ID (linked to IG)
            </label>
            <input
            type="text"
            value={igPageId}
            onChange={(e) => setIgPageId(e.target.value)}
            placeholder="Page ID connected with your IG Business"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring"
            />
        </div>
        <div>
            <label className="block text-sm font-medium">
            Permanent Access Token
            </label>
            <input
            type="password"
            value={igAccessToken}
            onChange={(e) => setIgAccessToken(e.target.value)}
            placeholder="EAAGx... (Meta access token with IG permissions)"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
            The token must have instagram_basic, pages_messaging, whatsapp_business_messaging
            (if combined) permissions.
            </p>
        </div>
        {igMessage && (
            <p
            className={`text-sm ${
                igStatus === "success" ? "text-green-600" : "text-red-600"
            }`}
            >
            {igMessage}
            </p>
        )}
        <button
            type="submit"
            disabled={igStatus === "loading"}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
            {igStatus === "loading" ? "Saving..." : "Save Instagram Integration"}
        </button>
        </form>
    </section>
    </div>
);
}