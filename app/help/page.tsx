import React from 'react';
import { Metadata } from "next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // Assuming shadcn/ui

export const metadata: Metadata = {
    title: "Help & FAQ | Home Construction Planner",
};

export default function HelpPage() {
  // TODO: Populate with actual FAQs and help content
  const faqs = [
    { q: "How do I create a new project?", a: "Navigate to the main dashboard and click the '+ Create New Project' button." },
    { q: "How does budget tracking work?", a: "Go to the 'Budget' section of your project. You can add categories (e.g., 'Kitchen Appliances', 'Labor') and then log planned and actual expenses for each." },
    { q: "Can I invite my contractor?", a: "Yes! Team collaboration is a Pro feature. Upgrade your account, then go to the 'Team' section of your project to send invitations." },
    { q: "How do I export a PDF report?", a: "PDF exports are available for Pro users. Navigate to the 'Budget' or other relevant section and look for the 'Export PDF' button." },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-gray-900 dark:text-gray-100">Help & Frequently Asked Questions</h1>

        <Accordion type="single" collapsible className="w-full space-y-4">
             {faqs.map((faq, index) => (
                 <AccordionItem value={`item-${index}`} key={index} className="border rounded-lg px-4 bg-white dark:bg-gray-800 shadow-sm">
                    <AccordionTrigger className="text-left hover:no-underline font-medium text-gray-800 dark:text-gray-200">
                        {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-400 pt-2 pb-4">
                        {faq.a}
                    </AccordionContent>
                 </AccordionItem>
             ))}
        </Accordion>

        <div className="mt-10 text-center">
             <h2 className="text-xl font-semibold mb-2">Need More Help?</h2>
             <p className="text-gray-600 dark:text-gray-400">
                 Contact our support team at <a href="mailto:support@homeplanner.app" className="text-blue-600 hover:underline dark:text-blue-400">support@homeplanner.app</a>.
             </p>
        </div>
    </div>
  );
}
