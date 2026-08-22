import { resumeLoadBalancerOrchestrator } from '../orchestrators/resume.orchestrator';
import { formatLoadBalancer } from '../services/formatter.service';
import { getValidatedLoadBalancerId } from '../services/validation.service';
import type { AppRequest as Request, AppResponse as Response, NextFunction } from '../../../types/http';

export async function resumeLoadBalancerController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let id: string;
    try {
      id = getValidatedLoadBalancerId(req.params.id);
    } catch (e: any) {
      res.status(400);
      throw e;
    }
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    const result = await resumeLoadBalancerOrchestrator({
      userId,
      loadBalancerId: id,
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
