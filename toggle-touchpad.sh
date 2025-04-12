TOUCHSCREEN=$(for dev in /sys/class/input/event*/device/name; do
    [ "$(cat "$dev")" == "ELAN901C:00 04F3:4275" ] && \
    echo "$(basename "$(dirname "$(dirname "$dev")")")" && break
done)

qdbus org.kde.KWin /org/kde/KWin/InputDevice/$TOUCHSCREEN org.freedesktop.DBus.Properties.Get org.kde.KWin.InputDevice enabled | grep -q true && qdbus org.kde.KWin /org/kde/KWin/InputDevice/$TOUCHSCREEN org.freedesktop.DBus.Properties.Set org.kde.KWin.InputDevice enabled false || qdbus org.kde.KWin /org/kde/KWin/InputDevice/$TOUCHSCREEN org.freedesktop.DBus.Properties.Set org.kde.KWin.InputDevice enabled true
