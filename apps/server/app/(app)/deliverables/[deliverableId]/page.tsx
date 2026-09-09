import { redirect } from 'next/navigation';

import { DeliverableDetail } from '@/components/deliverable-detail';
import { NotFoundCard } from '@/components/not-found-card';
import { canAccess, findDeliverable, toApiDeliverable } from '@/lib/deliverables';
import { readDeliverableContent } from '@/lib/deliverable-views';
import { paramifyBaseUrl } from '@/lib/paramify';
import { canManageParamify } from '@/lib/paramify-viewer';
import { currentViewer } from '@/lib/viewer';

export default async function DeliverablePage({
  params,
}: {
  params: Promise<{ deliverableId: string }>;
}) {
  // The route segment carries the deliverable's unique name slug.
  const { deliverableId } = await params;
  const viewer = await currentViewer();
  if (!viewer) redirect('/login');

  const row = await findDeliverable(deliverableId);
  if (!row || !canAccess(viewer, row)) {
    return (
      <NotFoundCard
        title="Deliverable not found"
        message="This deliverable doesn’t exist or you don’t have access to it."
        backHref="/deliverables"
        backLabel="Back to deliverables"
      />
    );
  }

  const canManage = viewer.isSuper || row.authorId === viewer.id;
  const code = await readDeliverableContent(row.storageKey);

  return (
    <DeliverableDetail
      deliverable={toApiDeliverable(row)}
      code={code}
      canManage={canManage}
      paramify={
        canManageParamify(viewer, row) ? { enabled: paramifyBaseUrl() !== null } : undefined
      }
    />
  );
}
