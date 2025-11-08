import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Heart, Users, Leaf, Award } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-[clamp(3rem,10vh,6rem)] px-[clamp(1rem,4vw,2rem)] bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-fluid-xl mx-auto text-center">
          <h1 className="text-fluid-3xl md:text-fluid-4xl font-bold mb-fluid-4">
            About Xian Herbs
          </h1>
          <p className="text-fluid-lg text-muted-foreground max-w-fluid-lg mx-auto">
            Bridging 100 years of Traditional Thai Medicine wisdom with modern healthcare practice
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)]">
        <div className="max-w-fluid-xl mx-auto">
          <div className="grid md:grid-cols-2 gap-fluid-8 items-center">
            <div>
              <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-4">Our Mission</h2>
              <p className="text-fluid-base text-muted-foreground mb-fluid-4 leading-relaxed">
                We're on a mission to make Traditional Thai Medicine accessible to healthcare practitioners 
                and patients across Europe. By combining century-old herbal formulas with modern safety 
                protocols and practitioner education, we're creating a new standard for integrative medicine.
              </p>
              <p className="text-fluid-base text-muted-foreground leading-relaxed">
                Just as Fullscript revolutionized supplement recommendations, we're transforming how 
                practitioners can confidently recommend Traditional Thai Medicine to their patients.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-fluid-4">
              <div className="bg-card border border-border p-fluid-6 rounded-lg">
                <Heart className="h-12 w-12 text-primary mb-fluid-2" />
                <h3 className="font-semibold mb-fluid-1">Patient-Centered</h3>
                <p className="text-sm text-muted-foreground">Safe, effective herbal medicine</p>
              </div>
              <div className="bg-card border border-border p-fluid-6 rounded-lg">
                <Users className="h-12 w-12 text-primary mb-fluid-2" />
                <h3 className="font-semibold mb-fluid-1">Practitioner-First</h3>
                <p className="text-sm text-muted-foreground">Education & support tools</p>
              </div>
              <div className="bg-card border border-border p-fluid-6 rounded-lg">
                <Leaf className="h-12 w-12 text-primary mb-fluid-2" />
                <h3 className="font-semibold mb-fluid-1">Traditional</h3>
                <p className="text-sm text-muted-foreground">100-year-old formulas</p>
              </div>
              <div className="bg-card border border-border p-fluid-6 rounded-lg">
                <Award className="h-12 w-12 text-primary mb-fluid-2" />
                <h3 className="font-semibold mb-fluid-1">Quality First</h3>
                <p className="text-sm text-muted-foreground">Rigorous safety standards</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)] bg-muted/30">
        <div className="max-w-fluid-lg mx-auto">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-6 text-center">Our Story</h2>
          <div className="space-y-fluid-4 text-fluid-base text-muted-foreground leading-relaxed">
            <p>
              Traditional Thai Medicine has been healing people for over a century, passed down through 
              generations of skilled herbalists and practitioners. These time-tested formulas have helped 
              millions of people, yet they've remained largely inaccessible to modern healthcare practitioners 
              in Europe.
            </p>
            <p>
              We founded Xian Herbs to change that. Our team combines expertise in Traditional Thai Medicine, 
              modern pharmacology, and healthcare technology to create the first practitioner platform specifically 
              designed for Traditional Thai Medicine recommendations.
            </p>
            <p>
              Today, we work with leading practitioners across Europe, providing them with the education, 
              safety tools, and direct patient fulfillment they need to confidently integrate Traditional 
              Thai Medicine into their practice.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-[clamp(3rem,10vh,6rem)] px-[clamp(1rem,4vw,2rem)]">
        <div className="max-w-fluid-lg mx-auto text-center">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-4">
            Join Our Growing Community
          </h2>
          <p className="text-fluid-base text-muted-foreground mb-fluid-6">
            Start recommending Traditional Thai Medicine with confidence
          </p>
          <Button size="lg" className="min-h-touch" asChild>
            <Link to="/auth">Apply as Practitioner</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
