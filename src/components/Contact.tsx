import React from "react";

export const Contact: React.FC = () => (
  <section className="section contact" id="contact" aria-label="contact">
    <div className="container">
      <div className="contact-content">
        <p className="section-subtitle">Contact</p>
        <h2 className="h2 section-title">Get In Touch</h2>
        <p className="section-text">
          To get in contact with me please fill out this form or send me an email through the link below at any time.
          Thank you!
        </p>
        <ul className="contact-list">
          <li className="contact-item">
	    <ion-icon name="call-outline" className="contact-icon"></ion-icon>
            <a href="tel:9372052799" className="contact-link">(937)-205-2799</a>
          </li>
          <li className="contact-item">
	    <ion-icon name="mail-open-outline" className="contact-icon"></ion-icon>
            <a href="mailto:zylardmccullah@gmail.com" className="contact-link">zylardmccullah@gmail.com</a>
          </li>
        </ul>
	</div>

      <form action="mailto:zylardmccullah@gmail.com" method="POST" className="contact-form">
        <input type="text" name="name" placeholder="Name" required className="input-field" />
        <input type="email" name="email_address" placeholder="Email" required className="input-field" />
        <textarea name="message" placeholder="Message" required className="input-field"></textarea>
        <button type="submit" className="submit-btn">
          <span className="span">Submit</span>
        </button>
      </form>
    </div>
  </section>
);

