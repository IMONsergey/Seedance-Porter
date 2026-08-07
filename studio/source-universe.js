export const SOURCE_PLATFORMS = [
  { id:'x', label:'X', family:'Creator / social', priority:3, embed:'x-post', discovery:'prompt + creator signal' },
  { id:'vimeo', label:'Vimeo', family:'Motion / film', priority:5, embed:'vimeo', discovery:'finished films, reels, commercial breakdowns' },
  { id:'behance', label:'Behance', family:'Design case studies', priority:5, embed:'behance', discovery:'project process, visual systems, embedded film' },
  { id:'stash', label:'Stash', family:'Motion / film', priority:5, embed:'paired-player', discovery:'high-end motion and production breakdowns' },
  { id:'motionographer', label:'Motionographer', family:'Motion / film', priority:5, embed:'paired-player', discovery:'motion craft and studio process' },
  { id:'directors-library', label:'Directors Library', family:'Motion / film', priority:5, embed:'paired-player', discovery:'direction, cinematography and commercial references' },
  { id:'dribbble', label:'Dribbble', family:'Design case studies', priority:3, embed:'source-dependent', discovery:'SaaS/UI motion, explainer and product motion' },
  { id:'awwwards', label:'Awwwards', family:'Awards / digital', priority:5, embed:'source-dependent', discovery:'interactive websites, hero motion and digital art direction' },
  { id:'fwa', label:'The FWA', family:'Awards / digital', priority:5, embed:'source-dependent', discovery:'interactive and experimental digital work' },
  { id:'cssda', label:'CSS Design Awards', family:'Awards / digital', priority:4, embed:'source-dependent', discovery:'web motion and interaction' },
  { id:'dandad', label:'D&AD', family:'Awards / advertising', priority:5, embed:'source-dependent', discovery:'awarded campaigns and case films' },
  { id:'cannes', label:'Cannes Lions', family:'Awards / advertising', priority:5, embed:'source-dependent', discovery:'top global campaign work' },
  { id:'clio', label:'Clio / Ads of the World', family:'Awards / advertising', priority:4, embed:'source-dependent', discovery:'campaign films and advertising archive' },
  { id:'lbb', label:'LBBOnline', family:'Production press', priority:5, embed:'paired-player', discovery:'commercial work, credits and production notes' },
  { id:'shots', label:'shots', family:'Production press', priority:5, embed:'paired-player', discovery:'commercial craft and production interviews' },
  { id:'campaign', label:'Campaign', family:'Production press', priority:4, embed:'paired-player', discovery:'campaign strategy and finished advertising' },
  { id:'adweek', label:'Adweek', family:'Production press', priority:4, embed:'paired-player', discovery:'brand campaign analysis' },
  { id:'bpando', label:'BP&O', family:'Brand design press', priority:5, embed:'direct-video', discovery:'branding, motion identity and digital systems' },
  { id:'brand-identity', label:'The Brand Identity', family:'Brand design press', priority:5, embed:'source-dependent', discovery:'identity systems and motion' },
  { id:'itsnicethat', label:"It's Nice That", family:'Design press', priority:4, embed:'source-dependent', discovery:'creative direction and visual culture' },
  { id:'creativeboom', label:'Creative Boom', family:'Design press', priority:4, embed:'source-dependent', discovery:'branding, campaigns and digital craft' },
  { id:'youtube', label:'YouTube', family:'Creator / video', priority:4, embed:'youtube', discovery:'breakdowns, tutorials and finished films' },
  { id:'linkedin', label:'LinkedIn', family:'Creator / professional', priority:4, embed:'linkedin', discovery:'studio breakdowns and production notes' },
  { id:'instagram', label:'Instagram', family:'Creator / social', priority:3, embed:'instagram', discovery:'reels, campaigns and creator process' },
  { id:'tiktok', label:'TikTok', family:'Creator / social', priority:3, embed:'tiktok', discovery:'short-form experiments and ad formats' },
  { id:'adobe', label:'Adobe / Firefly', family:'Official showcase', priority:5, embed:'adobe-video', discovery:'first-party prompts, workflows and customer cases' },
  { id:'google', label:'Google Flow / Veo', family:'Official showcase', priority:5, embed:'youtube-or-source', discovery:'first-party filmmaking examples and workflows' },
  { id:'runway', label:'Runway', family:'Official showcase', priority:5, embed:'source-dependent', discovery:'official prompting, advertising and creator showcase' },
  { id:'luma', label:'Luma', family:'Official showcase', priority:4, embed:'source-dependent', discovery:'Dream Machine examples and workflow' },
  { id:'higgsfield', label:'Higgsfield', family:'Official showcase', priority:4, embed:'source-dependent', discovery:'commercial templates and product ads' },
  { id:'agency', label:'Agency / Studio case page', family:'Primary case source', priority:5, embed:'paired-player', discovery:'authoritative project rationale and workflow' }
];

export const SOURCE_PLATFORM_MAP = Object.fromEntries(SOURCE_PLATFORMS.map(item => [item.id, item]));

export const SOURCE_FAMILIES = [...new Set(SOURCE_PLATFORMS.map(item => item.family))];
