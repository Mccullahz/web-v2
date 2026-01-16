import React from "react";
import { IoCallOutline, IoMailOpenOutline } from "react-icons/io5";

export const Contact: React.FC = () => (
  <section
    id="contact"
    aria-label="contact"
    className=" bg-[#D2DBDD] py-32 min-h-screen"
  >
    <div className="mx-auto grid max-w-6xl gap-16 px-6 md:grid-cols-2">

      {/* content */}
      <div>
        <p className="mb-4 font-poppins text-sm font-semibold uppercase tracking-widest text-sky-500">
          Contact
        </p>

        <h2 className="mb-6 font-poppins text-3xl font-extrabold text-black">
          Get In Touch
        </h2>

        <p className="mb-10 font-poppins text-gray-700">
          To get in contact with me, please fill out the form or reach out directly
          using the contact details below.
        </p>

        <ul className="space-y-6">
          <li className="flex items-center gap-4">
            <IoCallOutline className="text-2xl text-sky-500" />
            <a
              href="tel:9372052799"
              className="font-poppins font-medium text-black hover:text-sky-500 animate-pulse"
            >
              (937) 205-2799
            </a>
          </li>

          <li className="flex items-center gap-4">
            <IoMailOpenOutline className="text-2xl text-sky-500" />
            <a
              href="mailto:zylardmccullah@gmail.com"
              className="font-poppins font-medium text-black hover:text-sky-500 animate-pulse"
            >
              zylardmccullah@gmail.com
            </a>
          </li>
        </ul>
      </div>

      {/* form -- switched to netlify's form detection. given this gets built into the html on deployment, this should work */}
      <form
        name="contact"
	method="POST"
	data-netlify="true"
	className="grid gap-6 text-black font-poppins"
      >
	<input type="hidden" name="form-name" value="contact" />

	<input
          type="text"
          name="name"
          placeholder="Name"
          required
          className="w-full rounded-md border border-black/20 text-black px-4 py-3 font-poppins focus:border-sky-500 focus:outline-none"
        />

        <input
          type="email"
          name="email_address"
          placeholder="Email"
          required
          className="w-full rounded-md border border-black/20 text-black px-4 py-3 font-poppins focus:border-sky-500 focus:outline-none"
        />

        <textarea
          name="message"
          placeholder="Message"
          required
          rows={5}
          className="w-full rounded-md border border-black/20 text-black px-4 py-3 font-poppins focus:border-sky-500 focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md bg-sky-500 px-8 py-3 font-poppins font-semibold text-white transition-colors hover:bg-sky-600"
        >
          Submit
        </button>
      </form>
    </div>
  </section>
);
