# Changelog

## v1.0
- Form Builder schema fixes and dynamic schema rendering updates.
- Buluntu create flow refinements (explicit form selection, optional notes on create).
- Anakod/Buluntu modal layering fixes.
- Envanterlik (inventory-only) Buluntu list and filtering.
- Icon-based actions for view/edit/delete and export.


## Docker Steps
- docker compose down -v
- docker compose build frontend backend
- docker compose up
- docker compose exec backend python manage.py makemigrations
- docker compose exec backend python manage.py migrate
- docker compose exec backend python manage.py createsuperuser
- docker compose exec backend python manage.py seed_formbuilder

## Docker Rebuild Steps
- docker compose up -d --build
