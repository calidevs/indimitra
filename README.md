# Indimitra - Indian Grocery Delivery App

A modern web application for Indian grocery delivery services built with React.js, Python FastAPI, and GraphQL.

## Tech Stack

### Frontend

- React 18 with Webpack 5
- Material-UI (MUI) v5 for components
- Apollo Client for GraphQL
- React Router v6 for routing

### Backend

- Python FastAPI
- Strawberry GraphQL
- SQLAlchemy with PostgreSQL
- Alembic for migrations

### Infrastructure

- Docker & Docker Compose
- PostgreSQL 13

## Project Structure

```
indimitra/
├── js/                     # Frontend application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── layout/     # Layout components (*.jsx)
│   │   │   ├── home/      # Home page components (*.jsx)
│   │   │   └── products/  # Product related components (*.jsx)
│   │   ├── pages/         # Page components (*.jsx)
│   │   ├── theme/         # MUI theme customization
│   │   ├── assets/        # Static assets
│   │   │   └── images/    # Image assets
│   │   ├── styles/        # Global styles (*.css)
│   │   ├── App.jsx        # Root component
│   │   └── index.jsx      # Entry point
│   ├── webpack/           # Webpack configuration
│   │   ├── webpack.common.js
│   │   ├── webpack.dev.js
│   │   └── webpack.prod.js
│   └── package.json
├── python/                  # Backend application
│   ├── app/                 # Application code
│   │   ├── config.py        # Configuration
│   │   ├── main.py          # Application entry point
│   │   ├── db/              # Database layer
│   │   │   ├── base.py      # Base class for models
│   │   │   ├── session.py   # DB engine and session setup
│   │   │   └── models/      # Model definitions
│   │   │       └── product.py   
│   │   ├── graphql/         # GraphQL API
│   │   │   ├── resolvers/   # GraphQL resolvers
│   │   │   └── schema.py    # Schema assembly
│   │   ├── services/        # Business logic
│   │   │   └── product_service.py
│   │   ├── api/             # REST API endpoints
│   │   │   └── routes/
│   │   │       └── product.py
│   │   └── utils/           # Utility functions
│   ├── dev_bootstrap/       # Bootstrap/seed scripts
│   │   ├── bootstrap.py     # Data seeding script
│   │   └── product_data.json  # Sample data
│   ├── Dockerfile           # Docker configuration
│   ├── requirements.txt     # Python dependencies
├── data/                  # Data storage
│   └── postgres/          # PostgreSQL data
└── docker-compose.yml
```

## Features

### Frontend

- Modern React with Webpack HMR
- Material Design components
- Responsive layout
- GraphQL integration
- Custom theme and styling
- Component-based architecture

### Backend

- GraphQL API with Strawberry
- FastAPI for high performance
- PostgreSQL database
- CORS configuration
- Type safety with Pydantic

## Setup & Running

1. **Clone the repository**:

```bash
git clone https://github.com/yourusername/indimitra.git
cd indimitra
```

2. **Environment Setup**:

   - Make sure you have Docker and Docker Compose installed
   - No other local dependencies required

3. **Start the Application**:

```bash
docker-compose up --build
```

4. **Access the Applications**:
   - Frontend: http://localhost:3000
   - GraphQL Playground: http://localhost:8000/graphql
   - Database: localhost:5432

## Development

### Frontend Development

```bash
cd js
npm install
npm start
```

Key commands:

- `npm start`: Start development server with HMR
- `npm run build`: Create production build
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier

### Backend Development

#### Create `.env` file at `python/`

```
# PostGres Config for dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=NotAllowed123
POSTGRES_HOST=dummy-db.ci528kc2ig6e.us-east-1.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_DB=IndiMart

# AWS Configuration for dev
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_ehhI7OmUk
COGNITO_USER_POOL_CLIENT_ID=1okaltgd288h6sjgc5cedlth45

# Graphql Playground setup
ENABLE_GRAPHQL_PLAYGROUND=true

```
This is needed to establish connection with DB and Cognito

---

You can choose to spin up backend in docker or in your local

#### 1. Spinning up in local (For backend development)

install postgresql before installing the packages in requirements.txt as it is a pre-req for psycopg2-binary

For Mac you can run - `brew install postgresql`

```bash
cd python
```
create a venv
```
python3 -m venv .venv    # You only need to run this the very first time, post that you can just run the below command
source .venv/bin/activate # For mac

OR

source .venv/Scripts/activate # For windows   
```
install packages

For Windows

```
remove psycopg2-binary from requirements.txt

run - pip install psycopg2-binary==2.9.9

then run - pip install -r requirements.txt
```

For mac below should work
```
pip install -r requirements.txt
```

start api server

```
uvicorn app.main:app --reload
```

You can access GraphQl interface at `localhost:8000/graphql` 
---

#### 2. Spinning up in docker

This is easy! Run the below command and you should be good to go.

```
docker-compose up --build db api
```

---

### Spinning up db in docker

From root `/indimart` spin up db

```
docker-compose up --build db
```

And psql using - `psql -h localhost -p 5432 -U indimitra -W`

Handy psql commands - [click here](https://hasura.io/blog/top-psql-commands-and-flags-you-need-to-know-postgresql)

### Docker Commands

- Start all services: `docker-compose up`
- Rebuild services: `docker-compose up --build`
- Stop all services: `docker-compose down`
- View logs: `docker-compose logs -f`

## Available Pages

- `/`: Home page with hero section
- `/products`: Products listing page
- `/cart`: Shopping cart (coming soon)

## Component Library

The application uses Material-UI components with custom theme:

- `Layout`: Base layout with header
- `Header`: Navigation header with menu
- `ProductCard`: Individual product display
- `ProductGrid`: Grid layout for products

## Theme Customization

Custom theme configuration in `js/src/theme/index.js`:

- Custom color palette
- Typography settings
- Component style overrides
- Responsive design utilities
