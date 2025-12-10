import { Framework, Tone, Template } from './types';

export const FRAMEWORKS: Framework[] = [
    {
        id: 'costar',
        name: 'CO-STAR',
        description: 'Context, Objective, Style, Tone, Audience, Response',
        bestFor: 'Creative writing, marketing, and communications',
        fields: [
            { id: 'context', label: 'Context', description: 'Background information for the task', placeholder: 'e.g., You are writing a marketing email for a tech startup...' },
            { id: 'objective', label: 'Objective', description: 'Clear goal to achieve', placeholder: 'e.g., Convince the reader to sign up for a trial.' },
            { id: 'style', label: 'Style', description: 'Writing or response style', placeholder: 'e.g., Professional yet witty.' },
            { id: 'tone', label: 'Tone', description: 'Auto-filled from your tone selection' },
            { id: 'audience', label: 'Audience', description: 'Target audience characteristics', placeholder: 'e.g., CTOs and Engineering Managers.' },
            { id: 'response', label: 'Response', description: 'Response format and structure', placeholder: 'e.g., A 3-paragraph email with a CTA.' }
        ]
    },
    {
        id: 'scoped',
        name: 'SCOPED',
        description: 'Situation, Complication, Objective, People, Execution, Deliverables',
        bestFor: 'Business strategy, problem solving, and management',
        fields: [
            { id: 'situation', label: 'Situation', description: 'Current state or context.', placeholder: 'e.g., Sales have dropped by 15% Q/Q.' },
            { id: 'complication', label: 'Complication', description: 'The problem or challenge.', placeholder: 'e.g., Competitors lowered prices.' },
            { id: 'objective', label: 'Objective', description: 'Desired future state.', placeholder: 'e.g., Restore growth to 5% MoM.' },
            { id: 'people', label: 'People', description: 'Who is involved? (Roles/Audience).', placeholder: 'e.g., Sales Team and Marketing.' },
            { id: 'execution', label: 'Execution', description: 'Constraints and methods.', placeholder: 'e.g., Launch a referral program.' },
            { id: 'deliverables', label: 'Deliverables', description: 'Specific outputs required.', placeholder: 'e.g., A one-page strategy memo.' }
        ]
    },
    {
        id: 'rtcros',
        name: 'RTCROS',
        description: 'Role, Task, Context, Reasoning, Output, Stopping',
        bestFor: 'Technical tasks, coding, and logical reasoning',
        fields: [
            { id: 'role', label: 'Role', description: 'Who should the AI act as? (e.g., Expert Blog Writer)', placeholder: 'e.g., Senior Python Developer' },
            { id: 'task', label: 'Task', description: 'What specific action do you want performed?', placeholder: 'e.g., Refactor this function to be O(n).' },
            { id: 'context', label: 'Context', description: 'What background information is relevant?', placeholder: 'e.g., The current implementation causes memory leaks.' },
            { id: 'reasoning', label: 'Reasoning', description: 'How should the AI approach this? What logic should it follow?', placeholder: 'e.g., Explain the time complexity trade-offs.' },
            { id: 'output', label: 'Output', description: 'What format do you want? How should it be structured?', placeholder: 'e.g., Python 3.9+ compatible code block.' },
            { id: 'stopping', label: 'Stopping', description: 'When should the AI stop? What are the boundaries?', placeholder: 'e.g., Do not include generic advice.' }
        ]
    },
    {
        id: 'pare',
        name: 'PARE',
        description: 'Prime, Augment, Refresh, Evaluate - for iterative refinement',
        fields: [
            { id: 'prime', label: 'Prime', description: 'Prime the AI with the core value and mission' },
            { id: 'augment', label: 'Augment', description: 'Add specific details, constraints, and requirements' },
            { id: 'refresh', label: 'Refresh', description: 'Reinforce key instructions or modify based on output' },
            { id: 'evaluate', label: 'Evaluate', description: 'Criteria to assess the generated output' }
        ]
    },
    {
        id: 'rise',
        name: 'RISE',
        description: 'Role, Input, Steps, Expectation',
        fields: [
            { id: 'role', label: 'Role', description: "Define the AI's role" },
            { id: 'input', label: 'Input', description: 'Provide the input data or scenario' },
            { id: 'steps', label: 'Steps', description: 'Break down the process or methodology' },
            { id: 'expectation', label: 'Expectation', description: 'Define success criteria and output' }
        ]
    },
    {
        id: 'race',
        name: 'RACE',
        description: 'Role, Action, Context, Expectation',
        fields: [
            { id: 'role', label: 'Role', description: "Define the AI's role or perspective" },
            { id: 'action', label: 'Action', description: 'What action should be performed' },
            { id: 'context', label: 'Context', description: 'Background information and constraints' },
            { id: 'expectation', label: 'Expectation', description: 'Desired outcome or deliverable' }
        ]
    },
    {
        id: 'care',
        name: 'CARE',
        description: 'Context, Action, Result, Example',
        fields: [
            { id: 'context', label: 'Context', description: 'The situation or background' },
            { id: 'action', label: 'Action', description: 'What steps should be taken' },
            { id: 'result', label: 'Result', description: 'The desired outcome' },
            { id: 'example', label: 'Example', description: 'An example of excellent output' }
        ]
    },
    {
        id: 'create',
        name: 'CREATE',
        description: 'Character, Request, Examples, Adjustments, Type, Extras',
        fields: [
            { id: 'character', label: 'Character', description: "Define the AI's persona or role" },
            { id: 'request', label: 'Request', description: 'What you want the AI to do' },
            { id: 'examples', label: 'Examples', description: 'Provide examples to guide the AI' },
            { id: 'adjustments', label: 'Adjustments', description: 'Any modifications or refinements needed' },
            { id: 'type', label: 'Type', description: 'Specify the output type or format' },
            { id: 'extras', label: 'Extras', description: 'Additional information or constraints' }
        ]
    },
    {
        id: 'elicit',
        name: 'ELICIT',
        description: 'Explain, List, Identify, Categorize, Interpret, Trace',
        fields: [
            { id: 'explain', label: 'Explain', description: 'What topic needs explanation?' },
            { id: 'list', label: 'List', description: 'What items need listing?' },
            { id: 'identify', label: 'Identify', description: 'Key elements to find or point out?' },
            { id: 'context', label: 'Context', description: 'Background info for the task.' }
        ]
    },
    {
        id: 'tag',
        name: 'TAG',
        description: 'Task, Action, Goal - Simple and direct',
        fields: [
            { id: 'task', label: 'Task', description: 'What needs to be done' },
            { id: 'action', label: 'Action', description: 'How it should be done' },
            { id: 'goal', label: 'Goal', description: 'The ultimate purpose or outcome' }
        ]
    },
    {
        id: 'aps',
        name: 'APS',
        description: 'Audience, Purpose, Style - Focus on communication',
        fields: [
            { id: 'audience', label: 'Audience', description: 'Who is this for?' },
            { id: 'purpose', label: 'Purpose', description: 'Why are we creating this?' },
            { id: 'style', label: 'Style', description: 'Tone and format requirements' }
        ]
    },
    {
        id: 'kernel',
        name: 'KERNEL',
        description: 'Keep Simple, Easy Verify, Reproducible, Narrow, Explicit, Logical',
        fields: [
            { id: 'logicalStructure', label: 'Logical Structure', description: 'Format: 1) Context 2) Task 3) Constraints 4) Format.' }
        ]
    },
    {
        id: 'roses',
        name: 'ROSES',
        description: 'Role, Objective, Scenario, Expected Solution, Steps',
        fields: [
            { id: 'role', label: 'Role', description: 'Who is the AI? (e.g., Expert Strategist)' },
            { id: 'objective', label: 'Objective', description: 'What is the primary goal?' },
            { id: 'scenario', label: 'Scenario', description: 'Current situation or problem context.' },
            { id: 'expectedSolution', label: 'Expected Solution', description: 'What does success look like?' },
            { id: 'steps', label: 'Steps', description: 'Specific steps or methodology to follow.' }
        ]
    },
    {
        id: 'tracer',
        name: 'TRACER',
        description: 'Task, Role, Audience, Context, Example, Restrictions',
        fields: [
            { id: 'task', label: 'Task', description: 'Specific action or request.' },
            { id: 'role', label: 'Role', description: 'Persona or perspective.' },
            { id: 'audience', label: 'Audience', description: 'Who is this for?' },
            { id: 'context', label: 'Context', description: 'Background information.' },
            { id: 'example', label: 'Example', description: 'One or more examples of desired output.' },
            { id: 'restrictions', label: 'Restrictions', description: 'What to avoid (Negative constraints).' }
        ]
    },
    {
        id: 'c4',
        name: 'C4 Model',
        description: 'Context, Containers, Components, Code - Software Architecture',
        fields: [
            { id: 'context', label: 'System Context', description: 'High-level system interactions & users.' },
            { id: 'containers', label: 'Containers', description: 'Applications and data stores (Deployable units).' },
            { id: 'components', label: 'Components', description: 'Internal modules and structural blocks.' },
            { id: 'code', label: 'Code', description: 'Classes, interfaces, and implementations (Optional).' }
        ]
    },
    {
        id: 'devops',
        name: 'DevOps Pipeline',
        description: 'Build, Test, Deploy, Monitor - CI/CD & Operations',
        fields: [
            { id: 'build', label: 'Build & CI', description: 'Continuous Integration steps and tooling.' },
            { id: 'test', label: 'Testing', description: 'Unit, Integration, and E2E test strategy.' },
            { id: 'deploy', label: 'Deployment', description: 'CD strategy (Blue/Green, Canary) & Infrastructure.' },
            { id: 'monitor', label: 'Operate & Monitor', description: 'Observability, logging, and incident response.' }
        ]
    },
    {
        id: 'ddd',
        name: 'DDD',
        description: 'Domain-Driven Design - Domain, Context, Entities, Services',
        fields: [
            { id: 'domain', label: 'Domain', description: 'Core business domain and logic.' },
            { id: 'boundedContext', label: 'Bounded Context', description: 'Explicit boundaries of the subsystem.' },
            { id: 'entities', label: 'Entities & Aggregates', description: 'Core objects with identity and lifecycle.' },
            { id: 'services', label: 'Services', description: 'Domain services and application logic.' }
        ]
    }
];

export const TONES: Tone[] = [
    { value: 'formal', label: 'Formal', description: 'Professional and polished language' },
    { value: 'direct', label: 'Direct', description: 'Blunt, straightforward, no fluff' },
    { value: 'concise', label: 'Concise', description: 'Brief and to-the-point style' },
    { value: 'casual', label: 'Casual', description: 'Friendly and conversational tone' },
    { value: 'authoritative', label: 'Authoritative', description: 'Confident and expert voice' },
    { value: 'instructional', label: 'Instructional', description: 'Clear step-by-step guidance' },
    { value: 'persuasive', label: 'Persuasive', description: 'Compelling and influential language' },
    { value: 'creative', label: 'Creative', description: 'Imaginative and engaging style' },
    { value: 'analytical', label: 'Analytical', description: 'Data-driven and logical approach' },
    { value: 'technical', label: 'Technical', description: 'Precise and technical terminology' },
    { value: 'empathetic', label: 'Empathetic', description: 'Understanding and supportive tone' },
    { value: 'coaching', label: 'Coaching', description: 'Encouraging and growth-oriented' },
    { value: 'socratic', label: 'Socratic', description: 'Thought-provoking via questioning' },
    { value: 'storytelling', label: 'Storytelling', description: 'Narrative-driven and engaging' },
    { value: 'journalistic', label: 'Journalistic', description: 'Objective and investigative' },
    { value: 'academic', label: 'Academic', description: 'Scholarly, cited, and rigorous' },
    { value: 'debate', label: 'Debate', description: 'Argumentative and counter-point focused' },
    { value: 'witty', label: 'Witty', description: 'Clever, humorous, and sharp' },
    { value: 'minimalist', label: 'Minimalist', description: 'Extreme brevity, only essentials' },
    { value: 'diplomatic', label: 'Diplomatic', description: 'Tactful and balanced approach' },
    { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and motivating language' },
    { value: 'nuanced', label: 'Nuanced', description: 'Exploring subtleties and complex shades of meaning' },
    { value: 'provocative', label: 'Provocative', description: 'Challenging assumptions and stimulating thought' },
    { value: 'philosophical', label: 'Philosophical', description: 'Deep inquiry into fundamental truths and ethics' },
    { value: 'pragmatic', label: 'Pragmatic', description: 'Focus on practical, real-world utility and results' },
    { value: 'holistic', label: 'Holistic', description: 'System-wide perspective connecting all parts' },
    { value: 'architectural', label: 'Architectural', description: 'High-level, structural, big-picture view' },
    { value: 'operational', label: 'Operational', description: 'Focused on stability, logging, and maintenance' },
    { value: 'security-first', label: 'Security-First', description: 'Prioritizing safety, compliance, and risk' },
    { value: 'scalable', label: 'Scalable', description: 'Focus on growth, performance, and volume' }
];

export const DEFAULT_SUGGESTIONS = {
    role: ['Expert Blog Writer', 'Data Analyst', 'Customer Service Agent', 'Marketing Strategist', 'Technical Writer', 'Sales Coach'],
    context: ['Target audience:', 'Industry:', 'Current situation:', 'Available resources:', 'Timeline:', 'Constraints:'],
    reasoning: ['Step-by-step analysis', 'Compare multiple approaches', 'Consider pros and cons', 'Apply best practices', 'Use data-driven logic'],
    output: ['Numbered list', 'Bullet points', 'Paragraph format', 'Table structure', 'Detailed explanation with examples'],
    stopping: ['Limit to 10 items', 'Keep under 500 words', 'Focus on top 3 recommendations', 'Stop after main points', 'No repetition']
};

export const INDUSTRY_TEMPLATES: Template[] = [
    {
        id: 'healthcare',
        label: 'Healthcare',
        icon: 'Stethoscope',
        description: 'Medical analysis, patient education, & clinical documentation',
        frameworkId: 'rtcros',
        tones: ['formal', 'empathetic', 'analytical'],
        prefill: {
            role: 'Senior Medical Consultant',
            context: 'Working within a regulatory compliant healthcare environment (HIPAA). Target audience consists of patients or medical professionals.',
            stopping: 'Do not provide specific medical diagnoses. Always include a disclaimer.'
        }
    },
    {
        id: 'legal',
        label: 'Legal',
        icon: 'Scale',
        description: 'Contract review, legal research, & memo drafting',
        frameworkId: 'costar',
        tones: ['formal', 'analytical', 'precise'],
        prefill: {
            context: 'Jurisdiction: US Federal Law. Acting as a concise legal expert.',
            style: 'Legalese, rigorous, and citation-heavy',
            audience: 'Legal professionals or judges'
        }
    },
    {
        id: 'finance',
        label: 'Finance',
        icon: 'Banknote',
        description: 'Market analysis, investment reports, & financial modeling',
        frameworkId: 'scoped',
        tones: ['analytical', 'professional', 'objective'],
        prefill: {
            situation: 'Analyzing current market trends or financial statements.',
            execution: 'Use quantitative data and standard financial ratios.',
            people: 'Investors, CFOs, or financial analysts'
        }
    },
    {
        id: 'education',
        label: 'Education',
        icon: 'GraduationCap',
        description: 'Lesson planning, student feedback, & curriculum design',
        frameworkId: 'rise',
        tones: ['instructional', 'encouraging', 'clear'],
        prefill: {
            role: 'Expert Curriculum Designer',
            expectation: 'Clear learning objectives, engaging activities, and assessment methods.'
        }
    },
    {
        id: 'marketing',
        label: 'Marketing',
        icon: 'Megaphone',
        description: 'Campaign strategy, copy generation, & audience analysis',
        frameworkId: 'costar',
        tones: ['persuasive', 'creative', 'enthusiastic'],
        prefill: {
            context: 'Digital marketing campaign for a B2B SaaS product.',
            objective: 'Increase conversion rates and brand awareness.',
            audience: 'Decision makers in tech companies'
        }
    },
    {
        id: 'ecommerce',
        label: 'E-commerce',
        icon: 'ShoppingBag',
        description: 'Product descriptions, ad copy, & email sequences',
        frameworkId: 'tag',
        tones: ['persuasive', 'descriptive', 'enthusiastic'],
        prefill: {
            task: 'Write a compelling product description',
            action: 'Highlight key features (USPs) and benefits. addressing pain points.',
            goal: 'Drive immediate sales and click-throughs.'
        }
    },
    {
        id: 'hr',
        label: 'HR & Recruiting',
        icon: 'Users',
        description: 'Job descriptions, interview scripts, & culture docs',
        frameworkId: 'costar',
        tones: ['professional', 'welcoming', 'clear'],
        prefill: {
            context: 'Hiring for a competitive tech role. Company culture is innovative and inclusive.',
            objective: 'Attract high-quality candidates.',
            style: 'Engaging yet professional',
            audience: 'Potential applicants with 5+ years experience'
        }
    },
    {
        id: 'research',
        label: 'Academic Research',
        icon: 'Microscope',
        description: 'Literature reviews, abstract summaries, & methodology',
        frameworkId: 'elicit',
        tones: ['academic', 'objective', 'precise'],
        prefill: {
            context: 'Conducting a systematic review on LLM reasoning capabilities (2023-2024).',
            identify: 'Key gaps in current literature and conflicting findings.',
            list: 'The most cited papers in the field of Chain-of-Thought prompting.'
        }
    },
    {
        id: 'cybersecurity',
        label: 'Cybersecurity',
        icon: 'Shield',
        description: 'Threat analysis, incident reports, & security protocols',
        frameworkId: 'rtcros',
        tones: ['technical', 'direct', 'authoritative'],
        prefill: {
            role: 'Lead Security Operations Analyst',
            context: 'Detected suspicious network activity. Standard incident response protocol.',
            stopping: 'Do not speculate. Stick to verified logs and facts.'
        }
    },
    {
        id: 'game-design',
        label: 'Game Design',
        icon: 'Gamepad2',
        description: 'Mechanics design, narrative arcs, & level progression',
        frameworkId: 'create',
        tones: ['creative', 'technical', 'enthusiastic'],
        prefill: {
            character: 'Lead Game Designer specializing in RPGs.',
            request: 'Design a progression system for a sci-fi open world.',
            type: 'Design Document (GDD) section.',
            extras: 'Include core loops and monetization strategy.'
        }
    },
    {
        id: 'biotech',
        label: 'Biotech R&D',
        icon: 'Dna',
        description: 'Lab protocols, grant proposals, & regulatory filings',
        frameworkId: 'roses',
        tones: ['academic', 'careful', 'technical'],
        prefill: {
            role: 'Senior Research Scientist (PhD)',
            objective: 'Draft a grant proposal for CRISPR gene editing research.',
            scenario: 'Applying for NIH funding. Competition is high.',
            expectedSolution: 'A compelling, compliant, and scientifically rigorous narrative.',
            steps: '1. Abstract 2. Specific Aims 3. Research Strategy'
        }
    },
    {
        id: 'supply-chain',
        label: 'Supply Chain',
        icon: 'Truck',
        description: 'Logistics optimization, inventory mgmt, & risk assessment',
        frameworkId: 'tracer',
        tones: ['analytical', 'pragmatic', 'direct'],
        prefill: {
            task: 'Optimize the last-mile delivery route.',
            role: 'Logistics Operations Manager',
            audience: 'Regional Directors',
            context: 'Fuel costs rising by 15%. Delivery delays increasing.',
            restrictions: 'Must maintain current fleet size.'
        }
    },
    {
        id: 'instructional-design',
        label: 'Instructional Design',
        icon: 'BookOpenCheck',
        description: 'Curriculum development, learning objectives, & ADDIE',
        frameworkId: 'roses',
        tones: ['instructional', 'structured', 'encouraging'],
        prefill: {
            role: 'Senior Instructional Designer',
            objective: 'Develop a 4-week course on Python for Beginners.',
            scenario: 'Target audience has zero coding experience.',
            expectedSolution: 'A detailed syllabus with weekly learning outcomes.',
            steps: '1. Module breakdown. 2. Quiz ideas. 3. Project specs.'
        }
    }
];

export const ROLE_PRESETS: Template[] = [
    {
        id: 'developer',
        label: 'Developer',
        icon: 'Code',
        description: 'Code generation, debugging, & architecture',
        frameworkId: 'tag',
        tones: ['technical', 'concise'],
        prefill: {
            task: 'Write clean, efficient, and documented code',
            action: 'Follow best practices (SOLID, DRY). Include unit tests.',
            goal: 'Production-ready solution'
        }
    },
    {
        id: 'writer',
        label: 'Writer',
        icon: 'PenTool',
        description: 'Blog posts, stories, & editing',
        frameworkId: 'costar',
        tones: ['creative', 'engaging'],
        prefill: {
            context: 'Writing for a high-traffic lifestyle blog.',
            style: 'Narrative-driven, SEO-optimized',
            audience: 'General public seeking inspiration'
        }
    },
    {
        id: 'analyst',
        label: 'Analyst',
        icon: 'BarChart',
        description: 'Data interpretation & reporting',
        frameworkId: 'elicit',
        tones: ['analytical', 'objective'],
        prefill: {
            explain: 'The trends observed in the provided dataset',
            identify: 'Key outliers and correlation patterns',
            context: 'Business intelligence report for Q4'
        }
    },
    {
        id: 'product-manager',
        label: 'Product Manager',
        icon: 'LayoutList',
        description: 'PRDs, user stories, & roadmap planning',
        frameworkId: 'scoped',
        tones: ['structured', 'clear', 'user-centric'],
        prefill: {
            situation: 'Planning the Q3 roadmap for a mobile app.',
            objective: 'Prioritize features based on user impact and effort.',
            people: 'Stakeholders: Engineering lead, Design lead, and VP of Product.'
        }
    },
    {
        id: 'scientist',
        label: 'Data Scientist',
        icon: 'FlaskConical',
        description: 'Model explanation, hypothesis testing, & EDA',
        frameworkId: 'care',
        tones: ['analytical', 'academic', 'precise'],
        prefill: {
            context: 'Developed a new predictive model (XGBoost) for churn.',
            action: 'Explain the feature importance plots and confusion matrix.',
            result: 'Stakeholders understand the business drivers of churn.'
        }
    },
    {
        id: 'designer',
        label: 'UX Designer',
        icon: 'Palette',
        description: 'User flows, persona creation, & design system docs',
        frameworkId: 'aps',
        tones: ['creative', 'empathetic', 'visual'],
        prefill: {
            audience: 'Developers and other designers.',
            purpose: 'Documenting the interaction patterns for the new checkout flow.',
            style: 'Visual, annotated, and using accessibility best practices.'
        }
    },
    {
        id: 'startup',
        label: 'Startup Founder',
        icon: 'Rocket',
        description: 'Pitch decks, value propositions, & investor updates',
        frameworkId: 'create',
        tones: ['persuasive', 'visionary', 'concise'],
        prefill: {
            character: 'Visionary Tech Founder raising Series A.',
            request: 'Draft an email update to existing investors.',
            extras: 'Include key metrics: 20% MoM growth, $1M ARR.'
        }
    },
    {
        id: 'solution-architect',
        label: 'Solution Architect',
        icon: 'Layers',
        description: 'System design, microservices patterns, & cloud scalability',
        frameworkId: 'tracer',
        tones: ['technical', 'authoritative', 'structured'],
        prefill: {
            task: 'Design a scalable architecture for a real-time chat app.',
            role: 'Principal Solution Architect',
            audience: 'CTO and Engineering Leads',
            context: 'Expected 1M concurrent users. Low latency is critical.',
            restrictions: 'Must use AWS managed services.'
        }
    },
    {
        id: 'ethical-hacker',
        label: 'Ethical Hacker',
        icon: 'ShieldAlert',
        description: 'Penetration testing reports, vulnerability assessment',
        frameworkId: 'rtcros',
        tones: ['technical', 'precise', 'objective'],
        prefill: {
            role: 'Certified Ethical Hacker (CEH)',
            task: 'Write a penetration test report for the login module.',
            context: 'Found a SQL Injection vulnerability in the auth flow.',
            reasoning: 'Demonstrate risk impact and reproduction steps.',
            output: 'Standard Vulnerability Report format (CVSS score included).'
        }
    },
    {
        id: 'crisis-manager',
        label: 'Crisis Manager',
        icon: 'Siren',
        description: 'Brand reputation, press releases, & damage control',
        frameworkId: 'scoped',
        tones: ['empathetic', 'firm', 'diplomatic'],
        prefill: {
            situation: 'Product recall due to safety defect.',
            complication: 'Social media panic is spreading.',
            objective: 'Maintain brand trust and inform customers safely.',
            people: 'Customers, Investors, Regulators.',
            execution: 'Immediate press release + FAQ page + Refund process.',
            deliverables: 'Draft the CEO statement.'
        }
    },
    {
        id: 'course-creator',
        label: 'Course Creator',
        icon: 'Video',
        description: 'Video scripts, lesson planning, & student engagement',
        frameworkId: 'create',
        tones: ['engaging', 'clear', 'motivational'],
        prefill: {
            character: 'Top-rated Udemy Instructor.',
            request: 'Script an intro video for a Digital Marketing course.',
            type: 'Video Script (2 minutes).',
            extras: 'Include a hook, value prop, and call to action.'
        }
    },
    {
        id: 'learning-architect',
        label: 'Learning Architect',
        icon: 'Network',
        description: 'Organizational learning strategy & skill mapping',
        frameworkId: 'tracer',
        tones: ['strategic', 'corporate', 'visionary'],
        prefill: {
            task: 'Design a leadership upskilling program for middle managers.',
            role: 'Chief Learning Officer (CLO)',
            audience: 'HR Directors and identifying managers.',
            context: 'Company is shifting to remote-first work.',
            restrictions: 'Must be hybrid (async + live workshops).'
        }
    }
];
