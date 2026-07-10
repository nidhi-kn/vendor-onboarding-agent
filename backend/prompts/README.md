# AI Agent Prompts - Versioned and Tracked

This directory contains all AI agent system prompts as versioned markdown files.

## Why Versioned Prompts?

### Benefits

1. **Version Control** - Track prompt changes in Git
2. **Rollback** - Easy to revert to previous versions
3. **A/B Testing** - Test different prompt versions
4. **Collaboration** - Review prompt changes like code
5. **Documentation** - Prompts are self-documenting
6. **Separation of Concerns** - Prompts separate from code logic

### Anti-Pattern (What NOT to Do)

❌ **Inline String Prompts:**
```javascript
const prompt = `You are an AI assistant...
Very long prompt inline in code...`;
```

**Problems:**
- Hard to version
- Difficult to review changes
- Mixed with code logic
- Hard to iterate and test
- Poor separation of concerns

✅ **File-Based Versioned Prompts:**
```javascript
const prompt = loadSystemPrompt('v1');
```

**Benefits:**
- Clean version history
- Easy to review in PRs
- Testable independently
- Clear separation from code
- Can swap versions at runtime

## Directory Structure

```
prompts/
├── README.md (this file)
├── planner/
│   ├── v1.md (current version)
│   ├── v2.md (future iteration)
│   └── changelog.md (version history)
└── [future agents]/
    └── v1.md
```

## Prompt Versioning Strategy

### Version Naming

- **v1, v2, v3...** - Major prompt versions
- **v1.1, v1.2...** - Minor refinements (optional)

### When to Create New Version

Create a new version when:
- Changing agent behavior significantly
- Adding/removing tools
- Modifying output format
- A/B testing different approaches
- Major workflow changes

### Changelog

Document changes in `changelog.md`:
```markdown
## v2 (2024-02-01)
- Added support for multi-language responses
- Improved document validation instructions
- Added error recovery guidelines

## v1 (2024-01-10)
- Initial production prompt
- Supports 11 workflow states
- 7 tool integrations
```

## Usage

### Loading Prompts

```javascript
const { loadSystemPrompt } = require('./agent/plannerPrompt');

// Load default version (v1)
const prompt = loadSystemPrompt();

// Load specific version
const promptV2 = loadSystemPrompt('v2');
```

### Environment-Based Versions

```javascript
// .env
PLANNER_PROMPT_VERSION=v2

// Code
const version = process.env.PLANNER_PROMPT_VERSION || 'v1';
const prompt = loadSystemPrompt(version);
```

### A/B Testing

```javascript
// Randomly assign versions
const version = Math.random() > 0.5 ? 'v1' : 'v2';
const prompt = loadSystemPrompt(version);
```

## Prompt Format

All prompts should follow this structure:

```markdown
# [Agent Name] System Prompt - Version X.Y

[Brief description]

## YOUR IDENTITY
[Define agent role and purpose]

## YOUR RESPONSIBILITIES
[List key responsibilities]

## OUTPUT FORMAT
[Define expected output structure]

## GUIDELINES
[Decision-making rules]

## EXAMPLES
[Show example interactions]

## REMEMBER
[Key constraints and reminders]

---

**Version:** X.Y
**Last Updated:** YYYY-MM-DD
**Model:** [LLM model name]
```

## Current Prompts

### Planner Agent (v1)

**File:** `planner/v1.md`  
**Status:** ✅ Production  
**Model:** llama-3.3-70b-versatile  
**Last Updated:** 2024-01-10

**Purpose:** Orchestrates vendor onboarding workflow decisions

**Key Features:**
- 11 workflow states
- 7 tool integrations
- Structured JSON output
- Decision-making guidelines
- Example interactions

## Best Practices

### DO:
✅ Version prompts as files  
✅ Document changes in changelog  
✅ Include examples in prompts  
✅ Test prompts independently  
✅ Review prompt changes in PRs  
✅ Use semantic versioning  

### DON'T:
❌ Inline prompts in code  
❌ Mix prompt logic with business logic  
❌ Skip version documentation  
❌ Change production prompts without testing  
❌ Use unversioned prompts  

## Testing Prompts

```bash
# Test specific prompt version
PLANNER_PROMPT_VERSION=v2 node test-planner.js

# Compare versions
node scripts/compare-prompts.js v1 v2
```

## Future Enhancements

- [ ] Prompt performance metrics
- [ ] Automated prompt testing
- [ ] Prompt A/B test framework
- [ ] Prompt analytics dashboard
- [ ] Multi-language prompts
- [ ] Prompt compression for token optimization

---

**Status:** ✅ Production-Ready  
**Version Control:** Git-tracked  
**Format:** Markdown (.md)  
**Loading:** File-based with caching
