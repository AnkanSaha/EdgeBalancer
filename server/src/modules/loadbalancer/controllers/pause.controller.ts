import { releaseDomainOrchestrator } from '../orchestrators/release-domain.orchestrator';
import { pauseLoadBalancerOrchestrator } from '../orchestrators/pause.orchestrator';
import { formatLoadBalancer } from '../services/formatter.service';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../../../types/http';

export async function pauseLoadBalancerController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { mode } = req.body as { mode: 'release-domain' | 'keep-domain' };
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    if (!mode || (mode !== 'release-domain' && mode !== 'keep-domain')) {
      res.status(400);
      throw new Error('Invalid pause mode. Must be "release-domain" or "keep-domain".');
    }

    const result = await pauseLoadBalancerOrchestrator({
      userId,
      loadBalancerId: id,
      mode,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        loadBalancer: formatLoadBalancer(result.data.loadBalancer),
      },
    });
  } catch (error) {
    if ((error as any).statusCode) {
      res.status((error as any).statusCode);
    }
    next(error as Error);
  }
}
