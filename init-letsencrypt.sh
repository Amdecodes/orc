#!/bin/bash
# =============================================================================
# init-letsencrypt.sh
# One-time SSL certificate bootstrap using Let's Encrypt / Certbot.
# Run ONCE before the first production `docker compose up`.
# =============================================================================
# Usage:
#   chmod +x init-letsencrypt.sh
#   ./init-letsencrypt.sh
# =============================================================================

set -e

# ── Configuration ─────────────────────────────────────────────────────────────
domains=(nationalidformatter.app admin.nationalidformatter.app)
email="your-email@example.com"   # ← CHANGE THIS to your real email
staging=0                         # Set to 1 to test with staging (avoids rate limits)
# ─────────────────────────────────────────────────────────────────────────────

rsa_key_size=4096
data_path="./certbot"

if [ -d "$data_path/conf/live/${domains[0]}" ]; then
  echo "### Existing certificate found for ${domains[0]}. Skipping."
  exit 0
fi

echo "### Creating certbot directories..."
mkdir -p "$data_path/conf" "$data_path/www"

# Download recommended TLS parameters
if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ]; then
  echo "### Downloading recommended TLS parameters..."
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/nicowillis/certbot/master/certbot/ssl-dhparams.pem \
    > "$data_path/conf/ssl-dhparams.pem"
fi

# Create temporary self-signed certs so Nginx can start for the ACME challenge
echo "### Creating temporary self-signed certificate for Nginx to start..."
for domain in "${domains[@]}"; do
  path="$data_path/conf/live/$domain"
  mkdir -p "$path"
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1 \
    -keyout "$path/privkey.pem" \
    -out "$path/fullchain.pem" \
    -subj "/CN=localhost" 2>/dev/null
done

echo "### Starting Nginx for ACME challenge..."
docker compose up --force-recreate -d nginx

# Give Nginx a moment to start
sleep 5

# Delete the temp certs so Certbot can create real ones
echo "### Removing temporary certificates..."
for domain in "${domains[@]}"; do
  rm -rf "$data_path/conf/live/$domain"
done

# Staging flag
staging_arg=""
if [ $staging -eq 1 ]; then
  staging_arg="--staging"
fi

# Request real certificates for each domain
echo "### Requesting Let's Encrypt certificates..."
for domain in "${domains[@]}"; do
  docker compose run --rm certbot certonly --webroot \
    -w /var/www/certbot \
    $staging_arg \
    --email $email \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $domain
done

echo "### Reloading Nginx with real certificates..."
docker compose exec nginx nginx -s reload

echo ""
echo "✅ SSL certificates issued successfully!"
echo "   Run './deploy.sh' to start the full production stack."
