export const ANALYSIS_MODES = [
    {
        id: 'general',
        label: 'General Deconstruction',
        icon: '🔍',
        description: 'Standard CO-STAR breakdown',
        tooltip: 'Deeply analyzes content structure, tone, and audience using the CO-STAR framework to reconstruct the original prompt.',
        category: 'General'
    },
    {
        id: 'design',
        label: 'Design System',
        icon: '🎨',
        description: 'UI/UX Token extraction',
        tooltip: 'Reverse-engineers UI/UX elements into design tokens (colors, spacing, typography) and HTML/CSS scaffolds.',
        category: 'Design & Product'
    },
    {
        id: 'product',
        label: 'PRD & User Stories',
        icon: '📝',
        description: 'Feature Spec Generator',
        tooltip: 'Converts screenshots or raw ideas into structured Product Requirement Documents (PRD), User Stories, and Gherkin syntax.',
        category: 'Design & Product'
    },
    {
        id: 'code',
        label: 'Code Optimization',
        icon: '💻',
        description: 'Performance & Pattern extraction',
        tooltip: 'Extracts design patterns, performance optimizations, and architectural decisions to generate high-quality code prompts.',
        category: 'Coding & Engineering'
    },
    {
        id: 'security',
        label: 'Security Audit',
        icon: '🛡️',
        description: 'Vulnerability & Patch analysis',
        tooltip: 'Scans for OWASP vulnerabilities and security gaps, generating prompts for penetration testing and harding.',
        category: 'Coding & Engineering'
    },
    {
        id: 'bug',
        label: 'Bug/Incident Analysis',
        icon: '🐞',
        description: 'RCA & Post-Mortem builder',
        tooltip: 'Deconstructs incident logs to perform Root Cause Analysis (RCA) and generate reproduction scripts automatically.',
        category: 'Coding & Engineering'
    },
    {
        id: 'data',
        label: 'Schema & Data Eng',
        icon: '🗄️',
        description: 'ERD & Pipeline Analysis',
        tooltip: 'Reverse engineers database schemas, SQL queries, and ETL pipelines to generate optimized data models.',
        category: 'Coding & Engineering'
    },
    {
        id: 'marketing',
        label: 'Copy & SEO Strategy',
        icon: '📢',
        description: 'Tone & Keyword Analysis',
        tooltip: 'Deconstructs marketing copy using AIDA/PAS frameworks, extracting SEO keywords and brand voice parameters.',
        category: 'Writing & Strategy'
    }
];

export const FOCUS_TEMPLATES: Record<string, string> = {
    general: "Perform a rigorous 'First Principles' analysis of this input.\n\nDeconstruct it into its fundamental truths: Context, Intent, Subtext, and Structural Logic. Output a comprehensive breakdown that reveals the hidden patterns.",

    design: "Execute a 'Visual Decompilation' of this UI.\n\n1. Extract the exact Design DNA (Colors, Typographic Scale, Shadows, Corner Radii).\n2. Map the Component Hierarchy (Atoms/Molecules).\n3. Identify implied interactive states (Hover/Active).\n\nOutput a 'Master Design Spec' ready for implementation.",

    product: "Deconstruct this feature request into a production-ready Product Requirements Document (PRD).\n\n**Required Sections**:\n- Core Value Proposition (The 'Why').\n- Detailed User Stories (Given/When/Then).\n- Acceptance Criteria & Edge Cases.\n- Success Metrics (KPIs).",

    code: "Conduct a forensic code audit focusing on Performance, Security, and Scalability.\n\n1. Determine Big-O Time/Space Complexity.\n2. Identify Anti-Patterns and Refactoring opportunities.\n3. Suggest strictly typed interfaces (TypeScript).\n4. Propose a modernized architecture.",

    security: "Perform a 'Red Team' vulnerability assessment.\n\n1. Scan for OWASP Top 10 risks (Injection, XSS, Broken Auth).\n2. Analyze data flow for privacy leaks.\n3. Stress-test logic boundaries.\n\nOutput a prioritized 'Vulnerability Patch Report'.",

    bug: "Analyze this error stack trace or bug report using the '5 Whys' Root Cause Analysis method.\n\n1. Isolate the exact point of failure.\n2. Reconstruct the state that led to the crash.\n3. Propose a robust fix + Regression Test case.",

    data: "Reverse-engineer the implicit Data Schema.\n\n1. Identify Entities, Attributes, and Relationships.\n2. Propose a normalized ERD (Entity Relationship Diagram).\n3. Suggest indexing strategies for high-performance queries.",

    marketing: "Deconstruct the persuasive architecture of this copy.\n\n1. Analyze the Tone, Voice, and Emotional Triggers.\n2. Extract SEO Keywords and Semantic Density.\n3. Evaluate against AIDA (Attention, Interest, Desire, Action) framework."
};

export const GOD_MODE_INSTRUCTION = `
[SYSTEM STATUS: GOD MODE ACTIVE]
You are now operating at the highest possible level of cognitive analysis.
Your analysis must be:
1. **Bible-Standard Accurate**: No hallucinations. Verify every observation.
2. **MECE (Mutually Exclusive, Collectively Exhaustive)**: Leave no pixel, line of code, or requirement unanalyzed.
3. **First Principles Thinking**: Deconstruct the input down to its fundamental truths before reconstructing.
4. **STRICT ANTI-HALLUCINATION PROTOCOL (GOD MODE)**:
   - **Evidence Requirement**: You must CITE EVIDENCE for every claim (e.g., "White background observed at [0,0]").
   - **Negative Constraints**:
     - NEVER invent data fields that are cut off.
     - NEVER assume responsiveness if only desktop is shown.
     - NEVER guess colors; sample them.
   - **Epistemological Validation**:
     - *Question*: "Do I see this, or do I just expect it?"
     - *Action*: If the answer is "expect", REJECT the observation.
   - **Zero-Guess Policy**: Explicitly output \`[UNKNOWN: Missing Viewport]\` or \`[UNKNOWN: Obscured]\` instead of guessing.
   - **Constraint**: If user tech stack is HTML, DO NOT hallucinate React components.
5. **ATOMIC GRANULARITY**:
   - **Micro-Interactions**: Analyze subtle states (hover, focus, active, disabled) and transitions.
   - **Pixel-Physics**: Observe "weight", "density", and "velocity" of elements.
   - **Hidden Logic**: Infer data structures from visible UI patterns (e.g., "List implies Array<Object>").
`;

export const TECHNOLOGIES_DEFAULT = 'React, Tailwind CSS, Lucide Icons';

export const CURSOR_AGENT_PROTOCOL = `
<CURSOR_AGENT_PROTOCOL>
You are emulating the "Cursor AI Agent" (Sonnet-3.7 based model).
Key Behaviors:
1. **Context-First**: Always reference specific file paths.
2. **Diff-Centric**: Provide EXACT search/replace blocks.
3. **Stack-Aware**: Strictly adhere to the user's requested tech stack.
</CURSOR_AGENT_PROTOCOL>`;

export const GEMINI_VIBE_CODER_PROTOCOL = `
<GEMINI_VIBE_CODER_PROTOCOL>
You are emulating the "Gemini Vibe Coder" (World-Class Engineer).
**Runtime**: Strictly use appropriate modern stack.
**Styling**: Use best-in-class styling for this stack (e.g., Tailwind for React, CSS Variables for HTML).
**Structure**:
- Modular and Scalable.
- **Pitfall Avoidance**: Avoid framework-specific anti-patterns (e.g., Infinite Loops in React, Global Scope pollution in JS).
</GEMINI_VIBE_CODER_PROTOCOL>`;

export const SONNET_DESIGN_PROTOCOL = `
<SONNET_DESIGN_PROTOCOL>
You are emulating "Claude Sonnet 4.5" Design Principles.
**Aesthetics**:
- **Wow Factor**: Users should be stunned by the visual quality.
- **Micro-Animations**: Interface must feel "alive".
- **Typography**: Use bold, expressive fonts.
**Functionality**:
- **No Placeholders**: Generate real, functional content.
- **Interactive**: Buttons must look clickable, inputs active.
- **Accessibility**: Ensure high contrast.
</SONNET_DESIGN_PROTOCOL>`;

export const V0_DESIGN_PROTOCOL = `
<V0_DESIGN_PROTOCOL>
You are emulating the "v0.dev" Generation Model.
Key Behaviors:
1. **Stack-Native**: Use components native to React/Shadcn.
2. **Tailwind Mastery**: If adhering to HTML/CSS/React, use Tailwind utility classes strictly.
3. **Icons**: Use 'lucide-react' (if React) or SVG icons (if HTML).
4. **Layout**: Always implement Mobile-First responsive design.
5. **No Placeholders**: Generate real text labels.
</V0_DESIGN_PROTOCOL>`;
