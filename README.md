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
├── outbound-calls/           # Outbound call testing examples
│   ├── python/
│   │   ├── basic_example.py
│   │   └── advanced_example.py
│   └── typescript/
│       ├── basic_example.ts
│       └── advanced_example.ts
├── inbound-calls/            # Inbound call testing examples
│   ├── python/
│   │   ├── basic_example.py
│   │   └── advanced_example.py
│   └── typescript/
│       ├── basic_example.ts
│       └── advanced_example.ts
├── shared/                   # Shared utilities and configurations
│   ├── python/
│   │   └── hamming_client.py
│   ├── typescript/
│   │   └── hamming-client.ts
│   └── .env.example
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

### Outbound Calls
Test your voice agents by making outbound calls:
```bash
# Python examples
python outbound-calls/python/basic_example.py
python outbound-calls/python/advanced_example.py

# TypeScript examples
npm run outbound:basic
npm run outbound:advanced
```

### Inbound Calls
Test your voice agents by setting up inbound call endpoints:
```bash
# Python examples
python inbound-calls/python/basic_example.py
python inbound-calls/python/advanced_example.py

# TypeScript examples
npm run inbound:basic
npm run inbound:advanced
```

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