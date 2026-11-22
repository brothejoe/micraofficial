import type { PageContent, PageCta } from './supabase'
import type { PublicPageBlock } from './content-model'
export type { PublicContentCard, PublicPageBlock } from './content-model'

export type PublicPageDefinition = {
  slug: string
  kicker: string
  content: PageContent
  blocks: PublicPageBlock[]
}

function cta(label: string, url: string, style: PageCta['style'] = 'primary'): PageCta {
  return { label, url, style, openNewTab: false, visible: true }
}

const inquiry = (type: string) => `/contact?type=${type}`

export const publicPages: Record<string, PublicPageDefinition> = {
  home: {
    slug: 'home',
    kicker: 'Regenerative aquaculture development and implementation',
    content: {
      name: 'Home',
      headline: 'A Better Future for Aquaculture Starts with Transforming What Already Exists.',
      description: 'MICRA transforms traditional shrimp farming landscapes into integrated, climate-resilient and environmentally responsible aquaculture clusters — connecting farmers, shared infrastructure, renewable energy, professional management and responsible seafood markets.',
      cta: cta('Become Part of MICRA', inquiry('farmer')),
      secondaryCta: cta('Explore Our Solutions', '/solutions', 'outline'),
      seo: {
        title: 'MICRA | Regenerative Aquaculture in Coastal Indonesia',
        description: 'Discover MICRA’s retrofit-first, cluster-based approach to transforming traditional shrimp farming landscapes.',
        canonicalPath: '/',
      },
      sections: [],
    },
    blocks: [
      {
        id: 'home-story',
        type: 'story',
        eyebrow: 'A different pathway',
        title: 'MICRA offers a different pathway.',
        paragraphs: [
          'Traditional shrimp farming remains an important source of coastal livelihoods. Yet fragmented infrastructure, inconsistent water management and limited technical support can constrain its long-term potential.',
          'Instead of replacing existing farms with expensive industrial facilities, MICRA works to transform existing aquaculture landscapes through a retrofit-first, cluster-based approach.',
          'By connecting individual farms through shared infrastructure, renewable energy, technical services and evidence-based management, MICRA aims to build a more resilient and responsible aquaculture ecosystem.',
        ],
      },
      {
        id: 'home-journeys',
        type: 'cards',
        eyebrow: 'Work with MICRA',
        title: 'Find your pathway',
        description: 'Start a conversation shaped around your role in aquaculture.',
        cards: [
          { title: 'Farmers', description: 'Share your farm context and express interest in joining a MICRA cluster. Site suitability and participation require assessment.', icon: 'waves', href: inquiry('farmer'), ctaLabel: 'Join a MICRA Cluster' },
          { title: 'Investors', description: 'Discuss MICRA’s development stages, potential financing structures and due-diligence process. This is not an investment offer.', icon: 'grid', href: inquiry('investor'), ctaLabel: 'Explore Investment Opportunities' },
          { title: 'Technology Partners', description: 'Explore equipment integration, technical support and field validation for site-specific requirements.', icon: 'settings', href: inquiry('technology-partner'), ctaLabel: 'Become a Technology Partner' },
          { title: 'Seafood Buyers', description: 'Discuss responsible sourcing, traceability and potential market coordination without implying a supply commitment.', icon: 'leaf', href: inquiry('seafood-buyer'), ctaLabel: 'Discuss Market Partnerships' },
          { title: 'Institutions', description: 'Explore research, monitoring, safeguards or implementation collaboration with MICRA.', icon: 'users', href: inquiry('research-institution'), ctaLabel: 'Explore Institutional Collaboration' },
        ],
      },
    ],
  },
  challenge: {
    slug: 'challenge',
    kicker: 'The challenge',
    content: {
      name: 'The Challenge',
      headline: 'Traditional Aquaculture Has Potential. But Its System Needs to Evolve.',
      description: 'Traditional shrimp farming is important to coastal livelihoods, yet many of the systems around individual farms are interconnected and require coordinated management.',
      cta: cta('Explore Our Approach', '/approach'),
      secondaryCta: cta('Discuss a Farm or Cluster', inquiry('farmer'), 'outline'),
      seo: {
        title: 'The Challenge | MICRA Regenerative Aquaculture',
        description: 'Explore the interconnected water, infrastructure, operational, technical and market challenges identified in MICRA’s proposal.',
        canonicalPath: '/challenge',
      },
      sections: [],
    },
    blocks: [
      {
        id: 'challenge-areas',
        type: 'cards',
        eyebrow: 'Structural considerations',
        title: 'Five connected challenges',
        description: 'These are system-level challenges described in MICRA’s proposal, not measured conditions at every farm.',
        cards: [
          { title: 'Fragmented water management', description: 'Individual farms can operate separately even though water resources and water quality are interconnected.', icon: 'waves' },
          { title: 'Limited shared infrastructure', description: 'Infrastructure for intake, treatment, distribution, drainage and outlet management can be difficult for individual smallholder farms to develop independently.', icon: 'grid' },
          { title: 'Operational vulnerability', description: 'Water-quality variability, biosecurity needs, disease risk and coastal hazards create operational risks that require site-aware assessment and coordination.', icon: 'wind' },
          { title: 'Limited access to technical assistance', description: 'Farmers may have limited access to professional technical services, monitoring and coordinated operating support.', icon: 'users' },
          { title: 'Weak market coordination', description: 'Limited coordination can constrain producer organisation, quality information, traceability and reliable buyer relationships.', icon: 'leaf' },
        ],
      },
      {
        id: 'challenge-transition',
        type: 'story',
        eyebrow: 'The opportunity',
        title: 'The opportunity is broader than shrimp production.',
        paragraphs: [
          'MICRA’s proposal identifies an opportunity to develop aquaculture infrastructure and management services that connect existing farms with shared systems, technical support and responsible market relationships.',
          'The scale and causes of these challenges vary by location. Farm, water, environmental, community and commercial conditions must be assessed before a site-specific solution is defined.',
        ],
      },
    ],
  },
  approach: {
    slug: 'approach',
    kicker: 'Our approach',
    content: {
      name: 'Our Approach',
      headline: 'A New Way to Organise Aquaculture. Built Around Existing Farms.',
      description: 'MICRA develops existing traditional aquaculture through retrofit-first, cluster-based implementation and coordinated operations.',
      cta: cta('Become Part of MICRA', inquiry('farmer')),
      secondaryCta: cta('Explore Our Solutions', '/solutions', 'outline'),
      seo: {
        title: 'Our Approach | Retrofit-First Aquaculture Clusters | MICRA',
        description: 'Learn how MICRA connects farmer-owned ponds through shared infrastructure, integrated operations and evidence-based development.',
        canonicalPath: '/approach',
      },
      sections: [],
    },
    blocks: [
      {
        id: 'approach-principles',
        type: 'cards',
        eyebrow: 'Four principles',
        title: 'Built around existing farms',
        description: 'The cluster is MICRA’s primary unit of implementation, management and potential replication.',
        cards: [
          { title: 'Retrofit first', subtitle: 'Improve what already exists', description: 'Assess existing ponds and upgrade them selectively according to physical condition, hydrology and operating requirements rather than assuming full reconstruction.', icon: 'leaf' },
          { title: 'Shared infrastructure', subtitle: 'Coordinate connected water systems', description: 'Plan shared intake, treatment, reservoirs, distribution, drainage and outlet management around validated site requirements.', icon: 'waves' },
          { title: 'Integrated operations', subtitle: 'Connect infrastructure and services', description: 'Coordinate cluster management, biosecurity, technical services, maintenance, farmer participation and operating procedures.', icon: 'settings' },
          { title: 'Evidence-based development', subtitle: 'Validate before scaling', description: 'Use farm baselines, water and energy assessments, environmental and social screening, operational records and performance evaluation to inform each stage.', icon: 'search' },
        ],
      },
      {
        id: 'approach-process',
        type: 'list',
        eyebrow: 'Implementation pathway',
        title: 'From site assessment to validated operations',
        description: 'The proposal describes a staged process; site selection, engineering, participation and financing remain subject to validation.',
        items: [
          'Site identification, farmer engagement and feasibility.',
          'Farm baseline, environmental and social assessment, and engineering surveys.',
          'Site-specific design, procurement planning and priced bill of quantities.',
          'Implementation, commissioning, monitoring and farmer training.',
          'Cluster operations, performance evaluation and replication only after validation.',
        ],
        note: 'A 10–20 ha cluster is a reference scale, not a confirmed site design. A cluster is not a land-consolidation scheme; farmers retain pond ownership.',
      },
    ],
  },
  solutions: {
    slug: 'solutions',
    kicker: 'MICRA solutions',
    content: {
      name: 'Solutions',
      headline: 'An Integrated Platform for Regenerative Aquaculture.',
      description: 'MICRA combines farm transformation, shared infrastructure, renewable-energy-powered aeration, cluster services, digital evidence and responsible market connectivity.',
      cta: cta('Discuss Your Requirements', inquiry('farmer')),
      secondaryCta: cta('Explore Partnership Options', '/partnerships', 'outline'),
      seo: {
        title: 'MICRA Solutions | Regenerative Aquaculture Infrastructure and Services',
        description: 'Explore MICRA’s six integrated products and services for farm transformation, shared water systems, operations, evidence and market connectivity.',
        canonicalPath: '/solutions',
      },
      sections: [],
    },
    blocks: [
      {
        id: 'solution-cards',
        type: 'cards',
        eyebrow: 'Six integrated products and services',
        title: 'Designed to work as a connected system',
        description: 'Scope and configuration depend on site assessment. Not every component is deployed at every site.',
        cards: [
          { title: 'Regenerative Farm Transformation', subtitle: 'Improve Existing Farms. Build Better Production Systems.', description: 'Farm baseline assessment, pond condition assessment, selective rehabilitation and regenerative operating practices.', icon: 'leaf' },
          { title: 'Shared Water Management Infrastructure', subtitle: 'Better Water Management Starts with Working Together.', description: 'Controlled intake, screening, sedimentation, filtration, reservoir, distribution and outlet management. Treatment stages are selected according to measured water quality, hydraulic needs and maintenance capacity.', icon: 'waves' },
          { title: 'Renewable-Energy-Powered Aeration', subtitle: 'Renewable Energy for More Resilient Aquaculture Operations.', description: 'Integration of renewable energy and aeration according to measured oxygen demand and site-specific energy requirements.', icon: 'sun' },
          { title: 'Cluster Management and Technical Services', subtitle: 'Professional Management. Collective Strength.', description: 'Cluster coordination, technical assistance, operating procedures, biosecurity coordination, training and infrastructure management.', icon: 'users' },
          { title: 'Digital Monitoring and Evidence Platform', subtitle: 'Better Decisions Begin with Better Evidence.', description: 'Water-quality monitoring, operational records, environmental and social indicators, data verification and traceability foundations. The digital platform is being developed in phases.', icon: 'search' },
          { title: 'Responsible Seafood Market Connectivity', subtitle: 'Connecting Farmers to More Responsible Seafood Markets.', description: 'Supply-chain coordination, buyer engagement, producer organisation, traceability and responsible sourcing foundations. Any premium, offtake or supply agreement requires market validation and an executed agreement.', icon: 'grid' },
        ],
      },
      {
        id: 'solution-validation',
        type: 'list',
        eyebrow: 'Site-specific by design',
        title: 'Assessment comes before configuration',
        description: 'MICRA’s technical frameworks require site data and engineering review before final design or performance commitments.',
        items: [
          'Farm, pond, ownership and right-of-use assessment.',
          'Hydrological, tidal, topographic and water-quality surveys.',
          'Measured energy and aeration load assessment.',
          'Environmental safeguards, maintenance capacity and operating requirements.',
        ],
      },
    ],
  },
  'business-model': {
    slug: 'business-model',
    kicker: 'Business model',
    content: {
      name: 'Business Model',
      headline: 'Building a Scalable Business Around Better Aquaculture Infrastructure.',
      description: 'MICRA’s model separates the corporate platform, cluster infrastructure and operations, and farmer-owned production businesses.',
      cta: cta('Explore Investment Opportunities', inquiry('investor')),
      secondaryCta: cta('Discuss a Strategic Partnership', '/partnerships', 'outline'),
      seo: {
        title: 'MICRA Business Model | Platform, Cluster Operations and Farmer Ownership',
        description: 'Understand MICRA’s three economic layers, potential service revenue and separation from farmer-owned shrimp production.',
        canonicalPath: '/business-model',
      },
      sections: [],
    },
    blocks: [
      {
        id: 'business-model-layers',
        type: 'business-model',
        eyebrow: 'Three economic layers',
        title: 'Clear roles, ownership and revenue boundaries',
        layers: [
          { title: 'Layer 1 — MICRA Development & Implementation Platform', description: 'Business development, engineering coordination, implementation, technology integration, intellectual property, technical services and commercial partnerships.' },
          { title: 'Layer 2 — Cluster Infrastructure and Operations', description: 'Shared water management, biosecurity, renewable energy systems, technical operations, maintenance and cluster coordination. The project and asset-holding structure remains subject to finalisation.' },
          { title: 'Layer 3 — Farmer-Owned Production Businesses', description: 'Individual farmers retain pond ownership and responsibility for shrimp production while participating through transparent agreements, shared infrastructure arrangements and technical service contracts.' },
        ],
        revenueSources: [
          'Feasibility and baseline assessment.',
          'Cluster engineering and development fees.',
          'Infrastructure implementation management.',
          'Shared facility operation and maintenance.',
          'Technical assistance and aquaculture management services.',
          'Digital monitoring services.',
          'Environmental monitoring and reporting.',
          'Supply-chain coordination and buyer services.',
          'Technology integration, licensing and technical consultancy.',
        ],
        note: 'These are potential revenue activities, not guaranteed revenues or finalised prices. Shrimp production revenue belongs to farmer-owned or separately contracted production businesses and is not automatically MICRA corporate revenue. Any investor discussion is preliminary; no ROI or IRR is guaranteed.',
      },
      {
        id: 'business-investment-stages',
        type: 'list',
        eyebrow: 'Development and investment',
        title: 'Capital follows validated milestones',
        items: [
          'Development and feasibility: site validation, farmer participation, engineering, safeguards and financial modelling.',
          'Demonstration and operational validation: shared infrastructure, priority pond retrofits, aeration, monitoring and operating systems.',
          'Commercial replication: additional clusters only after technical performance, farmer affordability and commercial unit economics are validated.',
        ],
        note: 'The total funding requirement depends on an approved cluster design, priced bill of quantities, operating plan and financing structure. The proposal is preliminary and is not a securities offering.',
      },
    ],
  },
  impact: {
    slug: 'impact',
    kicker: 'Impact and evidence',
    content: {
      name: 'Impact',
      headline: 'Creating Value for Farmers, Coastal Ecosystems and the Aquaculture Economy.',
      description: 'MICRA treats environmental and social performance as operating responsibilities to be assessed, monitored and reported.',
      cta: cta('Explore Institutional Collaboration', inquiry('development-organisation')),
      secondaryCta: cta('Read MICRA Insights', '/insights', 'outline'),
      seo: {
        title: 'MICRA Impact | Farmers, Coastal Ecosystems and Aquaculture',
        description: 'Explore MICRA’s intended farmer, environmental and commercial performance areas and the evidence required to assess them.',
        canonicalPath: '/impact',
      },
      sections: [],
    },
    blocks: [
      {
        id: 'impact-categories',
        type: 'impact',
        eyebrow: 'Areas to assess and measure',
        title: 'Three dimensions of responsible development',
        groups: [
          { title: 'Farmers and Communities', icon: 'users', items: ['Access to shared infrastructure.', 'Technical assistance.', 'Collective management.', 'Retention of individual pond ownership.', 'Transparent participation and benefit-sharing.'] },
          { title: 'Coastal Environment', icon: 'leaf', items: ['Responsible water intake and discharge.', 'Water-quality monitoring.', 'Sediment and sludge management.', 'Avoidance of mangroves and sensitive habitats.', 'Renewable-energy integration according to site assessment.'] },
          { title: 'Aquaculture Economy', icon: 'grid', items: ['Shared service infrastructure.', 'More coordinated operations.', 'Responsible seafood connectivity.', 'Replicable cluster development, subject to validation.'] },
        ],
        note: 'These are performance areas, not claims of achieved impact. Indicators, baselines, evidence, safeguards and methods must be agreed and verified for each implementation.',
      },
    ],
  },
  about: {
    slug: 'about',
    kicker: 'About MICRA',
    content: {
      name: 'About MICRA',
      headline: 'We Are Building More Than an Aquaculture Solution. We Are Building an Implementation Platform.',
      description: 'MICRA stands for Mangrove Integrated Climate Resilient Aquaculture.',
      cta: cta('Explore Partnerships', '/partnerships'),
      secondaryCta: cta('Contact MICRA', inquiry('general'), 'outline'),
      seo: {
        title: 'About MICRA | Regenerative Aquaculture Developer and Implementation Platform',
        description: 'Learn about MICRA, its vision and mission, and its retrofit-first, cluster-based approach to coastal aquaculture.',
        canonicalPath: '/about',
      },
      sections: [],
    },
    blocks: [
      {
        id: 'about-company',
        type: 'story',
        eyebrow: 'Company and platform',
        title: 'Regenerative aquaculture development and implementation',
        paragraphs: [
          'MICRA is a regenerative aquaculture developer and implementation platform established to transform traditional coastal aquaculture landscapes into productive, climate-resilient and environmentally responsible systems.',
          'Prepared by PT JAKHO INTI SUKSES, MICRA connects farmers, shared infrastructure, technical services, renewable energy, evidence systems and responsible seafood market relationships.',
          'The initial development focus is coastal Lhokseumawe, Aceh, Indonesia. Candidate sites and site-specific designs remain subject to verification and assessment.',
        ],
      },
      {
        id: 'about-vision',
        type: 'story',
        eyebrow: 'Vision',
        title: 'A regenerative future for coastal aquaculture',
        paragraphs: [
          'To become a leading developer and implementation platform for regenerative aquaculture, transforming traditional coastal farming landscapes into productive, climate-resilient and environmentally responsible aquaculture ecosystems.',
        ],
      },
      {
        id: 'about-mission',
        type: 'list',
        eyebrow: 'Mission',
        title: 'How MICRA intends to work',
        items: [
          'Transform existing traditional aquaculture into regenerative and climate-resilient production systems.',
          'Develop shared infrastructure and integrated management services that improve operational efficiency and water governance.',
          'Integrate renewable energy into aquaculture operations to support energy resilience and responsible production.',
          'Empower smallholder farmers through technical assistance, collective management and improved market connectivity.',
          'Develop measurable environmental and social performance systems.',
          'Establish a scalable business model that can be replicated across suitable coastal aquaculture landscapes.',
        ],
        note: 'The proposal describes developed frameworks and architecture; this does not imply that every module is commercially deployed or independently validated.',
      },
    ],
  },
  partnerships: {
    slug: 'partnerships',
    kicker: 'Partnerships',
    content: {
      name: 'Partnerships',
      headline: 'Let’s Build the Future of Regenerative Aquaculture Together.',
      description: 'MICRA invites farmers, investors, technology providers, researchers, institutions and seafood supply-chain partners to explore collaboration.',
      cta: cta('Find Your Partnership Pathway', inquiry('general')),
      secondaryCta: cta('Contact MICRA', '/contact', 'outline'),
      seo: {
        title: 'MICRA Partnerships | Farmers, Investors, Technology and Institutions',
        description: 'Explore farmer, investor, technology, research, institutional and seafood supply-chain partnership pathways with MICRA.',
        canonicalPath: '/partnerships',
      },
      sections: [],
    },
    blocks: [
      {
        id: 'partnership-pathways',
        type: 'cards',
        eyebrow: 'Work with MICRA',
        title: 'Partnership pathways',
        description: 'Each collaboration requires a defined scope, due diligence and appropriate written agreements.',
        cards: [
          { title: 'Farmer and Cluster Partnerships', description: 'Explore cluster participation, shared infrastructure, farmer coordination and technical services. Site suitability and terms require assessment.', icon: 'waves', href: inquiry('farmer'), ctaLabel: 'Discuss a Cluster' },
          { title: 'Commercial and Impact Investors', description: 'Discuss the preliminary business model, potential financing structures, milestones and due-diligence process. No investment return is guaranteed.', icon: 'grid', href: inquiry('investor'), ctaLabel: 'Discuss Investment' },
          { title: 'Technology and Engineering Partners', description: 'Explore equipment integration, renewable energy, water treatment, engineering, field validation and implementation roles.', icon: 'settings', href: inquiry('technology-partner'), ctaLabel: 'Discuss Technology' },
          { title: 'Research and Institutional Partners', description: 'Discuss scientific validation, research, monitoring, environmental and social safeguards, and institutional collaboration.', icon: 'search', href: inquiry('research-institution'), ctaLabel: 'Discuss Research' },
          { title: 'Seafood Buyers and Supply Chain Partners', description: 'Explore producer organisation, quality information, traceability, responsible sourcing and potential supply agreements subject to market validation.', icon: 'leaf', href: inquiry('seafood-buyer'), ctaLabel: 'Discuss Market Partnership' },
        ],
      },
      {
        id: 'partnership-agreements',
        type: 'list',
        eyebrow: 'Clear roles',
        title: 'Partnerships built on agreed responsibilities',
        items: [
          'Define deliverables, technical standards and partner contributions.',
          'Agree intellectual property, data access, asset ownership and operational roles.',
          'Document performance indicators, reporting, audit, risk allocation and dispute resolution.',
        ],
      },
    ],
  },
  insights: {
    slug: 'insights',
    kicker: 'Insights',
    content: {
      name: 'Insights',
      headline: 'Ideas, Evidence and Perspectives Shaping the Future of Aquaculture.',
      description: 'Explore the themes that inform MICRA’s work across farms, infrastructure, technology and coastal systems.',
      cta: cta('Discuss a Topic with MICRA', inquiry('general')),
      secondaryCta: cta('Explore Partnerships', '/partnerships', 'outline'),
      seo: {
        title: 'MICRA Insights | Regenerative Aquaculture and Coastal Systems',
        description: 'Explore MICRA insight categories covering regenerative aquaculture, water, renewable energy, coastal ecosystems, farmers and technology.',
        canonicalPath: '/insights',
      },
      sections: [],
    },
    blocks: [
      {
        id: 'insights-topics',
        type: 'categories',
        eyebrow: 'Explore by topic',
        title: 'Ideas and evidence across six themes',
        description: 'MICRA’s editorial categories provide a structure for articles, publications, field studies and development updates. Each item must be sourced, dated and clearly identified by evidence status before publication.',
        categories: [
          'Regenerative Aquaculture',
          'Water Management',
          'Renewable Energy',
          'Coastal Ecosystems',
          'Farmer Development',
          'Technology and Innovation',
        ],
      },
    ],
  },
  contact: {
    slug: 'contact',
    kicker: 'Contact MICRA',
    content: {
      name: 'Contact',
      headline: 'Every Transformation Begins with a Conversation.',
      description: 'Choose the enquiry type that best describes your interest and tell MICRA what you would like to explore.',
      cta: cta('Send Your Enquiry', '/contact#contact-form'),
      secondaryCta: cta('Explore Partnership Pathways', '/partnerships', 'outline'),
      seo: {
        title: 'Contact MICRA | Aquaculture and Partnership Enquiries',
        description: 'Contact MICRA about farmer and cluster participation, investment discussions, technology, seafood markets, research or development collaboration.',
        canonicalPath: '/contact',
      },
      sections: [],
    },
    blocks: [],
  },
}

export const primaryNavigation = [
  { label: 'Home', url: '/' },
  { label: 'The Challenge', url: '/challenge' },
  { label: 'Our Approach', url: '/approach' },
  { label: 'Solutions', url: '/solutions' },
  { label: 'Business Model', url: '/business-model' },
  { label: 'Impact', url: '/impact' },
  { label: 'About MICRA', url: '/about' },
  { label: 'Partnerships', url: '/partnerships' },
  { label: 'Insights', url: '/insights' },
  { label: 'Contact', url: '/contact' },
]

export function withPageBlockDefaults(slug: string, content: PageContent): PageContent {
  return {
    ...content,
    blocks: content.blocks ?? publicPages[slug]?.blocks,
  }
}
