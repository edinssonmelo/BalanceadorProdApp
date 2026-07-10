import { TableroView } from '@/components/views/TableroView';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <TableroViewWrapper params={params} />;
}

async function TableroViewWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TableroView planId={id} />;
}
