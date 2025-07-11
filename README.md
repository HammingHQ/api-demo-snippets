# Hamming AI API Demo Snippets

Executable code examples for the Hamming AI API. These snippets are designed to be embedded in the API documentation and run directly by developers.

## 🚀 Quick Start

### Prerequisites
- Python 3.7+
- Node.js 16+ (for TypeScript examples)
- Hamming AI API Key ([Get one here](https://app.hamming.ai/settings/api-keys))

### Environment Setup
```bash
# Set your API key
export HAMMING_API_KEY="your-api-key-here"

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies (for TypeScript examples)
npm install
```

## 📁 Repository Structure

```
api-demo-snippets/
├── outbound-calls/           # Voice agent testing examples
│   ├── python/
│   │   └── basic_example.py
│   └── typescript/
│       └── basic_example.ts
├── shared/                   # Shared utilities and configurations
│   ├── python/
│   │   └── hamming_client.py
│   └── typescript/
│       └── hamming-client.ts
├── package.json
├── tsconfig.json
└── requirements.txt
```

## 🔗 Integration with API Documentation

These examples are designed to be:
- **Executable**: Run directly with minimal setup
- **Embeddable**: Copy-paste into documentation
- **Educational**: Include detailed comments and explanations
- **Production-ready**: Include error handling and best practices

## 📖 Usage Examples

### Voice Agent Testing
Test your voice agents with the Hamming AI API:
```bash
# Set environment variables
export HAMMING_API_KEY="your-api-key-here"
export HAMMING_AGENT_ID="your-agent-id"

# Python example
python outbound-calls/python/basic_example.py

# TypeScript example
npm run test:basic
```

### How It Works
1. **Create Test Run**: The API returns assigned phone numbers for your test cases
2. **Make Calls**: Call the assigned numbers to execute your tests
3. **Get Results**: Monitor progress and retrieve detailed results
4. **View Dashboard**: Access comprehensive analytics in the web dashboard

## 🌐 Multi-language Support

Examples are provided in:
- **Python**: Full-featured examples with comprehensive error handling
- **TypeScript**: Type-safe examples with modern async/await syntax

## 📚 Documentation

Each example includes:
- Inline comments explaining each step
- Configuration options
- Error handling patterns
- Integration examples
- Best practices

## 🤝 Contributing

These examples are maintained by the Hamming AI team. For issues or improvements, please reach out through our support channels.

## 📄 License

MIT License - see LICENSE file for details.