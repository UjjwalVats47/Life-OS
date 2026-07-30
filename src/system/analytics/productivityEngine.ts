export type ProductivityObservation = {
  completed: boolean;
  hour: number;
  postponed: boolean;
};

export type RhythmBucket = {
  attempts: number;
  completionRate: number;
  label: "Morning" | "Afternoon" | "Evening" | "Night";
  postponementRate: number;
};

export function calculateProductivityRhythm(observations: ProductivityObservation[]) {
  const buckets: RhythmBucket[] = [
    createBucket("Morning"),
    createBucket("Afternoon"),
    createBucket("Evening"),
    createBucket("Night")
  ];

  for (const observation of observations) {
    const bucket = buckets[bucketIndex(observation.hour)];
    bucket.attempts += 1;
    bucket.completionRate += observation.completed ? 1 : 0;
    bucket.postponementRate += observation.postponed ? 1 : 0;
  }

  for (const bucket of buckets) {
    if (bucket.attempts) {
      bucket.completionRate = Math.round((bucket.completionRate / bucket.attempts) * 100);
      bucket.postponementRate = Math.round((bucket.postponementRate / bucket.attempts) * 100);
    }
  }

  const observed = buckets.filter((bucket) => bucket.attempts > 0);
  const best = [...observed].sort((a, b) => b.completionRate - a.completionRate)[0];
  const weakest = [...observed].sort(
    (a, b) => b.postponementRate - a.postponementRate || a.completionRate - b.completionRate
  )[0];

  return {
    bestWindow: best?.label,
    buckets,
    weakestWindow: weakest?.label
  };
}

function createBucket(label: RhythmBucket["label"]): RhythmBucket {
  return { attempts: 0, completionRate: 0, label, postponementRate: 0 };
}

function bucketIndex(hour: number) {
  if (hour >= 6 && hour < 12) return 0;
  if (hour >= 12 && hour < 17) return 1;
  if (hour >= 17 && hour < 22) return 2;
  return 3;
}
