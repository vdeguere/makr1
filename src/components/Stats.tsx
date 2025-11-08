import { useTranslation } from "react-i18next";

export const Stats = () => {
  const { t } = useTranslation('marketing');
  
  const stats = [
    {
      value: t('stats.formulas.value'),
      label: t('stats.formulas.label'),
      description: t('stats.formulas.description'),
    },
    {
      value: t('stats.practitioners.value'),
      label: t('stats.practitioners.label'),
      description: t('stats.practitioners.description'),
    },
    {
      value: t('stats.shipping.value'),
      label: t('stats.shipping.label'),
      description: t('stats.shipping.description'),
    },
    {
      value: t('stats.tradition.value'),
      label: t('stats.tradition.label'),
      description: t('stats.tradition.description'),
    },
  ];

  return (
    <section className="py-[clamp(3rem,10vh,4rem)] px-[clamp(1rem,4vw,2rem)] bg-muted/30">
      <div className="container mx-auto max-w-fluid-xl">
        <h2 className="text-fluid-2xl md:text-fluid-3xl font-bold text-center mb-fluid-4">
          {t('stats.title')}
        </h2>
        <p className="text-center text-fluid-base md:text-fluid-lg text-muted-foreground mb-fluid-8 max-w-fluid-lg mx-auto">
          {t('stats.subtitle')}
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-fluid-6 md:gap-fluid-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-fluid-4 rounded-lg hover:bg-background/50 transition-colors">
              <div className="text-fluid-3xl md:text-fluid-4xl font-bold text-stat-value mb-fluid-2">
                {stat.value}
              </div>
              <div className="text-fluid-sm md:text-fluid-base font-semibold text-foreground mb-fluid-1">
                {stat.label}
              </div>
              <div className="text-fluid-xs md:text-fluid-sm text-stat-label">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
