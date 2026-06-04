#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
KEYSTORE_PATH="$ANDROID_DIR/alih-daya-release.jks"
KEY_PROPERTIES_PATH="$ANDROID_DIR/key.properties"
KEY_ALIAS="${KEY_ALIAS:-alih-daya}"

if ! command -v keytool >/dev/null 2>&1; then
  echo "keytool not found. Install a JDK before creating release signing files." >&2
  exit 1
fi

if [[ -f "$KEYSTORE_PATH" || -f "$KEY_PROPERTIES_PATH" ]]; then
  echo "Signing files already exist:"
  [[ -f "$KEYSTORE_PATH" ]] && echo "- $KEYSTORE_PATH"
  [[ -f "$KEY_PROPERTIES_PATH" ]] && echo "- $KEY_PROPERTIES_PATH"
  echo "Move or delete them first if you want to regenerate signing files." >&2
  exit 1
fi

read -r -p "Store password: " -s STORE_PASSWORD
echo
read -r -p "Key password: " -s KEY_PASSWORD
echo
read -r -p "Organization name [Alih Daya Attendance]: " ORG_NAME
ORG_NAME="${ORG_NAME:-Alih Daya Attendance}"

if [[ ${#STORE_PASSWORD} -lt 8 || ${#KEY_PASSWORD} -lt 8 ]]; then
  echo "Passwords must be at least 8 characters." >&2
  exit 1
fi

keytool -genkeypair \
  -v \
  -keystore "$KEYSTORE_PATH" \
  -storepass "$STORE_PASSWORD" \
  -keypass "$KEY_PASSWORD" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias "$KEY_ALIAS" \
  -dname "CN=$ORG_NAME, OU=Mobile, O=$ORG_NAME, L=Jakarta, ST=DKI Jakarta, C=ID"

cat >"$KEY_PROPERTIES_PATH" <<EOF
storePassword=$STORE_PASSWORD
keyPassword=$KEY_PASSWORD
keyAlias=$KEY_ALIAS
storeFile=../alih-daya-release.jks
EOF

chmod 600 "$KEY_PROPERTIES_PATH"

echo
echo "Android signing files created:"
echo "- $KEYSTORE_PATH"
echo "- $KEY_PROPERTIES_PATH"
echo
echo "Keep both files private and backed up securely."
