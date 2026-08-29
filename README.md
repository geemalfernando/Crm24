# CRM24

CRM24 is a small REST API for reviewing company records and migrating selected companies into a separate MongoDB collection. It is built with Node.js, Express, and Mongoose.

## Features

- Check whether the API is running.
- Retrieve company records from the `Companies` collection.
- Validate and store selected companies in `companies_migrated`.
- List migrated companies in reverse chronological order.
- Accept JSON request bodies up to 10 MB.
- Shut down gracefully when the process receives `SIGINT` or `SIGTERM`.

## Tech stack

- Node.js
- Express 4
- MongoDB
- Mongoose 8
- dotenv
- CORS

## Project structure

```text
CRM24/
├── README.md
└── Crm24/
    └── company_migration/
        ├── config/
        │   └── db.js
        ├── models/
        │   ├── CompanyAI.js
        │   └── CompanyMigrated.js
        ├── package.json
        └── server.js
```

## Prerequisites

Install the following before running the project:

- Node.js 18 or newer
- npm
- A local MongoDB instance or a MongoDB Atlas connection string

## Getting started

1. Clone the repository:

   ```bash
   git clone https://github.com/geemalfernando/CRM24.git
   cd CRM24/Crm24/company_migration
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file inside `Crm24/company_migration`:

   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/crm24
   PORT=5000
   ```

   `MONGO_URI` is required. `PORT` is optional and defaults to `5000`.

4. Start the API:

   ```bash
   node server.js
   ```

5. Confirm that it is running:

   ```bash
   curl http://localhost:5000/
   ```

   Expected response:

   ```json
   { "status": "OK" }
   ```

If the configured port is unavailable, the server attempts to select another port. Check the terminal output for the actual URL.

## API reference

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Returns the API health status. |
| `GET` | `/api/get-companies` | Returns all records from the `Companies` collection. |
| `POST` | `/api/store-companies` | Validates and stores a company in `companies_migrated`. |
| `GET` | `/api/migrated-companies` | Returns migrated companies, newest first. |

### Store a company

The following fields are required:

- `companyName`
- `companyAddress`
- `contactPersonName`
- `contactPersonNumber`
- `contactPersonEmail`
- `industry_id`

`comment` is optional. The API adds `migratedAt` automatically.

Example request:

```bash
curl -X POST http://localhost:5000/api/store-companies \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Example Company",
    "companyAddress": "123 Main Street",
    "contactPersonName": "Alex Silva",
    "contactPersonNumber": "+94 77 123 4567",
    "contactPersonEmail": "alex@example.com",
    "industry_id": "507f1f77bcf86cd799439011",
    "comment": "Ready for migration"
  }'
```

If required fields are missing, the API responds with `400 Bad Request` and identifies them:

```json
{
  "error": "Missing required fields",
  "missingFields": ["contactPersonEmail"]
}
```

## Data collections

CRM24 uses two MongoDB collections:

- `Companies` — source records returned by `/api/get-companies`.
- `companies_migrated` — destination records created through `/api/store-companies`.

Both models use the same core company and contact fields. Migrated records also include a `migratedAt` timestamp.

## Production considerations

The current API is suitable for development or trusted internal environments. Before exposing it publicly, consider adding:

- Authentication and role-based authorization
- Restricted CORS origins
- Request rate limiting
- Stronger email, phone number, and ObjectId validation
- Centralized error logging and monitoring
- Automated tests

Never commit database credentials or other secrets. Keep `.env` files local and use your deployment platform's secret-management system in production.

## License

The package metadata declares the ISC license. Add a root `LICENSE` file before distributing the project under that license.
