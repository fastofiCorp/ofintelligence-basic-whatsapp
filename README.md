
# OFIntelligence Basic WhatsApp

## Overview

A package to interact with WhatsApp and OpenAI, developed by [FastOfi](https://github.com/orgs/fastofiCorp/).

## Prerequisites

* Node.js (v18.0.0 or higher)
* pnpm (v10.4.1)
* MySQL Database

## Technologies Used

* Express.js
* OpenAI
* MySQL2
* Axios
* Joi (Validation)
* Winston (Logging)
* Helmet (Security)
* Cors
* Compression

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/FastOfi/ofintelligence-basic-whatsapp.git
cd ofintelligence-basic-whatsapp
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
# Database Configuration
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database_name

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Server Configuration
PORT=3000
```

### 4. Database Setup

Ensure you have a MySQL database created. You may need to run initial migration scripts or setup queries.

### 5. Running the Application

```bash
# Development mode
pnpm dev

# Production mode
pnpm start
```

## Key Dependencies

* `express`: Web application framework
* `openai`: OpenAI API integration
* `mysql2`: MySQL database connection and queries
* `axios`: HTTP client for making API requests
* `dotenv`: Environment variable management
* `joi`: Input validation
* `winston`: Logging
* `helmet`: Security middleware
* `cors`: Cross-origin resource sharing
* `compression`: Response compression

## Project Structure

```
project-root/
│
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── middleware/
│
├── config/
├── .env
├── package.json
└── README.md
```

## Scripts

* `start`: Run the production server
* `dev`: Run the development server with nodemon
* `test`: Currently returns an error (no tests specified)

## Error Handling

The application includes error handling mechanisms for:

* Database connections
* API requests
* Input validation
* Authentication

## Security Considerations

* Environment variables for sensitive information
* Input validation with Joi
* Security headers with Helmet
* CORS configuration
* Rate limiting
* Compression to reduce payload size

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

ISC License

## Package Management

* Package Manager: pnpm v10.4.1

## Contact

* Organization: [FastOfi](https://github.com/orgs/fastofiCorp/)

## Acknowledgments

* Node.js Community
* OpenAI
* Express.js Team
* pnpm

```

```
