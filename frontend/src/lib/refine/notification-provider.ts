import type { NotificationProvider, OpenNotificationParams } from '@refinedev/core';
import { toast } from 'sonner';

function resolveDescription(params: OpenNotificationParams) {
  return typeof params.description === 'string' ? params.description : undefined;
}

export const notificationProvider: NotificationProvider = {
  open: (params) => {
    const description = resolveDescription(params);

    if (params.type === 'error') {
      toast.error(params.message, { description });
      return;
    }

    if (params.type === 'progress') {
      toast.message(params.message, { description });
      return;
    }

    toast.success(params.message, { description });
  },
  close: () => {
    toast.dismiss();
  },
};
