import { IndicadoresView } from '@/components/views/IndicadoresView';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <IndicadoresViewWrapper params={params} />;
}

async function IndicadoresViewWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <IndicadoresView planId={id} />;
}
