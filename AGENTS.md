# AI DevKit & Antigravity Rules

## Project Context
This project is **LifeOS**, a Personal Knowledge & Resource Planning System using a Microservices architecture. It is optimized for Google Antigravity-assisted development.

### Technology Stack
- **Frontend**: React (Vite), TypeScript, ShadcnUI, TailwindCSS, Zustand, TanStack Query.
- **Backend (Node)**: Node.js (Express/NestJS) for Auth, Knowledge, and Planner services.
- **Backend (Python)**: Python (FastAPI) for Finance and Intelligence (AI/OCR/RAG) services.
- **Databases**: PostgreSQL (Main), MongoDB (Planner), ChromaDB (Vector Search).
- **Infrastructure**: Docker, Docker Compose, Nginx (API Gateway).

## Antigravity Advanced Tooling
Use these tools proactively to ensure high-quality delivery:
- **Browser Subagent**: Use for E2E testing, visual UI verification, and complex web interactions.
- **Search Web**: Research best practices, library documentation, and new technologies.
- **Generate Image**: Create high-quality assets or UI mockups; avoid using placeholders.
- **Read URL Content**: Extract content from external documentation or reference articles.

## Rich Aesthetics & UI Standards
- **Premium Design**: All UI components must feel premium and state-of-the-Art. Avoid generic colors; use harmonic palettes, modern typography (Inter/Outfit), and smooth gradients.
- **Micro-Animations**: Implement subtle hover effects and transitions.
- **Visual Accuracy**: Use the `browser` tool to verify that the implemented UI matches the "Rich Aesthetics" goal.

## Documentation Structure
- `docs/ai/requirements/` - Problem understanding and requirements
- `docs/ai/design/` - System architecture and design decisions (include mermaid diagrams)
- `docs/ai/planning/` - Task breakdown and project planning
- `docs/ai/implementation/` - Implementation guides and notes
- `docs/ai/testing/` - Testing strategy and test cases
- `docs/ai/deployment/` - Deployment and infrastructure docs
- `docs/ai/monitoring/` - Monitoring and observability setup

## Code Style & Standards
- **General**: Write clear, self-documenting code with meaningful variable names.
- **Python**: 
  - Prohibit inline code comments.
  - Use PEP 257-compliant docstrings for all functions, classes, and modules.
- **React/TS**:
  - Use Functional Components with TypeScript interfaces for props.
  - Prioritize composable and reusable components using ShadcnUI.
- **Architecture**: Follow the project's established microservices boundaries and conventions.

## Development Workflow
- Review phase documentation in `docs/ai/` before implementing features
- Keep requirements, design, and implementation docs updated as the project evolves
- Reference the planning doc for task breakdown and priorities
- Copy the testing template (`docs/ai/testing/README.md`) before creating feature-specific testing docs

## AI Interaction Guidelines
- When implementing features, first check relevant phase documentation
- For new features, start with requirements clarification
- Update phase docs when significant changes or decisions are made

## Skills (Extend Your Capabilities)
Skills are packaged capabilities that teach you new competencies, patterns, and best practices. Check for installed skills in the project's skill directory and use them to enhance your work.

### Using Installed Skills
1. **Check for skills**: Look for `SKILL.md` files in the project's skill directory
2. **Read skill instructions**: Each skill contains detailed guidance on when and how to use it
3. **Apply skill knowledge**: Follow the patterns, commands, and best practices defined in the skill

### Key Installed Skills
- **memory**: Use AI DevKit's memory service via CLI commands when MCP is unavailable. Read the skill for detailed `memory store` and `memory search` command usage.

### When to Reference Skills
- Before implementing features that match a skill's domain
- When MCP tools are unavailable but skill provides CLI alternatives
- To follow established patterns and conventions defined in skills

## Knowledge Memory (Always Use When Helpful)
The AI assistant should proactively use knowledge memory throughout all interactions.

> **Tip**: If MCP is unavailable, use the **memory skill** for detailed CLI command reference.

### When to Search Memory
- Before starting any task, search for relevant project conventions, patterns, or decisions
- When you need clarification on how something was done before
- To check for existing solutions to similar problems
- To understand project-specific terminology or standards

**How to search**:
- Use `memory.searchKnowledge` MCP tool with relevant keywords, tags, and scope
- If MCP tools are unavailable, use `npx ai-devkit memory search` CLI command (see memory skill for details)
- Example: Search for "authentication patterns" when implementing auth features

### When to Store Memory
- After making important architectural or design decisions
- When discovering useful patterns or solutions worth reusing
- If the user explicitly asks to "remember this" or save guidance
- When you establish new conventions or standards for the project

**How to store**:
- Use `memory.storeKnowledge` MCP tool
- If MCP tools are unavailable, use `npx ai-devkit memory store` CLI command (see memory skill for details)
- Include clear title, detailed content, relevant tags, and appropriate scope
- Make knowledge specific and actionable, not generic advice

### Memory Best Practices
- **Be Proactive**: Search memory before asking the user repetitive questions
- **Be Specific**: Store knowledge that's actionable and reusable
- **Use Tags**: Tag knowledge appropriately for easy discovery (e.g., "api", "testing", "architecture")
- **Scope Appropriately**: Use `global` for general patterns, `project:<name>` for project-specific knowledge

## Testing & Quality
- Write tests alongside implementation
- Follow the testing strategy defined in `docs/ai/testing/`
- Use `/writing-test` to generate unit and integration tests targeting 100% coverage
- Ensure code passes all tests before considering it complete

## Documentation
- Update phase documentation when requirements or design changes
- Keep inline code comments focused and relevant
- Document architectural decisions and their rationale
- Use mermaid diagrams for any architectural or data-flow visuals (update existing diagrams if needed)
- Record test coverage results and outstanding gaps in `docs/ai/testing/`

## Key Commands & Workflows
When working on this project, leverage the following built-in workflows (Slash Commands):
- `/review-requirements`: Understand project requirements and goals.
- `/review-design`: Review architectural decisions.
- `/execute-plan`: Plan and execute tasks interactively.
- `/check-implementation`: Verify implementation against design.
- `/writing-test`: Generate unit and integration tests (target 100% coverage).
- `/code-review`: Perform structured code reviews.
- `/debug`: Guided debugging for identifying and fixing issues.
- `/capture-knowledge`: Document entry points and patterns.
- `/remember`: Store reusable guidance in memory.
