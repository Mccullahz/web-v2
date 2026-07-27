import React from "react";
import { IoCallOutline, IoMailOpenOutline } from "react-icons/io5";

export const Contact: React.FC = () => (
  <section id="contact" aria-label="contact" className="px-6 py-20">
    <div className="mx-auto max-w-4xl">
      <div data-reveal className="mb-10 flex items-baseline gap-3">
        <span className="font-mono text-sm text-acc">04</span>
        <h2 className="font-poppins text-2xl font-bold tracking-tight text-ink">Contact</h2>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div data-reveal className="grid gap-10 rounded-2xl border border-line bg-surf p-6 md:grid-cols-2 md:p-10">
        {/* content */}
        <div>
          <h3 className="mb-4 font-poppins text-2xl font-extrabold tracking-tight text-ink">Get in touch</h3>

          <p className="mb-8 font-poppins leading-relaxed text-mut">
            To get in contact with me, please fill out the form or reach out directly using the contact
            details below. And yes, this form is functional!
          </p>

          <ul className="space-y-5">
            <li className="flex items-center gap-4">
              <IoMailOpenOutline className="text-2xl text-acc" />
              <a href="mailto:zylardmccullah@gmail.com" className="font-mono text-sm text-ink transition-colors hover:text-acc">
                zylardmccullah@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-4">
              <IoCallOutline className="text-2xl text-acc" />
              <a href="tel:9372052799" className="font-mono text-sm text-ink transition-colors hover:text-acc">
                (937) 205-2799
              </a>
            </li>
          </ul>
        </div>

        {/* form: submits to /contact.html so Netlify receives the POST; static form in public/contact.html is used for build-time form detection */}
        <form
          name="contact"
          method="POST"
          data-netlify="true"
          data-netlify-honeypot="bot-field"
          action="/contact.html"
          className="grid gap-5 font-poppins"
        >
          <input type="hidden" name="form-name" value="contact" />
          <input type="hidden" name="_redirect" value="/#contact" />
          <p className="absolute -left-[9999px]" aria-hidden="true">
            <label>
              Don't fill this out: <input name="bot-field" tabIndex={-1} autoComplete="off" />
            </label>
          </p>

          <input
            type="text"
            name="name"
            placeholder="Name"
            required
            className="w-full rounded-md border border-line bg-bg px-4 py-3 font-poppins text-ink placeholder:text-faint focus:border-acc focus:outline-none"
          />
          <input
            type="email"
            name="email_address"
            placeholder="Email"
            required
            className="w-full rounded-md border border-line bg-bg px-4 py-3 font-poppins text-ink placeholder:text-faint focus:border-acc focus:outline-none"
          />
          <textarea
            name="message"
            placeholder="Message"
            required
            rows={5}
            className="w-full rounded-md border border-line bg-bg px-4 py-3 font-poppins text-ink placeholder:text-faint focus:border-acc focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-linear-to-b from-acc2 to-acc px-8 py-3 font-mono text-sm font-bold text-onacc transition-transform hover:-translate-y-0.5"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  </section>
);
