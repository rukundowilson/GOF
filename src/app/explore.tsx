import { router } from 'expo-router';

import ServiceSelection from '@/components/service-selection';
import { useFieldLocation } from '@/contexts/field-location-context';

export default function ServicesScreen() {
  const { fieldLocation } = useFieldLocation();

  return <ServiceSelection location={fieldLocation} onBack={() => router.replace('/')} />;
}
