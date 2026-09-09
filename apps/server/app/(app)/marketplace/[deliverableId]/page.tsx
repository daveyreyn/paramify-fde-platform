import { DeliverableDetail } from '@/components/deliverable-detail';
import { NotFoundCard } from '@/components/not-found-card';
import { findDeliverable, toApiDeliverable } from '@/lib/deliverables';
import { readDeliverableContent } from '@/lib/deliverable-views';
import { paramifyBaseUrl } from '@/lib/paramify';
import { canManageParamify } from '@/lib/paramify-viewer';
import { currentViewer } from '@/lib/viewer';

export default async function MarketplaceDeliverablePage({
  params,
}: {
  params: Promise<{ deliverableId: string }>;
}) {
  const { deliverableId } = await params;
  const row = await findDeliverable(deliverableId);
  if (!row || !row.isPublic) {
    return (
      <NotFoundCard
        title="Not in the marketplace"
        message="This deliverable isn’t published to the marketplace."
        backHref="/marketplace"
        backLabel="Back to marketplace"
      />
    );
  }

  const viewer = await currentViewer();
  const canManage = !!viewer && (viewer.isSuper || row.authorId === viewer.id);
  const code = await readDeliverableContent(row.storageKey);
  const viewerTeams = viewer?.teams.map((t) => ({ id: t.id, name: t.name })) ?? [];

  return (
    <DeliverableDetail
      deliverable={toApiDeliverable(row)}
      code={code}
      canManage={canManage}
      isMarketplace
      viewerTeams={viewerTeams}
      paramify={
        viewer && canManageParamify(viewer, row)
          ? { enabled: paramifyBaseUrl() !== null }
          : undefined
      }
    />
  );
}
