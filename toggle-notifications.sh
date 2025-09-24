#!/bin/bash

# Script to toggle notification system on/off

ENV_FILE="apps/backend/.env"

if [ "$1" = "off" ] || [ "$1" = "disable" ]; then
    echo "🔕 Disabling notification system..."
    
    # Update .env file
    if grep -q "DISABLE_NOTIFICATIONS" "$ENV_FILE"; then
        sed -i.bak 's/DISABLE_NOTIFICATIONS=.*/DISABLE_NOTIFICATIONS=true/' "$ENV_FILE"
    else
        echo "DISABLE_NOTIFICATIONS=true" >> "$ENV_FILE"
    fi
    
    # Comment out notification routes
    sed -i.bak 's/setupNotificationRoutes/\/\/ setupNotificationRoutes/' apps/backend/internal/routes/routes.go
    
    echo "✅ Notification system disabled"
    echo "   - Environment variable DISABLE_NOTIFICATIONS=true"
    echo "   - Notification routes commented out"
    
elif [ "$1" = "on" ] || [ "$1" = "enable" ]; then
    echo "🔔 Enabling notification system..."
    
    # Update .env file
    if grep -q "DISABLE_NOTIFICATIONS" "$ENV_FILE"; then
        sed -i.bak 's/DISABLE_NOTIFICATIONS=.*/DISABLE_NOTIFICATIONS=false/' "$ENV_FILE"
    else
        echo "DISABLE_NOTIFICATIONS=false" >> "$ENV_FILE"
    fi
    
    # Uncomment notification routes
    sed -i.bak 's/\/\/ setupNotificationRoutes/setupNotificationRoutes/' apps/backend/internal/routes/routes.go
    
    echo "✅ Notification system enabled"
    echo "   - Environment variable DISABLE_NOTIFICATIONS=false"
    echo "   - Notification routes active"
    
else
    echo "Usage: $0 [on|off|enable|disable]"
    echo ""
    echo "Current status:"
    if grep -q "DISABLE_NOTIFICATIONS=true" "$ENV_FILE" 2>/dev/null; then
        echo "🔕 Notifications: DISABLED"
    else
        echo "🔔 Notifications: ENABLED"
    fi
fi

echo ""
echo "Note: Restart the server for changes to take effect"