import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  MousePointerClick, 
  GraduationCap, 
  Shield, 
  RefreshCw, 
  Package 
} from "lucide-react";
import { useTranslation } from "react-i18next";

export const Features = () => {
  const { t } = useTranslation('marketing');
  
  const features = [
    {
      key: 'dashboard',
      icon: LayoutDashboard,
    },
    {
      key: 'oneClick',
      icon: MousePointerClick,
    },
    {
      key: 'education',
      icon: GraduationCap,
    },
    {
      key: 'safety',
      icon: Shield,
    },
    {
      key: 'autoReorder',
      icon: RefreshCw,
    },
    {
      key: 'fulfillment',
      icon: Package,
    },
  ];

  return (
    <section className="py-[clamp(3rem,10vh,5rem)] px-[clamp(1rem,4vw,2rem)]">
      <div className="container mx-auto max-w-fluid-xl">
        <div className="text-center mb-fluid-8">
          <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold mb-fluid-4">
            {t('features.title')}
          </h2>
          <p className="text-fluid-base md:text-fluid-lg text-muted-foreground max-w-fluid-lg mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-fluid-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.key} className="border-border hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-fluid-3">
                  <div className="mb-fluid-3">
                    <span className="text-fluid-xs font-semibold text-primary uppercase tracking-wider">
                      {t(`features.items.${feature.key}.category`)}
                    </span>
                  </div>
                  <div className="mb-fluid-4 inline-flex p-fluid-3 rounded-lg bg-primary/10">
                    <Icon className="h-[clamp(20px,5vw,24px)] w-[clamp(20px,5vw,24px)] text-primary" />
                  </div>
                  <CardTitle className="text-fluid-lg md:text-fluid-xl">{t(`features.items.${feature.key}.title`)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-fluid-sm md:text-fluid-base leading-relaxed">
                    {t(`features.items.${feature.key}.description`)}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
