import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Shield, FileCheck, Microscope, Award, AlertCircle, CheckCircle } from "lucide-react";

const Safety = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-[clamp(3rem,10vh,6rem)] px-[clamp(1rem,4vw,2rem)] bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-fluid-xl mx-auto text-center">
          <Shield className="h-16 w-16 text-primary mx-auto mb-fluid-4" />
          <h1 className="text-fluid-3xl md:text-fluid-4xl font-bold mb-fluid-4">
            Safety & Quality Assurance
          </h1>
          <p className="text-fluid-lg text-muted-foreground max-w-fluid-lg mx-auto">
            Your patients' safety is our highest priority. Every herb meets rigorous European standards.
          </p>
        </div>
      </section>

      {/* Quality Standards */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)]">
        <div className="max-w-fluid-xl mx-auto">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-8 text-center">
            Our Quality Standards
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-fluid-6">
            <div className="bg-card border border-border p-fluid-6 rounded-lg text-center">
              <Microscope className="h-12 w-12 text-primary mx-auto mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Lab Testing</h3>
              <p className="text-sm text-muted-foreground">
                Every batch tested for purity, potency, and contaminants by independent European laboratories
              </p>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg text-center">
              <FileCheck className="h-12 w-12 text-primary mx-auto mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Certified Suppliers</h3>
              <p className="text-sm text-muted-foreground">
                Work only with GMP-certified suppliers who meet European quality standards
              </p>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg text-center">
              <Award className="h-12 w-12 text-primary mx-auto mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Quality Certification</h3>
              <p className="text-sm text-muted-foreground">
                Full compliance with European food supplement regulations and standards
              </p>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Traceability</h3>
              <p className="text-sm text-muted-foreground">
                Complete chain of custody documentation from source to patient delivery
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testing Process */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)] bg-muted/30">
        <div className="max-w-fluid-lg mx-auto">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-6 text-center">
            Our Testing Process
          </h2>
          <div className="space-y-fluid-4">
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <h3 className="text-fluid-lg font-semibold mb-fluid-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Identity Verification
              </h3>
              <p className="text-muted-foreground">
                HPTLC and microscopy testing confirms each herb is correctly identified and authentic. 
                No substitutions or adulterants.
              </p>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <h3 className="text-fluid-lg font-semibold mb-fluid-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Purity Testing
              </h3>
              <p className="text-muted-foreground">
                Screen for heavy metals (lead, mercury, cadmium, arsenic), pesticides, and microbial 
                contamination. All results must meet strict European limits.
              </p>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <h3 className="text-fluid-lg font-semibold mb-fluid-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Potency Analysis
              </h3>
              <p className="text-muted-foreground">
                HPLC testing ensures active compounds are present at therapeutic levels. Each batch 
                meets standardized potency requirements.
              </p>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <h3 className="text-fluid-lg font-semibold mb-fluid-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Stability Testing
              </h3>
              <p className="text-muted-foreground">
                Ongoing stability studies ensure products maintain quality throughout their shelf life 
                when stored as directed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Features */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)]">
        <div className="max-w-fluid-xl mx-auto">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-8 text-center">
            Practitioner Safety Tools
          </h2>
          <div className="grid md:grid-cols-2 gap-fluid-6">
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <AlertCircle className="h-10 w-10 text-primary mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Interaction Checker</h3>
              <p className="text-muted-foreground mb-fluid-4">
                Our built-in system alerts you to potential herb-drug and herb-herb interactions based 
                on current research and traditional contraindications.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Real-time interaction screening</li>
                <li>• Medication database integration</li>
                <li>• Evidence-based alerts</li>
                <li>• Severity ratings</li>
              </ul>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg">
              <FileCheck className="h-10 w-10 text-primary mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Contraindication Database</h3>
              <p className="text-muted-foreground mb-fluid-4">
                Comprehensive contraindication information for each herb, including pregnancy, 
                breastfeeding, and specific health conditions.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Pregnancy & lactation safety</li>
                <li>• Condition-specific warnings</li>
                <li>• Age-appropriate guidelines</li>
                <li>• Traditional cautions</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Sourcing */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)] bg-muted/30">
        <div className="max-w-fluid-lg mx-auto">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-6 text-center">
            Sustainable & Ethical Sourcing
          </h2>
          <p className="text-fluid-base text-muted-foreground leading-relaxed mb-fluid-6">
            We work directly with certified suppliers in Thailand who use sustainable harvesting practices 
            and support local farming communities. Our sourcing ensures both quality and environmental 
            responsibility.
          </p>
          <div className="grid md:grid-cols-3 gap-fluid-4 text-center">
            <div className="bg-card border border-border p-fluid-4 rounded-lg">
              <div className="text-fluid-2xl font-bold text-primary mb-fluid-1">100%</div>
              <div className="text-sm text-muted-foreground">Traceable Supply Chain</div>
            </div>
            <div className="bg-card border border-border p-fluid-4 rounded-lg">
              <div className="text-fluid-2xl font-bold text-primary mb-fluid-1">GMP</div>
              <div className="text-sm text-muted-foreground">Certified Facilities</div>
            </div>
            <div className="bg-card border border-border p-fluid-4 rounded-lg">
              <div className="text-fluid-2xl font-bold text-primary mb-fluid-1">EU</div>
              <div className="text-sm text-muted-foreground">Compliant Standards</div>
            </div>
          </div>
        </div>
      </section>

      {/* Commitment */}
      <section className="py-[clamp(3rem,10vh,6rem)] px-[clamp(1rem,4vw,2rem)]">
        <div className="max-w-fluid-lg mx-auto text-center">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-4">
            Our Commitment to You
          </h2>
          <p className="text-fluid-base text-muted-foreground max-w-fluid-md mx-auto">
            We're committed to maintaining the highest standards of quality and safety. If you ever have 
            questions about our testing, sourcing, or safety protocols, our team is here to provide 
            detailed information and documentation.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Safety;
