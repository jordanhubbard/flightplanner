FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1


FROM base AS builder

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        gcc \
        g++ \
        gdal-bin \
        libgdal-dev \
        proj-bin \
        libproj-dev \
        libgeos-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY requirements.txt ./requirements.txt

RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt


FROM base AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gdal-bin \
        libgdal-dev \
        proj-bin \
        libproj-dev \
        libgeos-dev \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/opt/venv/bin:$PATH"

COPY --from=builder /opt/venv /opt/venv

# Optional: include Beads issue tracker and CLI for local error auto-reporting.
ARG INSTALL_BD=false
RUN if [ "$INSTALL_BD" = "true" ]; then \
      apt-get update && apt-get install -y --no-install-recommends curl bash ca-certificates && \
      rm -rf /var/lib/apt/lists/* && \
      curl -sSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash ; \
    fi

WORKDIR /app
COPY .beads/ ./.beads/

WORKDIR /app/backend
COPY backend/ ./

# Railway does not fetch Git LFS objects during builds. Our data caches live in
# backend/data and are tracked via LFS, so we download the real files if the
# checkout contains LFS pointer files.
RUN python - <<'PY'
from __future__ import annotations

import pathlib
import urllib.request

files = {
    'data/airports_cache.json': 'https://media.githubusercontent.com/media/jordanhubbard/flightplanner/main/backend/data/airports_cache.json',
    'data/airspaces_us.json': 'https://media.githubusercontent.com/media/jordanhubbard/flightplanner/main/backend/data/airspaces_us.json',
    'data/airspace_cache.json': 'https://media.githubusercontent.com/media/jordanhubbard/flightplanner/main/backend/data/airspace_cache.json',
}

for rel_path, url in files.items():
    path = pathlib.Path(rel_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    needs_download = True
    if path.exists():
        try:
            head = path.read_text('utf-8', errors='ignore')[:200]
            needs_download = head.startswith('version https://git-lfs.github.com/spec')
        except Exception:
            needs_download = True

    if needs_download:
        print(f'Downloading {rel_path}...')
        urllib.request.urlretrieve(url, path)
PY

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host :: --port ${PORT:-8000}"]
