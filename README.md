# Zidsa Action

A GitHub Action for automating Zidsa theme management and deployment.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Overview

Zidsa Action is a GitHub Action designed to streamline the workflow for Zidsa theme developers. It provides automated processes for theme validation, versioning, and deployment directly from your GitHub repository.

## Features

- **Theme Updates**: Automatically update themes with proper versioning
- **Version Management**: Intelligent version bumping based on changes (major, minor, patch)
- **Secure Authentication**: Handles API authentication securely
- **Theme Packaging**: Automatically zips theme files for deployment
- **Input Validation**: Validates inputs to prevent deployment errors

## Usage

### Basic Example

```yaml
name: Deploy Zidsa Theme

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Zidsa
        uses: younis/zidsa-action@v1
        with:
          THEME_ID: ${{ secrets.THEME_ID }}
          EMAIL: ${{ secrets.ZIDSA_EMAIL }}
          PASSWORD: ${{ secrets.ZIDSA_EMAIL_PASSWORD }}
```

### Inputs

| Name       | Description                 | Required | Default |
| ---------- | --------------------------- | :------: | ------- |
| `theme_id` | The ID of your Zidsa theme  |   Yes    | -       |
| `EMAIL`    | Your Zidsa account email    |   Yes    | -       |
| `PASSWORD` | Your Zidsa account password |   Yes    | -       |

## Setup

### Obtaining a Theme ID

1. Log in to your Zidsa dashboard
2. Navigate to Themes section
3. Select your theme
4. Copy the Theme ID from the URL or theme settings
5. Store it in your GitHub repository secrets as `THEME_ID`
6. Repeat for `ZIDSA_EMAIL` and `ZIDSA_EMAIL_PASSWORD`

## Development

### Prerequisites

- Node.js (v20 or newer)
- pnpm

### Local Setup

```bash
# Clone the repository
git clone https://github.com/younis/zidsa-action.git
cd zidsa-action

# Install dependencies
pnpm install

# Run tests
pnpm test
```

### Testing Changes

You can test your changes locally using:

```bash
pnpm build
pnpm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/younis/zidsa-action/issues) on GitHub.
