import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Users } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission to backend
    toast({
      title: "Message sent!",
      description: "We'll get back to you as soon as possible.",
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-[clamp(3rem,10vh,6rem)] px-[clamp(1rem,4vw,2rem)] bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-fluid-xl mx-auto text-center">
          <h1 className="text-fluid-3xl md:text-fluid-4xl font-bold mb-fluid-4">
            Get in Touch
          </h1>
          <p className="text-fluid-lg text-muted-foreground max-w-fluid-lg mx-auto">
            Have questions? We're here to help. Reach out to our team.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)]">
        <div className="max-w-fluid-xl mx-auto">
          <div className="grid md:grid-cols-3 gap-fluid-6 mb-fluid-12">
            <div className="bg-card border border-border p-fluid-6 rounded-lg text-center">
              <Mail className="h-12 w-12 text-primary mx-auto mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Email Support</h3>
              <p className="text-sm text-muted-foreground mb-fluid-3">
                For general inquiries and support
              </p>
              <a href="mailto:support@xianherbs.com" className="text-primary hover:underline">
                support@xianherbs.com
              </a>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Practitioner Support</h3>
              <p className="text-sm text-muted-foreground mb-fluid-3">
                Questions about becoming a practitioner
              </p>
              <a href="mailto:practitioners@xianherbs.com" className="text-primary hover:underline">
                practitioners@xianherbs.com
              </a>
            </div>
            <div className="bg-card border border-border p-fluid-6 rounded-lg text-center">
              <MessageSquare className="h-12 w-12 text-primary mx-auto mb-fluid-4" />
              <h3 className="text-fluid-lg font-semibold mb-fluid-2">Business Inquiries</h3>
              <p className="text-sm text-muted-foreground mb-fluid-3">
                Partnerships and collaborations
              </p>
              <a href="mailto:business@xianherbs.com" className="text-primary hover:underline">
                business@xianherbs.com
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="max-w-fluid-lg mx-auto">
            <div className="bg-card border border-border p-fluid-8 rounded-lg">
              <h2 className="text-fluid-2xl font-bold mb-fluid-6 text-center">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-fluid-6">
                <div className="grid md:grid-cols-2 gap-fluid-6">
                  <div className="space-y-fluid-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      required
                      className="min-h-touch"
                    />
                  </div>
                  <div className="space-y-fluid-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      required
                      className="min-h-touch"
                    />
                  </div>
                </div>
                <div className="space-y-fluid-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What is your message about?"
                    required
                    className="min-h-touch"
                  />
                </div>
                <div className="space-y-fluid-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us more about your inquiry..."
                    required
                    rows={6}
                    className="resize-none"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full min-h-touch">
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Office Info */}
      <section className="py-[clamp(2rem,8vh,4rem)] px-[clamp(1rem,4vw,2rem)] bg-muted/30">
        <div className="max-w-fluid-lg mx-auto text-center">
          <h2 className="text-fluid-2xl font-bold mb-fluid-4">Our Office</h2>
          <p className="text-muted-foreground mb-fluid-2">Xian Herbs Europe</p>
          <p className="text-muted-foreground mb-fluid-2">Amsterdam, Netherlands</p>
          <p className="text-muted-foreground">Available Monday - Friday, 9:00 AM - 5:00 PM CET</p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
