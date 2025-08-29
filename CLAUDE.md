# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome browser extension for cross-border e-commerce content localization and user experience analysis. The plugin automatically analyzes web page content for regional adaptation, focusing on language, cultural, compliance, and user experience optimization for independent e-commerce sites and Shopify stores.

## Architecture

The project follows a layered architecture with front-end/back-end separation:

### Front-end Chrome Extension
- **Technology**: Chrome Manifest V3, content_scripts, React
- **Responsibilities**: Page content extraction, regional selection UI, results display, report export
- **Key Components**: 
  - Content scripts for web scraping
  - Background scripts for lifecycle management
  - Popup/options UI for user interaction

### Local Analysis Layer
- **Purpose**: Fast rule-based analysis using pre-existing localization datasets
- **Data Dependencies**:
  - Language and cultural dictionaries
  - Regulatory keyword databases
  - Network/device performance data
  - User behavior patterns
- **Execution**: Lightweight rule engine for immediate scoring without network dependency

### AI Analysis Layer  
- **Integration**: Multiple LLM APIs (DeepSeek, Zhipu, Qwen, ChatGPT)
- **Capabilities**: Semantic understanding, compliance assessment, deep optimization recommendations
- **Strategy**: Intelligent caching and call optimization for performance/cost balance

### Backend Services
- **Architecture**: RESTful API services
- **Features**: AI model orchestration, dynamic rule configuration, report synthesis, cloud extensions

## Rule Engine Design

The core rule engine processes content across multiple dimensions:

```javascript
const rules = {
  language: {
    detection: "Auto-detect page language vs target region",
    compliance: "Terminology and phrasing validation"
  },
  culture: {
    imagery: "Cultural symbol and visual appropriateness", 
    holidays: "Regional holiday and custom awareness",
    taboos: "Cultural sensitivity screening"
  },
  compliance: {
    privacy: "Privacy policy and data protection",
    prohibited: "Restricted product identification",
    advertising: "Marketing content regulation"
  },
  userExperience: {
    performance: "Page load and device compatibility",
    preferences: "Regional app usage patterns"
  }
}
```

## Development Commands

Since this is a new Chrome extension project, typical development commands will include:

```bash
# Install dependencies
npm install

# Build extension for development
npm run build:dev

# Build extension for production  
npm run build:prod

# Run linting
npm run lint

# Run tests
npm test

# Watch mode for development
npm run dev
```

## Key Technical Considerations

### Chrome Extension Constraints
- Must comply with Manifest V3 requirements
- Content Security Policy restrictions apply
- Limited background script capabilities
- Service worker lifecycle management needed

### Privacy & Security
- No uploading of user browsing content
- Local processing prioritized over cloud analysis
- Secure API communication for AI services
- Compliance with Chrome Web Store policies

### Multi-regional Support
- Dynamic rule adjustment per target market
- Localized analysis models and datasets
- Cultural sensitivity in scoring algorithms
- Regional network performance considerations

### Performance Optimization
- Efficient content scraping without blocking page load
- Intelligent caching of analysis results
- Progressive loading of analysis components
- Minimal memory footprint in browser context

## Integration Points

### Shopify Integration
- Planned as paid Shopify application
- Theme compatibility requirements
- Shopify API integration for enhanced analysis

### Third-party Services
- Multiple LLM provider fallback strategy
- Regional network performance APIs
- Cultural and compliance data providers
- Analytics and reporting services

## Data Flow

1. **Content Extraction**: Content scripts capture page elements, meta tags, structured data
2. **Local Analysis**: Rule engine processes content against regional datasets  
3. **AI Enhancement**: Selected content sent to LLM APIs for deep analysis
4. **Result Synthesis**: Combined local + AI results generate comprehensive reports
5. **User Presentation**: Visual dashboard with scoring, risks, and recommendations

## Testing Strategy

- Unit tests for rule engine logic
- Integration tests for Chrome extension APIs
- Cross-browser compatibility testing
- Regional dataset accuracy validation
- Performance benchmarking across different page types