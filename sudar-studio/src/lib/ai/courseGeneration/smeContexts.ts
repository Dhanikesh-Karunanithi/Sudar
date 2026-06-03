/**
 * Sudar Studio — SME Prompting by Domain
 * Context-aware prompts that inject real-world expertise
 */

interface SMEPromptConfig {
  domain: string
  expertise_level: 'beginner' | 'intermediate' | 'expert'
  industry_examples?: string[]
  best_practices?: string[]
  common_mistakes?: string[]
  tools_and_frameworks?: string[]
}

/**
 * Programming/Software Engineering
 */
export const DOMAIN_PROGRAMMING: SMEPromptConfig = {
  domain: 'Software Engineering',
  expertise_level: 'expert',
  industry_examples: [
    'How Netflix uses microservices for 200M+ concurrent users',
    'Why Uber chose Go for backend services',
    'How Discord scaled to 150M users',
    'Amazon\'s approach to fault tolerance',
  ],
  best_practices: [
    'Write production-grade code with proper error handling',
    'Include deployment and monitoring considerations',
    'Discuss trade-offs between approaches (speed vs. reliability)',
    'Reference industry standards (RFC, design patterns)',
  ],
  common_mistakes: [
    'Premature optimization',
    'Not handling edge cases',
    'Ignoring backwards compatibility',
    'Over-engineering for theoretical scenarios',
  ],
  tools_and_frameworks: [
    'React 19, Vue 3, Angular 17 (as of 2026)',
    'Python 3.12+, Go 1.22, Rust 1.75',
    'PostgreSQL 16, MongoDB 7, Redis 7.2',
    'Docker, Kubernetes, Terraform',
  ],
}

/**
 * Product Strategy & Leadership
 */
export const DOMAIN_PRODUCT_STRATEGY: SMEPromptConfig = {
  domain: 'Product Strategy',
  expertise_level: 'expert',
  industry_examples: [
    'Netflix\'s transition from DVDs to streaming',
    'Slack solving enterprise communication fragmentation',
    'Airbnb finding underserved short-term rental market',
    'Figma democratizing design tools',
  ],
  best_practices: [
    'Ground strategy in quantified market data (TAM/SAM/SOM)',
    'Include founder/CEO quotes and decision-making rationale',
    'Show how market analysis led to product pivots',
    'Explain network effects and unit economics',
  ],
  common_mistakes: [
    'Chasing market size without understanding customer pain',
    'Ignoring indirect competitors',
    'Treating strategy as static, not iterative',
    'Building for "everyone" instead of niche first',
  ],
  tools_and_frameworks: [
    'Jobs to be Done framework',
    'Blue Ocean Strategy',
    'Lean Startup methodology',
    'OKR (Objectives & Key Results)',
    'Unit economics dashboards',
  ],
}

/**
 * Data Science & Analytics
 */
export const DOMAIN_DATA_SCIENCE: SMEPromptConfig = {
  domain: 'Data Science',
  expertise_level: 'expert',
  industry_examples: [
    'How Spotify uses recommendation algorithms',
    'LinkedIn\'s ranking and personalization system',
    'Airbnb\'s pricing optimization ML',
    'Meta\'s feed ranking based on engagement prediction',
  ],
  best_practices: [
    'Explain why a model matters, not just how it works',
    'Include real metrics (ROI, lift, accuracy) from production systems',
    'Discuss data quality, bias, and ethical considerations',
    'Show how insights translate to business decisions',
  ],
  common_mistakes: [
    'Building models without understanding business context',
    'Ignoring class imbalance or data bias',
    'Optimizing for accuracy when business needs precision/recall trade-off',
    'Not monitoring model drift in production',
  ],
  tools_and_frameworks: [
    'Python libraries: scikit-learn, PyTorch, TensorFlow 2.x',
    'Data: pandas, polars, duckdb',
    'MLOps: MLflow, Weights & Biases',
    'Cloud: AWS SageMaker, GCP Vertex AI',
  ],
}

/**
 * Compliance & Security
 */
export const DOMAIN_COMPLIANCE: SMEPromptConfig = {
  domain: 'Compliance & Regulations',
  expertise_level: 'expert',
  industry_examples: [
    'GDPR impact on data retention policies',
    'SOC 2 audit requirements for SaaS',
    'How Stripe simplified PCI compliance',
    'Real impact of regulatory fines (2024+ examples)',
  ],
  best_practices: [
    'Include real regulatory text, not interpretations',
    'Show organizational responsibility (who enforces what)',
    'Explain financial and reputational impact of non-compliance',
    'Provide actionable checklists for implementation',
  ],
  common_mistakes: [
    'Confusing similar regulations (GDPR vs. CCPA)',
    'Assuming one-time compliance (it\'s continuous)',
    'Treating compliance as IT problem, not business strategy',
  ],
  tools_and_frameworks: [
    'GDPR, CCPA, HIPAA',
    'SOC 2 Type II',
    'ISO 27001',
    'Industry-specific: PCI-DSS (payments), HIPAA (healthcare)',
  ],
}

/**
 * Soft Skills & Leadership
 */
export const DOMAIN_SOFT_SKILLS: SMEPromptConfig = {
  domain: 'Leadership & Soft Skills',
  expertise_level: 'expert',
  industry_examples: [
    'How top tech CEOs handle crisis communication',
    'Radical candor in performance feedback',
    'Psychological safety in high-performing teams',
    'Remote-first communication strategies',
  ],
  best_practices: [
    'Use role-playing scenarios from real workplace situations',
    'Reference neuroscience and psychology research',
    'Include diverse cultural perspectives',
    'Provide concrete phrases and templates to use',
  ],
  common_mistakes: [
    'Over-reliance on personality tests without context',
    'Assuming leadership style is one-size-fits-all',
    'Not addressing systemic issues, only individual behaviors',
  ],
  tools_and_frameworks: [
    'Radical Candor (Kim Scott)',
    'Psychological Safety (Amy Edmondson)',
    'Crucial Conversations (Kerry Patterson et al.)',
    'Emotional Intelligence (Daniel Goleman)',
  ],
}

/**
 * Build domain-specific SME context for LLM
 */
export function buildSMEContextPrompt(config: SMEPromptConfig): string {
  return `
You are a **senior ${config.expertise_level} in ${config.domain}** with 15+ years of industry experience 
at leading companies (FAANG, unicorns, or domain leaders).

${
  config.industry_examples?.length
    ? `
**REAL-WORLD CONTEXT** (Use these to ground your explanations):
${config.industry_examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}
`
    : ''
}

${
  config.best_practices?.length
    ? `
**BEST PRACTICES** (Your audience expects this level of sophistication):
${config.best_practices.map((bp, i) => `${i + 1}. ${bp}`).join('\n')}
`
    : ''
}

${
  config.common_mistakes?.length
    ? `
**COMMON MISTAKES** (Warn learners about these pitfalls):
${config.common_mistakes.map((cm, i) => `${i + 1}. ${cm}`).join('\n')}
`
    : ''
}

${
  config.tools_and_frameworks?.length
    ? `
**CURRENT STATE OF TOOLS (As of 2026)**:
${config.tools_and_frameworks.map((tf, i) => `${i + 1}. ${tf}`).join('\n')}
`
    : ''
}

**MANDATORY WRITING RULES**:
- Every concept MUST include 2-3 concrete examples from the real world
- Show why this matters for actual practitioners in 2026
- Include what experts actually do (not theory, practice)
- Avoid generic explanations; be specific and precise
- If there's a current tool/framework to use, mention it with version numbers
`
}

/**
 * Select SME context based on course type
 */
export function getSMEConfig(courseType: string): SMEPromptConfig {
  const typeLower = courseType.toLowerCase()
  
  if (typeLower.includes('code') || typeLower.includes('programming') || typeLower.includes('software')) {
    return DOMAIN_PROGRAMMING
  }
  if (typeLower.includes('product') || typeLower.includes('strategy') || typeLower.includes('business')) {
    return DOMAIN_PRODUCT_STRATEGY
  }
  if (typeLower.includes('data') || typeLower.includes('analytics') || typeLower.includes('ml')) {
    return DOMAIN_DATA_SCIENCE
  }
  if (typeLower.includes('compliance') || typeLower.includes('security') || typeLower.includes('gdpr')) {
    return DOMAIN_COMPLIANCE
  }
  if (typeLower.includes('leadership') || typeLower.includes('soft skills') || typeLower.includes('management')) {
    return DOMAIN_SOFT_SKILLS
  }
  
  // Default fallback
  return {
    domain: 'General Knowledge',
    expertise_level: 'expert',
  }
}
