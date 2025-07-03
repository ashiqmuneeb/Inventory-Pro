# Inventory-Pro
Overview
This is a comprehensive Inventory Management System built with Django (backend) and React with Material-UI (frontend). The system provides features for managing products, variants, stock movements, and generating reports.

username=admin
password=12345

Features
Product Management
Create, read, update, and delete products

Manage product variants and options

Product image upload capability

Unique product code validation

Stock Management
Add and remove stock with transaction tracking

Real-time stock level monitoring

Stock movement history

Low stock alerts

Reporting
Dashboard with key metrics

Stock transaction reports

Visual charts for inventory analysis

Export capabilities (PDF, CSV)

User Interface
Responsive design with Material-UI

Intuitive forms and data tables

Interactive charts and visualizations

Role-based access control

Technologies Used
Backend
Django REST Framework

SQLite (can be configured for other databases)

VersatileImageField for image handling

Token authentication

Frontend
React.js

Material-UI components

Recharts for data visualization

React Router for navigation

Formik for form handling

Installation
Backend Setup
Clone the repository

Create and activate a virtual environment:

bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
Install dependencies:

bash
pip install -r requirements.txt
Run migrations:

bash
python manage.py migrate
Create a superuser:

bash
python manage.py createsuperuser
Run the development server:

bash
python manage.py runserver
Frontend Setup
Navigate to the frontend directory

Install dependencies:

bash
npm install
Start the development server:

bash
npm start
Configuration
Backend settings can be modified in settings.py

CORS settings should be configured for your frontend URL

Database settings can be changed in DATABASES configuration

API Endpoints
Products: /products/

Product Variants: /product-variants/

Stock Management: /stock/

Dashboard Stats: /stock/dashboard_stats/
