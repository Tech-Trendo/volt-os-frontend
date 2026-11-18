import React from "react";
import { getPublicFaqs, getPublicPage, strField } from "@/lib/cms";
import { EditableText } from "@/components/editor/editable";
import { FaqAccordion } from "@/components/public/faq-accordion";

export default async function FaqPage() {
  const [page, faqs] = await Promise.all([getPublicPage("faq"), getPublicFaqs()]);
  const sections = page.sections;

  return (
    <div className="w-full px-4 py-14 sm:px-6 lg:px-10 xl:px-14">
      <div className="mb-10 space-y-3">
        <EditableText
          as="p"
          className="text-xs font-semibold uppercase tracking-wider text-accent"
          value={strField(sections, "faq.header", "eyebrow", "Frequently Asked Questions")}
          label="FAQ Eyebrow"
          cmsPath="/pages"
        />
        <EditableText
          as="h1"
          className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
          value={strField(sections, "faq.header", "title", "EV Charging & Import FAQs")}
          label="FAQ Heading"
          cmsPath="/pages"
        />
        <EditableText
          as="p"
          className="text-base text-muted"
          value={strField(
            sections,
            "faq.header",
            "subtitle",
            "Answers on Nepal NEA 3-phase requirements, warranty coverage, customs clearance, and installation timelines.",
          )}
          label="FAQ Subtitle"
          cmsPath="/pages"
        />
      </div>

      <FaqAccordion
        faqs={faqs.map((item) => ({
          id: String(item.id),
          question: item.question,
          answer: item.answer,
          category: item.category || "General",
        }))}
      />
    </div>
  );
}
