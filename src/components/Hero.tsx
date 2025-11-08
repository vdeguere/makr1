import { Button } from "@/components/ui/button";
import { ArrowRight, Sprout } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Hero = () => {
  const { t } = useTranslation('marketing');
  
  return (
    <section className="py-[clamp(3rem,10vh,8rem)] px-[clamp(1rem,4vw,2rem)]">
      <div className="max-w-fluid-xl mx-auto text-center">
        <div className="inline-flex items-center gap-fluid-2 px-fluid-4 py-fluid-2 rounded-full bg-hero-badge-bg text-hero-badge-text text-fluid-sm font-medium mb-fluid-6">
          <Sprout className="h-[clamp(16px,4vw,20px)] w-[clamp(16px,4vw,20px)]" />
          {t('hero.badge')}
        </div>
        
        <h1 className="text-fluid-3xl md:text-fluid-4xl lg:text-[clamp(3rem,8vw,4.5rem)] font-bold mb-fluid-6 leading-tight">
          {t('hero.title')}{" "}
          <span className="text-primary">{t('hero.titleHighlight')}</span>
        </h1>
        
        <p className="text-fluid-base md:text-fluid-lg text-muted-foreground max-w-fluid-lg mx-auto mb-fluid-8 leading-relaxed">
          {t('hero.subtitle')}
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-fluid-4">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground group min-h-touch px-fluid-6">
            {t('hero.cta.primary')}
            <ArrowRight className="ml-2 h-[clamp(16px,4vw,20px)] w-[clamp(16px,4vw,20px)] group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button size="lg" variant="outline" className="border-border min-h-touch px-fluid-6">
            {t('hero.cta.secondary')}
          </Button>
        </div>
      </div>
    </section>
  );
};
