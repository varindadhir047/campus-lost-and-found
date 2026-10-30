
const Item = require("../models/Item");

const zoneGroups = [
  ["Main Gate", "Admin Block", "Parking"],
  ["Academic Block", "Library", "Cafeteria"],
  ["Sports Complex", "Hostel A", "Hostel B"]
];

function zoneScore(a, b) {
  if (a === b) return 1;

  const sameGroup = zoneGroups.some(group =>
    group.includes(a) && group.includes(b)
  );

  return sameGroup ? 0.75 : 0.45;
}

function dateScore(a, b) {
  const days = Math.abs(
    new Date(a) - new Date(b)
  ) / (1000 * 60 * 60 * 24);

  if (days <= 1) return 1;
  if (days <= 3) return 0.8;
  if (days <= 7) return 0.5;
  if (days <= 14) return 0.2;
  return 0;
}

function textSimilarity(a, b) {
  const first = a.toLowerCase().split(" ");
  const second = b.toLowerCase().split(" ");

  let common = 0;

  for (const word of first) {
    if (word.length > 3 && second.includes(word)) {
      common++;
    }
  }

  return first.length
    ? common / Math.max(first.length, second.length)
    : 0;
}


function calculateScore(a, b) {
  const category = a.category === b.category ? 1 : 0;

  const color =
    a.color === b.color ? 1 :
    a.color === "Multicolor" ||
    b.color === "Multicolor" ? 0.55 : 0;

  const zone = zoneScore(a.zone, b.zone);
  const date = dateScore(a.date, b.date);

  const description = textSimilarity(
    `${a.title} ${a.description}`,
    `${b.title} ${b.description}`
  );

  const score = Math.round(
    (category * 0.30 +
     color * 0.20 +
     zone * 0.20 +
     date * 0.15 +
     description * 0.15) * 100
  );

  return {
    score,
    signals: {
      category: Math.round(category * 100),
      color: Math.round(color * 100),
      zone: Math.round(zone * 100),
      date: Math.round(date * 100),
      description: Math.round(description * 100)
    }
  };
}


const getItemMatches = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        message: "Item not found"
      });
    }

    const oppositeType =
      item.type === "lost" ? "found" : "lost";

    const candidates = await Item.find({
      type: oppositeType,
      status: "open"
    });

    const matches = candidates
         .map(candidate => ({
         item: candidate,
         ...calculateScore(item, candidate)
        }))
      .sort((a, b) => b.score - a.score);

    res.json(matches);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = { getItemMatches };
