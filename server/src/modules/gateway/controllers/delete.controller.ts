import { deleteGatewayOrchestrator } from '../orchestrators/delete.orchestrator';
import { getValidatedGatewayId } from '../services/validation.service';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../../../types/http';

export async function deleteGateway(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401); throw new Error('Not authenticated'); }

    const id = getValidatedGatewayId(req.params?.id);
    const result = await deleteGatewayOrchestrator({ userId, gatewayId: id });
    res.json(result);
  } catch (e) {
    if ((e as any).statusCode) res.status((e as any).statusCode);
    next(e as Error);
  }
}
