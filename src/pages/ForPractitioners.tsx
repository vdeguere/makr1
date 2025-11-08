import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { BookOpen, Shield, Users, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ForPractitioners = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-[clamp(3rem,10vh,6rem)] px-[clamp(1rem,4vw,2rem)] bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-fluid-xl mx-auto text-center">
          <h1 className="text-fluid-3xl md:text-fluid-4xl font-bold mb-fluid-4">
            For Healthcare Practitioners
          </h1>
          <p className="text-fluid-lg text-muted-foreground max-w-fluid-lg mx-auto mb-fluid-6">
            Expand your practice with Traditional Thai Medicine - backed by education, safety tools, and seamless patient fulfillment
          </p>
          <Button size="lg" className="min-h-touch" asChild>
            <Link to="/auth">
              Apply Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)]">
        <div className="max-w-fluid-xl mx-auto">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-8 text-center">
            Why Practitioners Choose Xian Herbs
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-fluid-6">
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <BookOpen className="h-12 w-12 text-primary mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Comprehensive Education</h3>
              <p className="text-muted-foreground">
                Access detailed information on every herb and formula, including traditional uses, 
                modern research, and practical application guidelines.
              </p>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <Shield className="h-12 w-12 text-primary mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Safety Checking</h3>
              <p className="text-muted-foreground">
                Built-in interaction checker and contraindication alerts help you recommend with confidence 
                and ensure patient safety.
              </p>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <Users className="h-12 w-12 text-primary mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Direct Patient Fulfillment</h3>
              <p className="text-muted-foreground">
                Send recommendations directly to patients via email or messaging. They can order with one click, 
                shipped across Europe.
              </p>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <TrendingUp className="h-12 w-12 text-primary mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Grow Your Practice</h3>
              <p className="text-muted-foreground">
                Offer your patients a unique integrative approach that sets your practice apart. 
                Track recommendations and patient compliance.
              </p>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <CheckCircle className="h-12 w-12 text-primary mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Quality Assured</h3>
              <p className="text-muted-foreground">
                All herbs are sourced from certified suppliers and undergo rigorous quality testing 
                to European standards.
              </p>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <BookOpen className="h-12 w-12 text-primary mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Ongoing Support</h3>
              <p className="text-muted-foreground">
                Access to our practitioner community, regular educational webinars, and dedicated 
                support team for your questions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)] bg-muted/30">
        <div className="max-w-fluid-lg mx-auto">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-8 text-center">
            How It Works
          </h2>
          <div className="space-y-fluid-6">
            <div className="flex gap-fluid-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-fluid-lg font-semibold mb-fluid-2">Apply & Get Verified</h3>
                <p className="text-muted-foreground">
                  Submit your application with professional credentials. We verify all practitioners 
                  to ensure platform quality and patient safety.
                </p>
              </div>
            </div>
            <div className="flex gap-fluid-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-fluid-lg font-semibold mb-fluid-2">Explore the Herb Library</h3>
                <p className="text-muted-foreground">
                  Browse our comprehensive database of Traditional Thai Medicine formulas. Learn about 
                  traditional uses, modern research, safety profiles, and application guidelines.
                </p>
              </div>
            </div>
            <div className="flex gap-fluid-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-fluid-lg font-semibold mb-fluid-2">Create Recommendations</h3>
                <p className="text-muted-foreground">
                  Build personalized herbal protocols for your patients. The platform checks for interactions 
                  and contraindications automatically.
                </p>
              </div>
            </div>
            <div className="flex gap-fluid-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="text-fluid-lg font-semibold mb-fluid-2">Send to Patients</h3>
                <p className="text-muted-foreground">
                  Share recommendations via email or secure messaging. Patients receive a personalized link 
                  to order with one click. You track compliance and can adjust as needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)]">
        <div className="max-w-fluid-lg mx-auto">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-4 text-center">
            Transparent Pricing
          </h2>
          <p className="text-fluid-base text-muted-foreground text-center mb-fluid-8 max-w-fluid-md mx-auto">
            Join for free. No monthly fees, no subscription costs. You earn a professional margin on every 
            order your patients complete.
          </p>
          <div className="bg-card border border-border p-fluid-8 rounded-lg text-center">
            <div className="text-fluid-3xl font-bold mb-fluid-2">Free to Join</div>
            <p className="text-muted-foreground mb-fluid-6">
              No monthly fees • No hidden costs • Earn margins on patient orders
            </p>
            <Button size="lg" className="min-h-touch" asChild>
              <Link to="/auth">Start Your Application</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-[clamp(3rem,10vh,6rem)] px-[clamp(1rem,4vw,2rem)] bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-fluid-lg mx-auto text-center">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-4">
            Ready to Get Started?
          </h2>
          <p className="text-fluid-base text-muted-foreground mb-fluid-6">
            Join the growing community of practitioners integrating Traditional Thai Medicine into their practice
          </p>
          <div className="flex flex-col sm:flex-row gap-fluid-4 justify-center">
            <Button size="lg" className="min-h-touch" asChild>
              <Link to="/auth">Apply as Practitioner</Link>
            </Button>
            <Button size="lg" variant="outline" className="min-h-touch" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ForPractitioners;
