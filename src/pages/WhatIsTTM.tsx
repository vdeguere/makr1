import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Leaf, Clock, Sparkles, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const WhatIsTTM = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-[clamp(3rem,10vh,6rem)] px-[clamp(1rem,4vw,2rem)] bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-fluid-xl mx-auto text-center">
          <h1 className="text-fluid-3xl md:text-fluid-4xl font-bold mb-fluid-4">
            What is Traditional Thai Medicine?
          </h1>
          <p className="text-fluid-lg text-muted-foreground max-w-fluid-lg mx-auto">
            A 100-year-old healing tradition rooted in natural herbs and holistic balance
          </p>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)]">
        <div className="max-w-fluid-xl mx-auto">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-8 text-center">
            Core Principles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-fluid-6">
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <Clock className="h-12 w-12 text-primary mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Time-Tested</h3>
              <p className="text-sm text-muted-foreground">
                Over 100 years of proven results, passed down through generations of skilled herbalists
              </p>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <Leaf className="h-12 w-12 text-primary mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Natural Healing</h3>
              <p className="text-sm text-muted-foreground">
                Uses only natural herbs and plants, carefully selected and prepared according to tradition
              </p>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <Sparkles className="h-12 w-12 text-primary mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Holistic Balance</h3>
              <p className="text-sm text-muted-foreground">
                Addresses the whole person - body, mind, and spirit - not just symptoms
              </p>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <Shield className="h-12 w-12 text-primary mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Safe & Gentle</h3>
              <p className="text-sm text-muted-foreground">
                Works with the body's natural healing processes for sustainable wellness
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)] bg-muted/30">
        <div className="max-w-fluid-lg mx-auto">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-6">
            A Rich Healing Heritage
          </h2>
          <div className="space-y-fluid-4 text-fluid-base text-muted-foreground leading-relaxed">
            <p>
              Traditional Thai Medicine has its roots in ancient healing practices that date back centuries. 
              Influenced by Ayurvedic medicine, traditional Chinese medicine, and indigenous Thai wisdom, 
              it developed into a unique system of natural healing.
            </p>
            <p>
              The formulas we work with have been used for over 100 years, carefully refined and perfected 
              by generations of Thai herbalists. These practitioners observed the effects of various herbs 
              and combinations, documenting their findings and passing this knowledge down through apprenticeships 
              and family traditions.
            </p>
            <p>
              Today, Traditional Thai Medicine is recognized by the WHO and continues to be widely practiced 
              in Thailand alongside modern medicine. Our mission is to make these proven formulas accessible 
              to European healthcare practitioners and their patients.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)]">
        <div className="max-w-fluid-xl mx-auto">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-8 text-center">
            Common Applications
          </h2>
          <div className="grid md:grid-cols-2 gap-fluid-6">
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <h3 className="text-fluid-lg font-semibold mb-fluid-3">Digestive Health</h3>
              <p className="text-muted-foreground mb-fluid-3">
                Support for digestive comfort, balance, and overall gut wellness using traditional herbal formulas.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Digestive support</li>
                <li>• Gut comfort</li>
                <li>• Balanced digestion</li>
              </ul>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <h3 className="text-fluid-lg font-semibold mb-fluid-3">Energy & Vitality</h3>
              <p className="text-muted-foreground mb-fluid-3">
                Natural support for daily energy levels and overall vitality through adaptogens and tonics.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Natural energy support</li>
                <li>• Vitality enhancement</li>
                <li>• Daily wellness</li>
              </ul>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <h3 className="text-fluid-lg font-semibold mb-fluid-3">Stress & Balance</h3>
              <p className="text-muted-foreground mb-fluid-3">
                Gentle herbal support for emotional balance and stress adaptation in modern life.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Stress adaptation</li>
                <li>• Emotional balance</li>
                <li>• Calm mind support</li>
              </ul>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <h3 className="text-fluid-lg font-semibold mb-fluid-3">Immune Support</h3>
              <p className="text-muted-foreground mb-fluid-3">
                Traditional formulas to support the body's natural defense systems year-round.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Seasonal wellness</li>
                <li>• Natural defense support</li>
                <li>• Year-round protection</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Scientific Backing */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)] bg-muted/30">
        <div className="max-w-fluid-lg mx-auto">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-6 text-center">
            Modern Research Meets Ancient Wisdom
          </h2>
          <p className="text-fluid-base text-muted-foreground leading-relaxed mb-fluid-6 text-center max-w-fluid-md mx-auto">
            While Traditional Thai Medicine has been used successfully for over a century, modern research 
            is now validating many of these traditional uses. Studies on key Thai herbs show promising results 
            in areas ranging from digestive health to immune function.
          </p>
          <div className="text-center">
            <Button variant="outline" className="min-h-touch" asChild>
              <Link to="/safety">Learn About Our Safety Standards</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-[clamp(3rem,10vh,6rem)] px-[clamp(1rem,4vw,2rem)]">
        <div className="max-w-fluid-lg mx-auto text-center">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-4">
            Start Recommending Traditional Thai Medicine
          </h2>
          <p className="text-fluid-base text-muted-foreground mb-fluid-6">
            Join practitioners who are integrating this ancient wisdom into modern healthcare
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

export default WhatIsTTM;
