import { Gateway } from '../../../models/Gateway';
import { getValidatedGatewayId } from '../services/validation.service';
import { formatGateway } from '../services/formatter.service';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../../../types/http';

export async function getGateway(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401); throw new Error('Not authenticated'); }

    const id = getValidatedGatewayId(req.params?.id);
    const gateway = await Gateway.findById(id);
    if (!gateway || gateway.userId.toString() !== userId) {
      res.status(404); throw new Error('Gateway not found');
    }

    res.json({ success: true, data: { gateway: formatGateway(gateway) } });
  } catch (e) {
    if ((e as any).statusCode) res.status((e as any).statusCode);
    next(e as Error);
  }
}
