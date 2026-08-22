import { Gateway } from '../../../models/Gateway';
import { formatGateway } from '../services/formatter.service';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../../../types/http';

export async function listGateways(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401); throw new Error('Not authenticated'); }

    const gateways = await Gateway.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: { gateways: gateways.map(formatGateway) } });
  } catch (e) {
    next(e as Error);
  }
}
