const NAMED_IP_TERMS = [
  'naruto','dragon ball','goku','vegeta','harry potter','hogwarts','marvel','avengers','iron man','captain america','thor','hulk','deadpool','wolverine','homelander','the boys','disney','pixar','pokemon','pikachu','one piece','luffy','batman','superman','joker','star wars','darth vader','jedi','mickey mouse','spongebob','jurassic park','indiana jones','top gun','minecraft','mario','sonic the hedgehog','godzilla','transformers','optimus prime','wukong','sun wukong','悟空','孙悟空','火影','龙珠','哈利波特','蝙蝠侠','超人','蜘蛛侠','复仇者联盟','宝可梦','海贼王'
];

const PUBLIC_FIGURE_TERMS = [
  'elon musk','kanye west','ye west','taylor swift','kim kardashian','donald trump','barack obama','cristiano ronaldo','lionel messi','lebron james','michael jordan','tom cruise','brad pitt','leonardo dicaprio','scarlett johansson','zendaya','denis villeneuve','wong kar-wai','michael mann','steven spielberg','akira kurosawa','hans zimmer'
];

const BRANDED_CHARACTER_TERMS = [
  'homelander','darth vader','mickey mouse','pikachu','optimus prime','spider-man','spiderman','iron man','captain america'
];

export const RESEARCH_RISK_POLICY = Object.freeze({
  namedIpTerms: Object.freeze([...NAMED_IP_TERMS]),
  publicFigureTerms: Object.freeze([...PUBLIC_FIGURE_TERMS]),
  brandedCharacterTerms: Object.freeze([...BRANDED_CHARACTER_TERMS]),
  rule: 'Research candidates with named fictional IP, branded characters or recognizable public-figure dependence are excluded from automatic review/promotion queues. They may remain only as explicitly risk-flagged discovery records when needed for source auditing.'
});

export function detectResearchRisk(value) {
  const text = normalize(value);
  const namedIpHits = findTerms(text, NAMED_IP_TERMS);
  const publicFigureHits = findTerms(text, PUBLIC_FIGURE_TERMS);
  const brandedCharacterHits = findTerms(text, BRANDED_CHARACTER_TERMS);
  const flags = [];
  if (namedIpHits.length) flags.push('named-ip-or-celebrity');
  if (publicFigureHits.length) flags.push('public-figure-dependent');
  if (brandedCharacterHits.length) flags.push('branded-character-dependent');
  return {
    flags: [...new Set(flags)],
    hits: {
      namedIp: namedIpHits,
      publicFigure: publicFigureHits,
      brandedCharacter: brandedCharacterHits
    }
  };
}

export function mergeResearchRisk(existingFlags = [], value = '') {
  const detected = detectResearchRisk(value);
  return {
    flags: [...new Set([...(existingFlags || []), ...detected.flags])],
    hits: detected.hits
  };
}

function findTerms(text, terms) {
  return [...new Set(terms.filter(term => text.includes(normalize(term))))];
}

function normalize(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}
