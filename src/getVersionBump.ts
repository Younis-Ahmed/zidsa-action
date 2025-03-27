import type { BumperRecommendation } from 'conventional-recommended-bump'
import {
  Bumper,
} from 'conventional-recommended-bump'

export async function getVersionBump(
  build_path: string,
): Promise<BumperRecommendation> {
  const bumper = new Bumper(build_path).loadPreset('angular')
  const recommendation = await bumper.bump()

  return recommendation
}
