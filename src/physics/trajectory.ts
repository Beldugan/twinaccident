export interface Point2D { x: number; y: number }

export function headingFromYaw(samples: { t: number; yawRate: number }[]): number[] {
  const headings: number[] = [0];
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    headings.push(headings[i - 1] + (samples[i].yawRate * Math.PI / 180) * dt);
  }
  return headings;
}

export function positionFromSpeed(
  samples: { t: number; vehicleSpeed: number; yawRate: number }[]
): Point2D[] {
  const points: Point2D[] = [{ x: 0, y: 0 }];
  let heading = 0;

  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t;
    const v = samples[i].vehicleSpeed / 3.6;
    heading += (samples[i].yawRate * Math.PI / 180) * dt;
    points.push({
      x: points[i - 1].x + v * Math.cos(heading) * dt,
      y: points[i - 1].y + v * Math.sin(heading) * dt,
    });
  }

  return points;
}
