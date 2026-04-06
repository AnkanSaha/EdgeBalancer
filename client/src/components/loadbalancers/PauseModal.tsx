'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface PauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: 'release-domain' | 'keep-domain') => void;
  loading?: boolean;
  lbName: string;
}

export function PauseModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  lbName,
}: PauseModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pause Load Balancer"
      size="lg"
    >
      <div className="space-y-6">
        <div>
          <p className="text-muted-foreground mb-4">
            Choose how you want to pause <strong>{lbName}</strong>. This will stop traffic to your origin servers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card 
            className="p-6 cursor-pointer hover:border-amber-500 transition-colors group flex flex-col"
            onClick={() => !loading && onConfirm('keep-domain')}
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
              <span className="text-2xl">🛠️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Keep Domain (Maintenance)</h3>
            <p className="text-sm text-muted-foreground mb-6 flex-1">
              Domain remains attached. The Worker will return a "Maintenance Mode" page to all visitors. Fast to resume.
            </p>
            <Button 
              variant="outline" 
              className="w-full group-hover:bg-amber-500 group-hover:text-white transition-colors"
              disabled={loading}
            >
              Select Maintenance
            </Button>
          </Card>

          <Card 
            className="p-6 cursor-pointer hover:border-red-500 transition-colors group flex flex-col"
            onClick={() => !loading && onConfirm('release-domain')}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
              <span className="text-2xl">🚫</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Release Domain (Hard Stop)</h3>
            <p className="text-sm text-muted-foreground mb-6 flex-1">
              Detaches the domain from Cloudflare. Visitors will see a DNS error or Cloudflare 404. Safest for decommissioning.
            </p>
            <Button 
              variant="outline" 
              className="w-full group-hover:bg-red-600 group-hover:text-white transition-colors"
              disabled={loading}
            >
              Select Hard Stop
            </Button>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
