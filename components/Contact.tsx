"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE, VIEWPORT, fadeUp, stagger } from "@/lib/anim";
import SectionHeading from "@/components/ui/SectionHeading";
import { PrimaryButton, GhostButton } from "@/components/ui/Buttons";

type ContactForm = {
  company: string;
  contact: string;
  email: string;
  country: string;
  productArea: string;
  interest: string;
  message: string;
};

const INITIAL_FORM: ContactForm = {
  company: "",
  contact: "",
  email: "",
  country: "",
  productArea: "HIV / Antiretrovirals",
  interest: "Licensing",
  message: "",
};

const PRODUCT_AREAS = [
  "HIV / Antiretrovirals",
  "Hospital Anti-Infectives",
  "Public Health Therapeutics",
  "Other",
];

const INTERESTS = [
  "Licensing",
  "Co-development",
  "Registration Support",
  "Tender Strategy",
  "Commercialization",
  "Other",
];

const INPUT_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-frost placeholder:text-muted focus:border-pulse/50 focus:outline-none focus:ring-1 focus:ring-pulse/30 transition-colors duration-300";

const LABEL_CLASS =
  "mb-2 block font-mono text-[0.65rem] uppercase tracking-[0.25em] text-silver";

type FieldChangeEvent = ChangeEvent<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>;

type TextFieldProps = {
  id: string;
  name: keyof ContactForm;
  label: string;
  value: string;
  onChange: (e: FieldChangeEvent) => void;
  type?: "text" | "email";
  placeholder?: string;
  autoComplete?: string;
};

function TextField({
  id,
  name,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className={INPUT_CLASS}
      />
    </div>
  );
}

type SelectFieldProps = {
  id: string;
  name: keyof ContactForm;
  label: string;
  value: string;
  onChange: (e: FieldChangeEvent) => void;
  options: string[];
};

function SelectField({
  id,
  name,
  label,
  value,
  onChange,
  options,
}: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className={`${INPUT_CLASS} cursor-pointer appearance-none pr-10`}
        >
          {options.map((option) => (
            <option key={option} value={option} className="bg-navy text-frost">
              {option}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          fill="none"
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

/** Staggered row inside the form — keeps the reveal rhythm consistent. */
function FormRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

export default function Contact() {
  const [form, setForm] = useState<ContactForm>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleChange = (e: FieldChangeEvent) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setSubmitted(false);
  };

  return (
    <section id="contact" className="relative overflow-hidden section-pad">
      {/* ------- decorative field ------- */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 hairline" />
        {/* bio radial glow behind the form panel */}
        <div className="absolute right-[4%] top-[28%] h-[32rem] w-[32rem] rounded-full bg-bio/[0.05] blur-3xl" />
        <div className="absolute -left-28 bottom-[-8rem] h-[24rem] w-[24rem] rounded-full bg-pulse/[0.04] blur-3xl" />
        <div className="absolute left-0 top-0 h-[30rem] w-[38rem] bg-grid-faint opacity-70 [mask-image:radial-gradient(ellipse_70%_60%_at_25%_20%,black,transparent_75%)]" />
      </div>

      <div className="shell relative">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* ------- left · heading + identity ------- */}
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="09 · Contact"
              title="Start a Strategic Discussion"
              highlight={["Strategic"]}
              sub="We invite manufacturers and international partners to open a structured conversation about bringing critical therapies to the Algerian market."
            />

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              variants={stagger(0.1, 0.2)}
              className="mt-12"
            >
              <motion.div variants={fadeUp} className="hairline" />

              <motion.div variants={fadeUp} className="mt-10 space-y-3">
                <p className="font-display text-lg font-medium text-frost">
                  Adventum Pharma
                </p>
                <p className="flex items-center gap-2.5 text-sm text-silver">
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4 shrink-0 text-pulse"
                  >
                    <path
                      d="M12 21s-6.5-5.4-6.5-10.3A6.5 6.5 0 0 1 12 4.2a6.5 6.5 0 0 1 6.5 6.5C18.5 15.6 12 21 12 21z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="10.7"
                      r="2.2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                  Algiers, Algeria
                </p>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-muted">
                  Partnerships · BD &amp; Licensing
                </p>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-8 inline-flex items-center gap-2.5 rounded-full glass px-4 py-2"
              >
                <span
                  aria-hidden
                  className="h-1 w-1 rounded-full bg-bio animate-pulse-soft"
                />
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-silver">
                  Response within a few business days
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* ------- right · form panel ------- */}
          <div className="relative lg:col-span-7">
            {/* soft bloom hugging the panel */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-8 rounded-[2.5rem] bg-bio/[0.04] blur-3xl"
            />

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              variants={fadeUp}
              className="relative overflow-hidden rounded-3xl glass-strong card-shadow p-8 md:p-10"
            >
              {/* top-edge light */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
              />

              <AnimatePresence mode="wait" initial={false}>
                {submitted ? (
                  <motion.div
                    key="confirmation"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.8, ease: EASE },
                    }}
                    exit={{
                      opacity: 0,
                      y: -16,
                      transition: { duration: 0.45, ease: EASE },
                    }}
                    className="flex min-h-[32rem] flex-col items-center justify-center py-10 text-center"
                  >
                    <div className="relative">
                      <span
                        aria-hidden
                        className="absolute inset-0 -m-6 rounded-full bg-bio/10 blur-2xl"
                      />
                      <svg
                        viewBox="0 0 64 64"
                        fill="none"
                        className="relative h-16 w-16 text-bio"
                        aria-hidden
                      >
                        <motion.circle
                          cx="32"
                          cy="32"
                          r="27"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1, ease: EASE, delay: 0.2 }}
                        />
                        <motion.path
                          d="M22 33.5l7 7 13.5-15"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.6, ease: EASE, delay: 0.9 }}
                        />
                      </svg>
                    </div>

                    <h3 className="mt-8 font-display text-display-md font-medium text-frost">
                      Thank you.
                    </h3>
                    <p className="mt-4 max-w-sm text-base leading-relaxed text-silver">
                      Our partnerships team will come back to you shortly.
                    </p>

                    <div className="mt-10">
                      <GhostButton onClick={handleReset}>
                        Send another inquiry
                      </GhostButton>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    initial="hidden"
                    whileInView="visible"
                    viewport={VIEWPORT}
                    variants={stagger(0.08, 0.1)}
                    exit={{
                      opacity: 0,
                      y: -16,
                      transition: { duration: 0.45, ease: EASE },
                    }}
                    className="space-y-6"
                  >
                    <FormRow className="flex items-center justify-between gap-4">
                      <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-muted">
                        Partnership Inquiry
                      </p>
                      <span
                        aria-hidden
                        className="hidden h-px flex-1 max-w-[8rem] bg-gradient-to-l from-transparent to-white/15 sm:block"
                      />
                    </FormRow>

                    <FormRow className="grid gap-6 md:grid-cols-2">
                      <TextField
                        id="contact-company"
                        name="company"
                        label="Company Name"
                        value={form.company}
                        onChange={handleChange}
                        placeholder="Your organization"
                        autoComplete="organization"
                      />
                      <TextField
                        id="contact-person"
                        name="contact"
                        label="Contact Person"
                        value={form.contact}
                        onChange={handleChange}
                        placeholder="Full name"
                        autoComplete="name"
                      />
                    </FormRow>

                    <FormRow className="grid gap-6 md:grid-cols-2">
                      <TextField
                        id="contact-email"
                        name="email"
                        label="Email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="name@company.com"
                        autoComplete="email"
                      />
                      <TextField
                        id="contact-country"
                        name="country"
                        label="Country"
                        value={form.country}
                        onChange={handleChange}
                        placeholder="Country of operation"
                        autoComplete="country-name"
                      />
                    </FormRow>

                    <FormRow className="grid gap-6 md:grid-cols-2">
                      <SelectField
                        id="contact-product-area"
                        name="productArea"
                        label="Product Area"
                        value={form.productArea}
                        onChange={handleChange}
                        options={PRODUCT_AREAS}
                      />
                      <SelectField
                        id="contact-interest"
                        name="interest"
                        label="Partnership Interest"
                        value={form.interest}
                        onChange={handleChange}
                        options={INTERESTS}
                      />
                    </FormRow>

                    <FormRow>
                      <label htmlFor="contact-message" className={LABEL_CLASS}>
                        Message
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        rows={5}
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Outline your portfolio, objectives and the collaboration you have in mind."
                        className={`${INPUT_CLASS} resize-none`}
                      />
                    </FormRow>

                    <FormRow className="pt-2">
                      <PrimaryButton type="submit" className="w-full">
                        Start a Strategic Discussion
                      </PrimaryButton>
                    </FormRow>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              variants={fadeUp}
              className="mt-5 text-center text-xs text-muted lg:text-left"
            >
              Submitted information is used only to respond to your inquiry.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
