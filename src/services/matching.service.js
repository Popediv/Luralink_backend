import { prisma } from "../config/db.js";

const EARTH_RADIUS_KM = 6371;

function normalise(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function distanceKm(lat1, lon1, lat2, lon2) {
  const values = [lat1, lon1, lat2, lon2];

  const hasMissingCoordinate = values.some(
    (value) => value === null || value === undefined || value === "",
  );

  if (hasMissingCoordinate) {
    return null;
  }

  const coordinates = values.map(Number);

  if (coordinates.some((value) => !Number.isFinite(value))) {
    return null;
  }

  const [aLat, aLon, bLat, bLon] = coordinates;

  const radians = (degrees) => degrees * (Math.PI / 180);

  const latitudeDelta = radians(bLat - aLat);
  const longitudeDelta = radians(bLon - aLon);

  const calculation =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(aLat)) *
      Math.cos(radians(bLat)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    EARTH_RADIUS_KM *
    2 *
    Math.atan2(Math.sqrt(calculation), Math.sqrt(1 - calculation))
  );
}

function distanceScore(distance, maximumDistance) {
  if (distance === null) {
    return 0;
  }

  if (distance > maximumDistance) {
    return 0;
  }

  return Math.round(25 * (1 - distance / maximumDistance));
}

function skillMatches(skills, specialty) {
  const target = normalise(specialty);

  return (skills || []).some((skill) => {
    const candidate = normalise(skill);

    return (
      candidate &&
      target &&
      (candidate === target ||
        candidate.includes(target) ||
        target.includes(candidate))
    );
  });
}

export function scoreWorker(worker, shift, maximumDistance = 50) {
  const distance = distanceKm(
    worker.latitude,
    worker.longitude,
    shift.latitude,
    shift.longitude,
  );

  const skillMatched = skillMatches(worker.skills, shift.specialty);

  const rating = Math.max(0, Math.min(Number(worker.rating) || 0, 5));

  const skillScore = skillMatched ? 60 : 0;
  const locationScore = distanceScore(distance, maximumDistance);
  const ratingScore = Math.round((rating / 5) * 15);

  return {
    score: skillScore + locationScore + ratingScore,

    reasons: {
      skillMatched,
      distanceKm: distance === null ? null : Number(distance.toFixed(2)),
      rating,
    },
  };
}

export function scoreShift(
  shift,
  worker,
  maximumDistance = 50,
  now = new Date(),
) {
  const distance = distanceKm(
    worker.latitude,
    worker.longitude,
    shift.latitude,
    shift.longitude,
  );

  const skillMatched = skillMatches(worker.skills, shift.specialty);

  const millisecondsUntilStart =
    new Date(shift.startTime).getTime() - now.getTime();

  const hoursUntilStart = Math.max(0, millisecondsUntilStart / 3_600_000);

  const urgencyScore = Math.max(
    0,
    Math.round(15 * (1 - hoursUntilStart / 168)),
  );

  const skillScore = skillMatched ? 60 : 0;

  const locationScore = distanceScore(distance, maximumDistance);

  return {
    score: skillScore + locationScore + urgencyScore,

    reasons: {
      skillMatched,
      distanceKm: distance === null ? null : Number(distance.toFixed(2)),
      startsInHours: Number(hoursUntilStart.toFixed(1)),
    },
  };
}

export function createMatchingService(db = prisma) {
  return {
    async recommendShifts(worker, options = {}) {
      const maximumDistance = options.maximumDistance ?? 50;

      const limit = options.limit ?? 20;
      const now = options.now ?? new Date();

      const shifts = await db.shift.findMany({
        where: {
          status: "open",
          startTime: {
            gt: now,
          },
        },

        include: {
          facility: {
            select: {
              id: true,
              name: true,
              type: true,
              address: true,
            },
          },
        },
      });

      return shifts
        .map((shift) => ({
          ...shift,

          match: scoreShift(shift, worker, maximumDistance, now),
        }))

        .filter(({ match }) => {
          const correctSkill = match.reasons.skillMatched;

          const withinDistance =
            match.reasons.distanceKm === null ||
            match.reasons.distanceKm <= maximumDistance;

          return correctSkill && withinDistance;
        })

        .sort((first, second) => {
          const scoreDifference = second.match.score - first.match.score;

          if (scoreDifference !== 0) {
            return scoreDifference;
          }

          return new Date(first.startTime) - new Date(second.startTime);
        })

        .slice(0, limit);
    },

    async recommendWorkers(shift, options = {}) {
      const maximumDistance = options.maximumDistance ?? 50;

      const limit = options.limit ?? 20;

      const workers = await db.worker.findMany({
        where: {
          availability: "available",
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return workers
        .map((worker) => ({
          ...worker,

          match: scoreWorker(worker, shift, maximumDistance),
        }))

        .filter(({ match }) => {
          const correctSkill = match.reasons.skillMatched;

          const withinDistance =
            match.reasons.distanceKm === null ||
            match.reasons.distanceKm <= maximumDistance;

          return correctSkill && withinDistance;
        })

        .sort((first, second) => {
          const scoreDifference = second.match.score - first.match.score;

          if (scoreDifference !== 0) {
            return scoreDifference;
          }

          return second.rating - first.rating;
        })

        .slice(0, limit);
    },
  };
}

const matchingService = createMatchingService();

export default matchingService;
