import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

export function LanguageSelector() {
  const { language, setLanguage, availableLanguages, loading } = useLanguage();
  const { t } = useTranslation('common');

  if (loading) {
    return null;
  }

  return (
    <Select value={language} onValueChange={setLanguage}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t('labels.language')} />
      </SelectTrigger>
      <SelectContent>
        {availableLanguages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
