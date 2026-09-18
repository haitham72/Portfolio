import Link from "next/link";
import { COPY } from "@/lib/placeholders";

/** Lightweight CTA banner for sub-pages — the full booking form lives at "/#book" on the homepage. */
export default function BookingCTA() {
  return (
    <section className="border-y border-text-alt/10 px-6 py-20 text-center sm:px-10">
      <h2 className="text-sub-3 tracking-tight text-text-hi">{COPY.bookingHeadline}</h2>
      <p className="mx-auto mt-4 max-w-md text-body text-text-alt">Have a brief in mind? Let&apos;s talk through it.</p>
      <Link href="/#book" className="btn-pill btn-pill--solid mt-8 inline-flex">
        Book a call
      </Link>
    </section>
  );
}
