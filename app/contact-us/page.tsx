"use client";

import { useState } from "react";
import {
  Check,
  Facebook,
  Headset,
  Instagram,
  Mail,
  Phone,
  Pin,
  WhatsApp,
} from "@/components/icons";
import { PageHeader } from "@/components/section";
import { site } from "@/lib/site";
import { useBrand } from "@/lib/store-context";

export default function ContactPage() {
  const brand = useBrand();
  const hotline = brand?.contactPhone ?? site.hotline;
  const hotlineHref = `tel:${hotline.replace(/[^\d+]/g, "")}`;
  const email = brand?.contactEmail ?? site.email;
  const address = brand?.address ?? site.address;

  const [sent, setSent] = useState(false);

  return (
    <>
      <PageHeader
        title="Contact Us"
        description="Call, message or write — whichever is fastest for you."
        breadcrumb={[{ label: "Contact Us" }]}
      />

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-line p-6">
          <h2 className="text-base font-bold">Send a message</h2>
          {sent ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-lg bg-primary-soft px-4 py-10 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-white">
                <Check className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="font-semibold text-primary-dark">Message noted</p>
              <p className="max-w-sm text-sm text-ink">
                This demo form does not send email yet. Wire it to your inbox or CRM
                in <code className="rounded bg-white px-1">app/contact-us/page.tsx</code>.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-1 text-sm font-semibold text-primary hover:underline"
              >
                Write another message
              </button>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setSent(true);
              }}
              className="mt-4 grid gap-4 sm:grid-cols-2"
            >
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">Your name</span>
                <input
                  required
                  name="name"
                  autoComplete="name"
                  className="w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-primary"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">Mobile number</span>
                <input
                  required
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className="w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-primary"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1.5 block font-medium">Email (optional)</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-primary"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1.5 block font-medium">Subject</span>
                <select
                  name="subject"
                  className="w-full rounded-lg border border-line bg-white px-3 py-2.5 outline-none focus:border-primary"
                >
                  <option>Product question</option>
                  <option>Order status</option>
                  <option>Return or warranty</option>
                  <option>Bulk / corporate order</option>
                  <option>Something else</option>
                </select>
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1.5 block font-medium">Message</span>
                <textarea
                  required
                  name="message"
                  rows={5}
                  className="w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-primary"
                />
              </label>
              <button
                type="submit"
                className="w-max rounded-full bg-primary px-7 py-3 text-sm font-bold text-white transition hover:bg-primary-dark sm:col-span-2"
              >
                Send Message
              </button>
            </form>
          )}
        </div>

        <aside className="h-max space-y-5 rounded-xl border border-line p-6 text-sm">
          <h2 className="text-base font-bold">Reach us directly</h2>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-semibold">Hotline 24/7</p>
              <a href={hotlineHref} className="text-muted hover:text-primary">
                {hotline}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-semibold">Email</p>
              <a href={`mailto:${email}`} className="text-muted hover:text-primary">
                {email}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Pin className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-semibold">Showroom</p>
              <p className="text-muted">{address}</p>
              <p className="mt-1 text-muted">{site.hours}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Headset className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-semibold">Chat</p>
              <div className="mt-2 flex gap-2">
                <a
                  href={site.social.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="grid h-9 w-9 place-items-center rounded-full border border-line transition hover:border-primary hover:text-primary"
                >
                  <WhatsApp className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href={site.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="grid h-9 w-9 place-items-center rounded-full border border-line transition hover:border-primary hover:text-primary"
                >
                  <Facebook className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href={site.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="grid h-9 w-9 place-items-center rounded-full border border-line transition hover:border-primary hover:text-primary"
                >
                  <Instagram className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
