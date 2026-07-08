import { Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileAttachmentSection } from '@/components/shared/FileAttachmentSection';

interface EvidencesCardProps {
  workOrderId: string;
}

export function EvidencesCard({ workOrderId }: EvidencesCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
          <Camera className="h-3.5 w-3.5" />
          Evidencias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FileAttachmentSection
          entityType="WORK_ORDER"
          entityId={workOrderId}
          label="Evidencias"
          defaultCategory="PHOTO"
        />
      </CardContent>
    </Card>
  );
}
