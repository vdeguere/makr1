import { Button } from "@/components/ui/button";
import { Sprout, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

export const Header = () => {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-fluid-2xl mx-auto px-[clamp(1rem,4vw,2rem)] py-fluid-3 flex items-center justify-between gap-fluid-4">
        <Link to="/" className="flex items-center gap-fluid-2 min-h-touch">
          <Sprout className="h-[clamp(20px,5vw,28px)] w-[clamp(20px,5vw,28px)] text-primary" />
          <span className="text-fluid-base sm:text-fluid-lg font-semibold text-foreground">Xian Herbs</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-fluid-6">
          <Link to="/about" className="text-fluid-sm font-medium text-foreground hover:text-primary transition-colors">
            {t('nav.about')}
          </Link>
          <Link to="/what-is-ttm" className="text-fluid-sm font-medium text-foreground hover:text-primary transition-colors">
            {t('nav.whatIsTTM')}
          </Link>
          <Link to="/for-practitioners" className="text-fluid-sm font-medium text-foreground hover:text-primary transition-colors">
            {t('nav.forPractitioners')}
          </Link>
          <Link to="/faq" className="text-fluid-sm font-medium text-foreground hover:text-primary transition-colors">
            {t('nav.faq')}
          </Link>
        </nav>

        <div className="flex items-center gap-fluid-4">
          <Button variant="ghost" className="text-fluid-sm min-h-touch hidden md:flex" asChild>
            <Link to="/auth">{t('nav.signIn')}</Link>
          </Button>
          <Button className="text-fluid-sm text-white bg-primary hover:bg-primary/90 min-h-touch hidden sm:flex" asChild>
            <Link to="/auth">{t('nav.forPractitioners')}</Link>
          </Button>
          
          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="min-h-touch min-w-touch">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[400px] max-w-md">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-primary" />
                  Navigation
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-fluid-4 mt-fluid-6">
                <Link to="/" className="text-fluid-base py-fluid-3 px-fluid-4 hover:bg-muted rounded-md transition-colors" onClick={() => setOpen(false)}>
                  {t('nav.dashboard')}
                </Link>
                <Link to="/about" className="text-fluid-base py-fluid-3 px-fluid-4 hover:bg-muted rounded-md transition-colors" onClick={() => setOpen(false)}>
                  {t('nav.about')}
                </Link>
                <Link to="/what-is-ttm" className="text-fluid-base py-fluid-3 px-fluid-4 hover:bg-muted rounded-md transition-colors" onClick={() => setOpen(false)}>
                  {t('nav.whatIsTTM')}
                </Link>
                <Link to="/for-practitioners" className="text-fluid-base py-fluid-3 px-fluid-4 hover:bg-muted rounded-md transition-colors" onClick={() => setOpen(false)}>
                  {t('nav.forPractitioners')}
                </Link>
                <Link to="/safety" className="text-fluid-base py-fluid-3 px-fluid-4 hover:bg-muted rounded-md transition-colors" onClick={() => setOpen(false)}>
                  {t('nav.safety')}
                </Link>
                <Link to="/faq" className="text-fluid-base py-fluid-3 px-fluid-4 hover:bg-muted rounded-md transition-colors" onClick={() => setOpen(false)}>
                  {t('nav.faq')}
                </Link>
                <Link to="/contact" className="text-fluid-base py-fluid-3 px-fluid-4 hover:bg-muted rounded-md transition-colors" onClick={() => setOpen(false)}>
                  {t('nav.contact')}
                </Link>
                <div className="border-t border-border pt-fluid-4 mt-fluid-2 space-y-fluid-3">
                  <Button variant="outline" className="w-full min-h-touch" asChild onClick={() => setOpen(false)}>
                    <Link to="/auth">{t('nav.signIn')}</Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
