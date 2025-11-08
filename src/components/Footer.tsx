import { Link } from "react-router-dom";
import { Sprout } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Footer = () => {
  const { t } = useTranslation('common');
  
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="max-w-fluid-2xl mx-auto px-[clamp(1rem,4vw,2rem)] py-fluid-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-fluid-8">
          <div className="space-y-fluid-4">
            <div className="flex items-center gap-fluid-2">
              <Sprout className="h-6 w-6 text-primary" />
              <span className="text-fluid-lg font-semibold">{t('footer.brand')}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t('footer.tagline')}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-fluid-4">{t('footer.platform.title')}</h3>
            <ul className="space-y-fluid-2 text-sm">
              <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.platform.whatIsTTM')}</Link></li>
              <li><Link to="/for-practitioners" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.platform.forPractitioners')}</Link></li>
              <li><Link to="/safety" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.platform.safety')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-fluid-4">{t('footer.resources.title')}</h3>
            <ul className="space-y-fluid-2 text-sm">
              <li><Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.resources.faq')}</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.resources.contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-fluid-4">{t('footer.legal.title')}</h3>
            <ul className="space-y-fluid-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.legal.privacy')}</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.legal.terms')}</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-fluid-8 pt-fluid-6 text-sm text-muted-foreground text-center">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
};
