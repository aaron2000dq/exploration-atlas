import { zones as formalZones } from "@/src/config/story";
import type { ExplorationZone } from "@/src/types";

/**
 * Isolated copy of the public example route for browser rehearsals.
 *
 * `?mode=fulltest` stores progress in a separate IndexedDB namespace, so a
 * complete rehearsal cannot overwrite the formal journey. Private nearby
 * rehearsal coordinates are intentionally not part of the public template.
 */
export const fullTestZones: ExplorationZone[] = formalZones.map((zone) => ({
  ...zone,
  id: `fulltest-${zone.id}`,
  checkpoints: zone.checkpoints.map((checkpoint) => ({
    ...checkpoint,
    id: `fulltest-${checkpoint.id}`,
  })),
}));
