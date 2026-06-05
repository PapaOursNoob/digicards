import React from 'react';
import { useSearchParams } from 'react-router-dom';
import CardSearch from '../components/CardSearch.jsx';
import { t } from '../i18n';

export default function Catalogue() {
  const [searchParams] = useSearchParams();
  const initialSet = searchParams.get('set') || '';

  return (
    <div className="pb-16 md:pb-0 md:ml-20 container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('cardCatalogue')}</h1>
      <div className="mb-8">
        <CardSearch initialSet={initialSet} />
      </div>
    </div>
  );
}
