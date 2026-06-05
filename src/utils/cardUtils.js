export const getRarityClass = (rarity) => {
  switch (rarity) {
    case 'C': return 'bg-rarity-c';
    case 'U': return 'bg-rarity-u';
    case 'R': return 'bg-rarity-r';
    case 'SR': return 'bg-rarity-sr';
    case 'SEC': return 'bg-rarity-sec';
    case 'P': return 'bg-rarity-p';
    default: return 'bg-rarity-c';
  }
};

export const getCardBorderColorClass = (color) => {
  const primaryColor = color?.split(',')[0];
  switch (primaryColor) {
    case 'Red': return 'border-l-4 border-red-card';
    case 'Blue': return 'border-l-4 border-blue-card';
    case 'Yellow': return 'border-l-4 border-yellow-card';
    case 'Green': return 'border-l-4 border-green-card';
    case 'Black': return 'border-l-4 border-black-card';
    case 'Purple': return 'border-l-4 border-purple-card';
    case 'White': return 'border-l-4 border-white-card';
    default: return '';
  }
};

export const getDeckColorClass = (color) => {
  switch (color) {
    case 'Red': return 'bg-red-card';
    case 'Blue': return 'bg-blue-card';
    case 'Yellow': return 'bg-yellow-card';
    case 'Green': return 'bg-green-card';
    case 'Black': return 'bg-black-card';
    case 'Purple': return 'bg-purple-card';
    case 'White': return 'bg-white-card text-gray-900';
    default: return 'bg-rarity-c';
  }
};

export const naturalSort = (a, b) => {
  const re = /(\d+)|(\D+)/g;
  const aParts = String(a).match(re) || [];
  const bParts = String(b).match(re) || [];
  for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
    const aNum = parseInt(aParts[i]);
    const bNum = parseInt(bParts[i]);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      if (aNum !== bNum) return aNum - bNum;
    } else {
      const cmp = aParts[i].localeCompare(bParts[i]);
      if (cmp !== 0) return cmp;
    }
  }
  return aParts.length - bParts.length;
};
