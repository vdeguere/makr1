import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-[clamp(3rem,10vh,6rem)] px-[clamp(1rem,4vw,2rem)] bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-fluid-xl mx-auto text-center">
          <h1 className="text-fluid-3xl md:text-fluid-4xl font-bold mb-fluid-4">
            Frequently Asked Questions
          </h1>
          <p className="text-fluid-lg text-muted-foreground max-w-fluid-lg mx-auto">
            Find answers to common questions about our platform, Traditional Thai Medicine, and how to get started
          </p>
        </div>
      </section>

      {/* For Practitioners */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)]">
        <div className="max-w-fluid-lg mx-auto">
          <h2 className="text-fluid-2xl font-bold mb-fluid-6">For Practitioners</h2>
          <Accordion type="single" collapsible className="space-y-fluid-4">
            <AccordionItem value="item-1" className="bg-card border border-border rounded-lg px-fluid-6">
              <AccordionTrigger className="text-left">
                Who can apply to become a practitioner on the platform?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We welcome licensed healthcare practitioners including naturopaths, herbalists, nutritionists, 
                integrative medicine doctors, and other qualified health professionals. You'll need to provide 
                proof of professional credentials during the application process.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card border border-border rounded-lg px-fluid-6">
              <AccordionTrigger className="text-left">
                Is there a cost to join as a practitioner?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No, joining Xian Herbs is completely free. There are no monthly fees or subscription costs. 
                You earn a professional margin on every order your patients complete through your recommendations.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card border border-border rounded-lg px-fluid-6">
              <AccordionTrigger className="text-left">
                How do I send recommendations to my patients?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Once you create a personalized herbal protocol in our platform, you can send it directly to 
                your patient via email or secure messaging (including LINE). They receive a personalized link 
                where they can review your recommendations and order with one click.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-card border border-border rounded-lg px-fluid-6">
              <AccordionTrigger className="text-left">
                What education and support do you provide?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Every herb in our database includes comprehensive information on traditional uses, modern research, 
                safety profiles, dosing guidelines, and contraindications. We also offer regular webinars, access 
                to our practitioner community, and dedicated support for your questions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-card border border-border rounded-lg px-fluid-6">
              <AccordionTrigger className="text-left">
                Can I track if my patients order their recommendations?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, you can see order status and patient compliance in your dashboard. This helps you follow up 
                with patients and adjust protocols as needed.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* For Patients */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)] bg-muted/30">
        <div className="max-w-fluid-lg mx-auto">
          <h2 className="text-fluid-2xl font-bold mb-fluid-6">For Patients</h2>
          <Accordion type="single" collapsible className="space-y-fluid-4">
            <AccordionItem value="item-1" className="bg-card border border-border rounded-lg px-fluid-6">
              <AccordionTrigger className="text-left">
                How do I receive recommendations from my practitioner?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Your practitioner will send you a personalized link via email or messaging. Click the link 
                to view your customized herbal protocol, including detailed information about each recommended 
                product and how to use it.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card border border-border rounded-lg px-fluid-6">
              <AccordionTrigger className="text-left">
                Are these herbs safe to take?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                All our herbs undergo rigorous quality testing and meet European safety standards. They've been 
                used safely for over 100 years in Traditional Thai Medicine. However, always follow your 
                practitioner's guidance and inform them of any medications or health conditions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card border border-border rounded-lg px-fluid-6">
              <AccordionTrigger className="text-left">
                Can I order without a practitioner recommendation?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Currently, our platform is designed for practitioner-directed recommendations to ensure proper 
                guidance and safety. We recommend working with a qualified healthcare practitioner who can 
                create a personalized protocol for your needs.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-card border border-border rounded-lg px-fluid-6">
              <AccordionTrigger className="text-left">
                How long does shipping take?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We ship across Europe, typically within 3-7 business days depending on your location. You'll 
                receive tracking information once your order ships so you can monitor its progress.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* About Orders & Shipping */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)]">
        <div className="max-w-fluid-lg mx-auto">
          <h2 className="text-fluid-2xl font-bold mb-fluid-6">Orders & Shipping</h2>
          <Accordion type="single" collapsible className="space-y-fluid-4">
            <AccordionItem value="item-1" className="bg-card border border-border rounded-lg px-fluid-6">
              <AccordionTrigger className="text-left">
                What countries do you ship to?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We currently ship to all European Union countries. Shipping times vary by location but typically 
                range from 3-7 business days.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card border border-border rounded-lg px-fluid-6">
              <AccordionTrigger className="text-left">
                What are your shipping costs?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Shipping costs are calculated at checkout based on your location and order size. We offer 
                free shipping on orders over a certain threshold, which will be displayed during checkout.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card border border-border rounded-lg px-fluid-6">
              <AccordionTrigger className="text-left">
                What is your return policy?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Due to the nature of herbal products, we can only accept returns of unopened products within 
                30 days of delivery. If you receive a damaged or incorrect order, please contact us immediately 
                for a full refund or replacement.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-card border border-border rounded-lg px-fluid-6">
              <AccordionTrigger className="text-left">
                How should I store my herbs?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Store herbs in a cool, dry place away from direct sunlight. Keep containers tightly closed 
                when not in use. Specific storage instructions are provided on each product label.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-[clamp(3rem,10vh,6rem)] px-[clamp(1rem,4vw,2rem)] bg-muted/30">
        <div className="max-w-fluid-lg mx-auto text-center">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-4">
            Still Have Questions?
          </h2>
          <p className="text-fluid-base text-muted-foreground mb-fluid-6">
            Our team is here to help with any additional questions you may have
          </p>
          <Button size="lg" className="min-h-touch" asChild>
            <Link to="/contact">Contact Us</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
